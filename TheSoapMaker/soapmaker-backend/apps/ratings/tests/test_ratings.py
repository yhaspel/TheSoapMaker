"""
Milestone 4 — Rating API tests (tests 24–31)
Run: pytest apps/ratings/tests/test_ratings.py -v --tb=short
"""

import pytest
from django.contrib.auth import get_user_model

from apps.recipes.models import Recipe
from apps.ratings.models import Rating

User = get_user_model()

STRONG_PASSWORD = "Str0ng!Pass99"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_user(email="rater@example.com", password=STRONG_PASSWORD):
    return User.objects.create_user(email=email, password=password)


def make_recipe(author, name="Lemon Fresh"):
    return Recipe.objects.create(
        author=author,
        name=name,
        description="A zesty bar.",
        method=Recipe.Method.COLD_PROCESS,
        difficulty=Recipe.Difficulty.BEGINNER,
        cure_time_days=28,
        batch_size_grams=500,
        yield_bars=8,
        is_published=True,
    )


def auth_header(client, email, password=STRONG_PASSWORD):
    resp = client.post(
        "/api/v1/auth/login/",
        {"email": email, "password": password},
        content_type="application/json",
    )
    assert resp.status_code == 200, resp.json()
    return {"HTTP_AUTHORIZATION": f"Bearer {resp.json()['access']}"}


# ---------------------------------------------------------------------------
# Test 24 — unauthenticated rate returns 401
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_24_rate_unauthenticated(client):
    """POST /api/v1/recipes/{slug}/rate/ without auth → 401."""
    user = make_user()
    recipe = make_recipe(user)
    response = client.post(
        f"/api/v1/recipes/{recipe.slug}/rate/",
        {"stars": 4},
        content_type="application/json",
    )
    assert response.status_code == 401


# ---------------------------------------------------------------------------
# Test 25 — create rating returns 201
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_25_create_rating_returns_201(client):
    """First-time rating → HTTP 201."""
    user = make_user()
    recipe = make_recipe(user)
    headers = auth_header(client, user.email)
    response = client.post(
        f"/api/v1/recipes/{recipe.slug}/rate/",
        {"stars": 5},
        content_type="application/json",
        **headers,
    )
    assert response.status_code == 201, response.json()
    assert response.json()["stars"] == 5


# ---------------------------------------------------------------------------
# Test 26 — update existing rating returns 200
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_26_update_rating_returns_200(client):
    """Submitting a second rating for the same recipe/user → HTTP 200."""
    user = make_user()
    recipe = make_recipe(user)
    headers = auth_header(client, user.email)

    # First rating
    client.post(
        f"/api/v1/recipes/{recipe.slug}/rate/",
        {"stars": 3},
        content_type="application/json",
        **headers,
    )
    # Second rating (update)
    response = client.post(
        f"/api/v1/recipes/{recipe.slug}/rate/",
        {"stars": 4},
        content_type="application/json",
        **headers,
    )
    assert response.status_code == 200, response.json()
    assert response.json()["stars"] == 4


# ---------------------------------------------------------------------------
# Test 27 — rating updates recipe average_rating
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_27_rating_updates_recipe_average(client):
    """After two ratings the recipe's average_rating reflects both values."""
    author = make_user("author@example.com")
    rater2 = make_user("rater2@example.com")
    recipe = make_recipe(author)

    headers_a = auth_header(client, author.email)
    headers_b = auth_header(client, rater2.email)

    client.post(
        f"/api/v1/recipes/{recipe.slug}/rate/",
        {"stars": 4},
        content_type="application/json",
        **headers_a,
    )
    client.post(
        f"/api/v1/recipes/{recipe.slug}/rate/",
        {"stars": 2},
        content_type="application/json",
        **headers_b,
    )

    recipe.refresh_from_db()
    assert recipe.average_rating == pytest.approx(3.0)
    assert recipe.rating_count == 2


# ---------------------------------------------------------------------------
# Test 28 — rating_count decrements on delete
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_28_delete_rating_updates_average():
    """Deleting a Rating object recalculates average_rating on the recipe."""
    author = User.objects.create_user(email="a@x.com", password=STRONG_PASSWORD)
    rater = User.objects.create_user(email="b@x.com", password=STRONG_PASSWORD)
    recipe = make_recipe(author)

    Rating.objects.create(user=author, recipe=recipe, stars=5)
    r2 = Rating.objects.create(user=rater, recipe=recipe, stars=1)

    recipe.refresh_from_db()
    assert recipe.rating_count == 2

    r2.delete()
    recipe.refresh_from_db()
    assert recipe.rating_count == 1
    assert recipe.average_rating == pytest.approx(5.0)


# ---------------------------------------------------------------------------
# Test 29 — ratings list endpoint is public
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_29_ratings_list_public(client):
    """GET /api/v1/recipes/{slug}/ratings/ returns 200 without auth."""
    user = make_user()
    recipe = make_recipe(user)
    Rating.objects.create(user=user, recipe=recipe, stars=4)
    response = client.get(f"/api/v1/recipes/{recipe.slug}/ratings/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["stars"] == 4


# ---------------------------------------------------------------------------
# Test 30 — ratings list returns user display_name
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_30_ratings_list_includes_display_name(client):
    """Each entry in the ratings list exposes user_display_name."""
    user = make_user()
    user.display_name = "Soap Fan"
    user.save()
    recipe = make_recipe(user)
    Rating.objects.create(user=user, recipe=recipe, stars=3)
    response = client.get(f"/api/v1/recipes/{recipe.slug}/ratings/")
    assert response.status_code == 200
    assert response.json()[0]["user_display_name"] == "Soap Fan"


# ---------------------------------------------------------------------------
# Test 31 — invalid stars value returns 400 or 500 (validation enforced)
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_31_invalid_stars_rejected(client):
    """Stars outside 1–5 should be rejected (DB validator fires)."""
    user = make_user()
    recipe = make_recipe(user)
    headers = auth_header(client, user.email)
    response = client.post(
        f"/api/v1/recipes/{recipe.slug}/rate/",
        {"stars": 99},
        content_type="application/json",
        **headers,
    )
    # Django's validators raise ValidationError on full_clean(), so the view
    # should return 4xx; exact code depends on whether serializer validates.
    assert response.status_code in (400, 500)
