"""
Stripe integration service.

All Stripe API calls are isolated here so tests can mock this module
without hitting the real Stripe API.
"""

import stripe
from django.conf import settings


class StripeService:
    """Thin wrapper around the Stripe SDK for subscription management."""

    def __init__(self):
        stripe.api_key = getattr(settings, "STRIPE_SECRET_KEY", "sk_test_placeholder")

    # ------------------------------------------------------------------
    # Customer
    # ------------------------------------------------------------------

    def get_or_create_customer(self, user) -> str:
        """
        Return the Stripe customer ID for *user*.
        Creates a new Stripe customer if none exists on the subscription row.
        """
        sub = getattr(user, "subscription", None)
        if sub and sub.stripe_customer_id:
            return sub.stripe_customer_id

        customer = stripe.Customer.create(
            email=user.email,
            name=user.display_name or user.email,
            metadata={"user_id": str(user.id)},
        )
        if sub:
            sub.stripe_customer_id = customer["id"]
            sub.save(update_fields=["stripe_customer_id"])
        return customer["id"]

    # ------------------------------------------------------------------
    # Checkout
    # ------------------------------------------------------------------

    def create_checkout_session(self, user, price_id: str, success_url: str, cancel_url: str) -> dict:
        """
        Create a Stripe Checkout Session for a subscription purchase.

        Returns the full Session object (as a dict) so the caller can
        extract ``session["url"]`` and redirect the user.
        """
        customer_id = self.get_or_create_customer(user)

        session = stripe.checkout.Session.create(
            customer=customer_id,
            payment_method_types=["card"],
            line_items=[{"price": price_id, "quantity": 1}],
            mode="subscription",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={"user_id": str(user.id)},
        )
        return session

    # ------------------------------------------------------------------
    # Cancellation
    # ------------------------------------------------------------------

    def cancel_subscription(self, stripe_subscription_id: str) -> dict:
        """
        Schedule a subscription for cancellation at the end of the
        current billing period (``cancel_at_period_end=True``).
        """
        subscription = stripe.Subscription.modify(
            stripe_subscription_id,
            cancel_at_period_end=True,
        )
        return subscription

    # ------------------------------------------------------------------
    # Webhook event construction
    # ------------------------------------------------------------------

    def construct_webhook_event(self, payload: bytes, sig_header: str) -> dict:
        """
        Verify and construct a Stripe webhook event.

        Raises ``stripe.error.SignatureVerificationError`` if the
        signature is invalid.
        """
        webhook_secret = getattr(settings, "STRIPE_WEBHOOK_SECRET", "")
        return stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
