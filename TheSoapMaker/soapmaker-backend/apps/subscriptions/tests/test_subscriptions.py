"""
Milestone 4 — Subscription API tests (tests 40–50)
Run: pytest apps/subscriptions/tests/test_subscriptions.py -v --tb=short

All Stripe SDK calls are mocked — no real network requests are made.
"""

import json
from unittest.mock import MagicMock, patch

import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.subscriptions.models import Subscription

User = get_user_model()

STRONG_PASSWORD = "Str0ng!Pass99"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_user(email="sub_user@example.com"):
    return User.objects.create_user(email=email, password=STRONG_PASSWORD)


def auth_header(client, email, password=STRONG_PASSWORD):
    resp = client.post(
        "/api/v1/auth/login/",
        {"email": email, "password": password},
        content_type="application/json",
    )
    assert resp.status_code == 200, resp.json()
    return {"HTTP_AUTHORIZATION": f"Bearer {resp.json()['access']}"}


def make_subscription(user, plan=Subscription.Plan.PREMIUM_MONTHLY, status=Subscription.Status.ACTIVE):
    return Subscription.objects.create(
        user=user,
        plan=plan,
        status=status,
        stripe_customer_id="cus_test",
        stripe_subscription_id="sub_test",
    )


# ---------------------------------------------------------------------------
# Test 40 — status endpoint requires auth
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_40_subscription_status_requires_auth(client):
    """GET /api/v1/subscriptions/status/ without auth → 401."""
    response = client.get("/api/v1/subscriptions/status/")
    assert response.status_code == 401


# ---------------------------------------------------------------------------
# Test 41 — status returns free plan when no subscription row exists
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_41_status_free_when_no_subscription(client):
    """User with no Subscription row sees plan=free."""
    user = make_user()
    headers = auth_header(client, user.email)
    response = client.get("/api/v1/subscriptions/status/", **headers)
    assert response.status_code == 200
    assert response.json()["plan"] == "free"


# ---------------------------------------------------------------------------
# Test 42 — status returns correct plan for premium subscriber
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_42_status_premium_plan(client):
    """User with an active premium subscription sees plan=premium_monthly."""
    user = make_user()
    make_subscription(user)
    headers = auth_header(client, user.email)
    response = client.get("/api/v1/subscriptions/status/", **headers)
    assert response.status_code == 200
    assert response.json()["plan"] == "premium_monthly"
    assert response.json()["status"] == "active"


# ---------------------------------------------------------------------------
# Test 43 — status includes trial_days_remaining
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_43_status_includes_trial_days_remaining(client):
    """Subscription status response contains trial_days_remaining field."""
    user = make_user()
    # trial_ends_at is set automatically in CustomUser.save()
    make_subscription(user)
    headers = auth_header(client, user.email)
    response = client.get("/api/v1/subscriptions/status/", **headers)
    assert response.status_code == 200
    data = response.json()
    assert "trial_days_remaining" in data


# ---------------------------------------------------------------------------
# Test 44 — checkout requires auth
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_44_checkout_requires_auth(client):
    """POST /api/v1/subscriptions/checkout/ without auth → 401."""
    response = client.post(
        "/api/v1/subscriptions/checkout/",
        {"price_id": "price_xxx", "success_url": "https://ex.com/ok", "cancel_url": "https://ex.com/cancel"},
        content_type="application/json",
    )
    assert response.status_code == 401


# ---------------------------------------------------------------------------
# Test 45 — checkout returns checkout_url (Stripe mocked)
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_45_checkout_returns_url(client):
    """POST /api/v1/subscriptions/checkout/ → 200, checkout_url returned."""
    user = make_user()
    headers = auth_header(client, user.email)

    mock_session = {"url": "https://checkout.stripe.com/pay/test_session"}

    with patch(
        "apps.subscriptions.views.StripeService.create_checkout_session",
        return_value=mock_session,
    ):
        response = client.post(
            "/api/v1/subscriptions/checkout/",
            {
                "price_id": "price_test",
                "success_url": "https://example.com/ok",
                "cancel_url": "https://example.com/cancel",
            },
            content_type="application/json",
            **headers,
        )

    assert response.status_code == 200, response.json()
    assert response.json()["checkout_url"] == "https://checkout.stripe.com/pay/test_session"


# ---------------------------------------------------------------------------
# Test 46 — checkout with missing params returns 400
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_46_checkout_missing_params_returns_400(client):
    """POST /api/v1/subscriptions/checkout/ with missing fields → 400."""
    user = make_user()
    headers = auth_header(client, user.email)
    response = client.post(
        "/api/v1/subscriptions/checkout/",
        {"price_id": "price_test"},  # missing success_url and cancel_url
        content_type="application/json",
        **headers,
    )
    assert response.status_code == 400


# ---------------------------------------------------------------------------
# Test 47 — cancel sets cancel_at_period_end
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_47_cancel_sets_flag(client):
    """POST /api/v1/subscriptions/cancel/ → 200, cancel_at_period_end = True."""
    user = make_user()
    sub = make_subscription(user)
    headers = auth_header(client, user.email)

    with patch("apps.subscriptions.views.StripeService.cancel_subscription", return_value={}):
        response = client.post("/api/v1/subscriptions/cancel/", **headers)

    assert response.status_code == 200, response.json()
    sub.refresh_from_db()
    assert sub.cancel_at_period_end is True


# ---------------------------------------------------------------------------
# Test 48 — cancel without subscription returns 404
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_48_cancel_no_subscription_returns_404(client):
    """POST /api/v1/subscriptions/cancel/ with no Subscription row → 404."""
    user = make_user()
    headers = auth_header(client, user.email)
    response = client.post("/api/v1/subscriptions/cancel/", **headers)
    assert response.status_code == 404


# ---------------------------------------------------------------------------
# Test 49 — post_save signal syncs user.is_premium
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_49_subscription_signal_sets_is_premium():
    """Saving an active premium Subscription flips user.is_premium to True."""
    user = make_user()
    assert user.is_premium is False

    sub = Subscription.objects.create(
        user=user,
        plan=Subscription.Plan.PREMIUM_MONTHLY,
        status=Subscription.Status.ACTIVE,
    )

    user.refresh_from_db()
    assert user.is_premium is True


# ---------------------------------------------------------------------------
# Test 50 — canceling subscription clears user.is_premium
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_50_cancel_subscription_clears_premium():
    """Changing subscription to canceled plan clears user.is_premium."""
    user = make_user()
    sub = Subscription.objects.create(
        user=user,
        plan=Subscription.Plan.PREMIUM_MONTHLY,
        status=Subscription.Status.ACTIVE,
    )
    user.refresh_from_db()
    assert user.is_premium is True

    sub.status = Subscription.Status.CANCELED
    sub.plan = Subscription.Plan.FREE
    sub.save()

    user.refresh_from_db()
    assert user.is_premium is False
