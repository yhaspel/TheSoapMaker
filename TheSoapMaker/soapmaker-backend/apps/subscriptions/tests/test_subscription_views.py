"""Tests for subscription views — covers checkout, cancel, status edge cases."""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from unittest.mock import patch, MagicMock
from apps.subscriptions.models import Subscription

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def user(db):
    return User.objects.create_user(email="sub@example.com", password="pass1234!")

@pytest.fixture
def authed_client(api_client, user):
    api_client.force_authenticate(user=user)
    return api_client

@pytest.mark.django_db
class TestSubscriptionStatus:
    def test_unauthenticated_returns_401(self, api_client):
        resp = api_client.get("/api/v1/subscriptions/status/")
        assert resp.status_code == 401

    def test_returns_free_plan_when_no_subscription(self, authed_client):
        resp = authed_client.get("/api/v1/subscriptions/status/")
        assert resp.status_code == 200
        assert resp.data["plan"] == "free"

    def test_returns_existing_subscription(self, authed_client, user):
        from django.utils import timezone
        sub = Subscription.objects.create(
            user=user,
            plan=Subscription.Plan.PREMIUM,
            status=Subscription.Status.ACTIVE,
            current_period_end=timezone.now() + timezone.timedelta(days=30),
        )
        resp = authed_client.get("/api/v1/subscriptions/status/")
        assert resp.status_code == 200
        assert resp.data["plan"] == "premium"

@pytest.mark.django_db
class TestCreateCheckout:
    def test_unauthenticated_returns_401(self, api_client):
        resp = api_client.post("/api/v1/subscriptions/checkout/", {})
        assert resp.status_code == 401

    def test_missing_fields_returns_400(self, authed_client):
        resp = authed_client.post("/api/v1/subscriptions/checkout/", {"price_id": "price_123"})
        assert resp.status_code == 400

    @patch("apps.subscriptions.views.StripeService")
    def test_returns_checkout_url(self, mock_stripe_cls, authed_client):
        mock_service = MagicMock()
        mock_service.create_checkout_session.return_value = MagicMock(url="https://checkout.stripe.com/test")
        mock_stripe_cls.return_value = mock_service
        resp = authed_client.post(
            "/api/v1/subscriptions/checkout/",
            {"price_id": "price_123", "success_url": "https://app.com/success", "cancel_url": "https://app.com/cancel"},
        )
        assert resp.status_code == 200
        assert "checkout_url" in resp.data
