"""
Milestone 2 — Auth & User API tests
Run: pytest apps/users/tests/ -v --tb=short
All 16 tests must pass.
"""

import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
import jwt as pyjwt

User = get_user_model()

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

VALID_EMAIL = "soapsmith@example.com"
VALID_PASSWORD = "Str0ng!Pass99"


@pytest.fixture
def registered_user(db):
    """A user that has already been through the registration flow."""
    response_data = _register(None, VALID_EMAIL, VALID_PASSWORD)
    return User.objects.get(email=VALID_EMAIL)


def _register(client_unused, email: str, password: str):
    """Helper — returns the raw User object after registration."""
    user = User.objects.create_user(email=email, password=password)
    return user


@pytest.fixture
def auth_client(client, registered_user):
    """Django test client with the JWT access token already attached."""
    response = client.post(
        "/api/v1/auth/login/",
        {"email": VALID_EMAIL, "password": VALID_PASSWORD},
        content_type="application/json",
    )
    assert response.status_code == 200, response.json()
    access = response.json()["access"]
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {access}"
    return client, response.json()


# ---------------------------------------------------------------------------
# Registration tests (1–5)
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_1_successful_registration(client):
    """POST /auth/registration/ with valid credentials → HTTP 201, access token returned."""
    response = client.post(
        "/api/v1/auth/registration/",
        {"email": "new@example.com", "password1": VALID_PASSWORD, "password2": VALID_PASSWORD},
        content_type="application/json",
    )
    assert response.status_code == 201, response.json()
    data = response.json()
    assert "access" in data, "Expected 'access' token in response"


@pytest.mark.django_db
def test_2_registration_sets_trial_fields(client):
    """POST /auth/registration/ → user has trial_started_at and trial_ends_at set."""
    client.post(
        "/api/v1/auth/registration/",
        {"email": "trial@example.com", "password1": VALID_PASSWORD, "password2": VALID_PASSWORD},
        content_type="application/json",
    )
    user = User.objects.get(email="trial@example.com")
    assert user.trial_started_at is not None, "trial_started_at should be set on registration"
    assert user.trial_ends_at is not None, "trial_ends_at should be set on registration"
    expected_delta = timedelta(days=7)
    actual_delta = user.trial_ends_at - user.trial_started_at
    # Allow a 5-second tolerance for test timing
    assert abs(actual_delta.total_seconds() - expected_delta.total_seconds()) < 5


@pytest.mark.django_db
def test_3_duplicate_email_rejected(client):
    """Registering the same email twice → HTTP 400."""
    payload = {
        "email": VALID_EMAIL,
        "password1": VALID_PASSWORD,
        "password2": VALID_PASSWORD,
    }
    client.post("/api/v1/auth/registration/", payload, content_type="application/json")
    response = client.post("/api/v1/auth/registration/", payload, content_type="application/json")
    assert response.status_code == 400


@pytest.mark.django_db
def test_4_weak_password_rejected(client):
    """Password '123' is too short / too common → HTTP 400."""
    response = client.post(
        "/api/v1/auth/registration/",
        {"email": "weak@example.com", "password1": "123", "password2": "123"},
        content_type="application/json",
    )
    assert response.status_code == 400


@pytest.mark.django_db
def test_5_missing_email_rejected(client):
    """Registration without an email field → HTTP 400."""
    response = client.post(
        "/api/v1/auth/registration/",
        {"password1": VALID_PASSWORD, "password2": VALID_PASSWORD},
        content_type="application/json",
    )
    assert response.status_code == 400


# ---------------------------------------------------------------------------
# Login tests (6–9)
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_6_successful_login(client, registered_user):
    """POST /auth/login/ with valid credentials → HTTP 200, access + refresh tokens."""
    response = client.post(
        "/api/v1/auth/login/",
        {"email": VALID_EMAIL, "password": VALID_PASSWORD},
        content_type="application/json",
    )
    assert response.status_code == 200, response.json()
    data = response.json()
    assert "access" in data, "Expected 'access' in login response"
    assert "refresh" in data, "Expected 'refresh' in login response"


@pytest.mark.django_db
def test_7_wrong_password_rejected(client, registered_user):
    """Login with correct email but wrong password → HTTP 400."""
    response = client.post(
        "/api/v1/auth/login/",
        {"email": VALID_EMAIL, "password": "WrongPassword!"},
        content_type="application/json",
    )
    assert response.status_code == 400


@pytest.mark.django_db
def test_8_unknown_email_rejected(client):
    """Login with an email that was never registered → HTTP 400."""
    response = client.post(
        "/api/v1/auth/login/",
        {"email": "ghost@example.com", "password": VALID_PASSWORD},
        content_type="application/json",
    )
    assert response.status_code == 400


@pytest.mark.django_db
def test_9_access_token_is_15_minutes(client, registered_user):
    """Decoded access token must have a lifetime of exactly 900 seconds (15 min)."""
    response = client.post(
        "/api/v1/auth/login/",
        {"email": VALID_EMAIL, "password": VALID_PASSWORD},
        content_type="application/json",
    )
    assert response.status_code == 200
    access = response.json()["access"]
    # Decode without verifying signature so we can inspect the claims
    payload = pyjwt.decode(access, options={"verify_signature": False})
    lifetime_seconds = payload["exp"] - payload["iat"]
    assert lifetime_seconds == 900, (
        f"Expected access token lifetime of 900s, got {lifetime_seconds}s"
    )


# ---------------------------------------------------------------------------
# Token refresh tests (10–12)
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_10_refresh_succeeds_with_valid_token(client, registered_user):
    """POST /auth/token/refresh/ with a valid refresh token → HTTP 200, new access token."""
    login = client.post(
        "/api/v1/auth/login/",
        {"email": VALID_EMAIL, "password": VALID_PASSWORD},
        content_type="application/json",
    )
    refresh = login.json()["refresh"]
    response = client.post(
        "/api/v1/auth/token/refresh/",
        {"refresh": refresh},
        content_type="application/json",
    )
    assert response.status_code == 200, response.json()
    assert "access" in response.json()


@pytest.mark.django_db
def test_11_old_refresh_token_blacklisted_after_rotation(client, registered_user):
    """After using a refresh token, the original must be blacklisted (rotation enabled)."""
    login = client.post(
        "/api/v1/auth/login/",
        {"email": VALID_EMAIL, "password": VALID_PASSWORD},
        content_type="application/json",
    )
    original_refresh = login.json()["refresh"]

    # Use the refresh token once (this rotates it)
    client.post(
        "/api/v1/auth/token/refresh/",
        {"refresh": original_refresh},
        content_type="application/json",
    )

    # Using the original refresh again must now fail
    second_attempt = client.post(
        "/api/v1/auth/token/refresh/",
        {"refresh": original_refresh},
        content_type="application/json",
    )
    assert second_attempt.status_code in (400, 401), (
        "Original refresh token should be blacklisted after rotation"
    )


@pytest.mark.django_db
def test_12_invalid_refresh_token_rejected(client):
    """Garbage refresh token → HTTP 401."""
    response = client.post(
        "/api/v1/auth/token/refresh/",
        {"refresh": "this.is.not.a.valid.jwt"},
        content_type="application/json",
    )
    assert response.status_code in (400, 401)


# ---------------------------------------------------------------------------
# Profile tests (13–15)
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_13_get_own_profile(auth_client):
    """GET /auth/user/ while authenticated → HTTP 200 with email, display_name, trial_ends_at."""
    client, tokens = auth_client
    response = client.get("/api/v1/auth/user/")
    assert response.status_code == 200, response.json()
    data = response.json()
    assert "email" in data
    assert "display_name" in data
    assert "trial_ends_at" in data


@pytest.mark.django_db
def test_14_put_updates_display_name(auth_client):
    """PUT /auth/user/ with display_name → HTTP 200, display_name persisted."""
    client, tokens = auth_client
    response = client.put(
        "/api/v1/auth/user/",
        {"display_name": "Soapsmith"},
        content_type="application/json",
    )
    assert response.status_code == 200, response.json()
    assert response.json()["display_name"] == "Soapsmith"

    # Verify it's actually in the DB
    user = User.objects.get(email=VALID_EMAIL)
    assert user.display_name == "Soapsmith"


@pytest.mark.django_db
def test_15_unauthenticated_profile_returns_401(client):
    """GET /auth/user/ without an Authorization header → HTTP 401."""
    response = client.get("/api/v1/auth/user/")
    assert response.status_code == 401


# ---------------------------------------------------------------------------
# Logout test (16)
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_16_logout_blacklists_refresh_token(client, registered_user):
    """POST /auth/logout/ with the refresh token → subsequent refresh attempt fails."""
    # Login to get tokens
    login = client.post(
        "/api/v1/auth/login/",
        {"email": VALID_EMAIL, "password": VALID_PASSWORD},
        content_type="application/json",
    )
    tokens = login.json()
    access = tokens["access"]
    refresh = tokens["refresh"]

    # Logout (sends the refresh token to be blacklisted)
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {access}"
    logout_response = client.post(
        "/api/v1/auth/logout/",
        {"refresh": refresh},
        content_type="application/json",
    )
    assert logout_response.status_code in (200, 204), logout_response.json()

    # Clear auth header before trying refresh
    del client.defaults["HTTP_AUTHORIZATION"]

    # Refresh attempt after logout must fail
    refresh_response = client.post(
        "/api/v1/auth/token/refresh/",
        {"refresh": refresh},
        content_type="application/json",
    )
    assert refresh_response.status_code in (400, 401), (
        "Refresh token should be blacklisted after logout"
    )
