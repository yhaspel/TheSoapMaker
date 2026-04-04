import logging

from django.utils import timezone
from rest_framework import status, serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, inline_serializer

from .models import Subscription
from .serializers import SubscriptionSerializer
from .stripe_service import StripeService

logger = logging.getLogger(__name__)


class SubscriptionStatusView(APIView):
    """GET /api/v1/subscriptions/status/  — returns the user's current subscription."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            sub = request.user.subscription
        except Subscription.DoesNotExist:
            return Response(
                {
                    "plan": Subscription.Plan.FREE,
                    "status": Subscription.Status.ACTIVE,
                    "current_period_end": None,
                    "cancel_at_period_end": False,
                    "trial_days_remaining": _trial_days_remaining(request.user),
                }
            )
        serializer = SubscriptionSerializer(sub)
        return Response(serializer.data)


class CreateCheckoutView(APIView):
    """
    POST /api/v1/subscriptions/checkout/
    Body: { "price_id": "price_xxx", "success_url": "...", "cancel_url": "..." }
    Returns: { "checkout_url": "https://checkout.stripe.com/..." }
    """

    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Create Stripe checkout session",
        description="Creates a Stripe checkout session and returns the checkout URL.",
        request=inline_serializer(name='CheckoutRequest', fields={'price_id': serializers.CharField(), 'success_url': serializers.CharField(), 'cancel_url': serializers.CharField()}),
        responses={200: inline_serializer(name='CheckoutResponse', fields={'checkout_url': serializers.CharField()})},
        tags=["subscriptions"],
    )
    def post(self, request):
        price_id = request.data.get("price_id")
        success_url = request.data.get("success_url")
        cancel_url = request.data.get("cancel_url")

        if not all([price_id, success_url, cancel_url]):
            return Response(
                {"detail": "price_id, success_url, and cancel_url are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            service = StripeService()
            session = service.create_checkout_session(
                user=request.user,
                price_id=price_id,
                success_url=success_url,
                cancel_url=cancel_url,
            )
            return Response({"checkout_url": session["url"]}, status=status.HTTP_200_OK)
        except Exception as exc:
            logger.exception("Stripe checkout error: %s", exc)
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)


class CancelView(APIView):
    """
    POST /api/v1/subscriptions/cancel/
    Schedules the user's subscription to cancel at period end.
    """

    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Cancel subscription",
        description="Schedules the user's subscription to cancel at period end.",
        responses={200: None, 404: None, 400: None},
        tags=["subscriptions"],
    )
    def post(self, request):
        try:
            sub = request.user.subscription
        except Subscription.DoesNotExist:
            return Response({"detail": "No active subscription found."}, status=status.HTTP_404_NOT_FOUND)

        if not sub.stripe_subscription_id:
            return Response({"detail": "No Stripe subscription linked."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            service = StripeService()
            service.cancel_subscription(sub.stripe_subscription_id)
            sub.cancel_at_period_end = True
            sub.save(update_fields=["cancel_at_period_end"])
            return Response({"detail": "Subscription will cancel at period end."}, status=status.HTTP_200_OK)
        except Exception as exc:
            logger.exception("Stripe cancellation error: %s", exc)
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)


class WebhookView(APIView):
    """
    POST /api/v1/subscriptions/webhook/
    Receives and processes Stripe webhook events.
    The Stripe-Signature header is verified using the webhook secret.
    """

    # Stripe sends raw bytes — disable DRF parsers and authentication for this endpoint.
    authentication_classes = []
    permission_classes = []

    @extend_schema(
        summary="Stripe webhook handler",
        description="Processes Stripe webhook events. Signature verification required.",
        responses={200: None, 400: None},
        tags=["subscriptions"],
    )
    def post(self, request):
        import stripe

        payload = request.body
        sig_header = request.META.get("HTTP_STRIPE_SIGNATURE", "")

        try:
            service = StripeService()
            event = service.construct_webhook_event(payload, sig_header)
        except stripe.error.SignatureVerificationError:
            return Response({"detail": "Invalid signature."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            logger.exception("Webhook construction error: %s", exc)
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        _handle_event(event)
        return Response({"status": "ok"}, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _trial_days_remaining(user) -> int | None:
    if not user.trial_ends_at:
        return None
    delta = user.trial_ends_at - timezone.now()
    return max(delta.days, 0) if delta.total_seconds() > 0 else 0


def _handle_event(event: dict) -> None:
    """Dispatch Stripe webhook events to the appropriate handler."""
    event_type = event.get("type", "")
    data_object = event.get("data", {}).get("object", {})

    if event_type in ("customer.subscription.updated", "customer.subscription.created"):
        _sync_subscription(data_object)
    elif event_type == "customer.subscription.deleted":
        _cancel_subscription(data_object)
    else:
        logger.debug("Unhandled Stripe event type: %s", event_type)


def _sync_subscription(stripe_sub: dict) -> None:
    """Update local Subscription row from a Stripe subscription object."""
    from django.contrib.auth import get_user_model
    import datetime

    User = get_user_model()
    customer_id = stripe_sub.get("customer")
    if not customer_id:
        return

    try:
        sub = Subscription.objects.get(stripe_customer_id=customer_id)
    except Subscription.DoesNotExist:
        logger.warning("Received webhook for unknown customer %s", customer_id)
        return

    # Map Stripe status to our Status choices
    stripe_status = stripe_sub.get("status", "active")
    status_map = {
        "active": Subscription.Status.ACTIVE,
        "canceled": Subscription.Status.CANCELED,
        "past_due": Subscription.Status.PAST_DUE,
        "trialing": Subscription.Status.TRIALING,
    }
    sub.status = status_map.get(stripe_status, Subscription.Status.ACTIVE)
    sub.stripe_subscription_id = stripe_sub.get("id", sub.stripe_subscription_id)
    sub.cancel_at_period_end = stripe_sub.get("cancel_at_period_end", False)

    period_end_ts = stripe_sub.get("current_period_end")
    if period_end_ts:
        sub.current_period_end = datetime.datetime.fromtimestamp(period_end_ts, tz=datetime.timezone.utc)

    # Determine plan from first item's price metadata or fallback
    items = stripe_sub.get("items", {}).get("data", [])
    if items:
        interval = items[0].get("price", {}).get("recurring", {}).get("interval", "month")
        sub.plan = (
            Subscription.Plan.PREMIUM_ANNUAL if interval == "year" else Subscription.Plan.PREMIUM_MONTHLY
        )

    sub.save()


def _cancel_subscription(stripe_sub: dict) -> None:
    """Mark local subscription as canceled when Stripe fires a deletion event."""
    customer_id = stripe_sub.get("customer")
    if not customer_id:
        return
    try:
        sub = Subscription.objects.get(stripe_customer_id=customer_id)
        sub.status = Subscription.Status.CANCELED
        sub.plan = Subscription.Plan.FREE
        sub.save()
    except Subscription.DoesNotExist:
        logger.warning("Received deletion webhook for unknown customer %s", customer_id)
