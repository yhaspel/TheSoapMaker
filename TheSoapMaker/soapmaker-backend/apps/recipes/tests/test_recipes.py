"""
Milestone 3 — Recipe API tests (tests 4–23)
Run: pytest apps/recipes/tests/test_recipes.py -v --tb=short
"""

import pytest
from django.contrib.auth import get_user_model

from apps.recipes.models import Ingredient, Recipe, RecipeIngredient, Step, Tag

User = get_user_model()

# ---------------------------------------------------------------------------
# Shared helpers & fixtures
# ---------------------------------------------------------------------------

STRONG_PASSWORD = "Str0ng!Pass99"


def make_user(email="author@example.com", password=STRONG_PASSWORD):
    return User.objects.create_user(email=email, password=password)


def auth_header(client, email, password):
    """Log in and return an Authorization header dict."""
    resp = client.post(
        "/api/v1/auth/login/",
        {"email": email, "password": password},
        content_type="application/json",
    )
    assert resp.status_code == 200, resp.json()
    return {"HTTP_AUTHORIZATION": f"Bearer {resp.json()['access']}"}


def make_recipe(author, name="Lavender Dream", published=True, **kwargs):
    return Recipe.objects.create(
        author=author,
        name=name,
        description="A relaxing lavender soap.",
        method=Recipe.Method.COLD_PROCESS,
        difficulty=Recipe.Difficulty.BEGINNER,
        cure_time_days=28,
        batch_size_grams=500,
        yield_bars=8,
        is_published=published,
        **kwargs,
    )


VALID_PAYLOAD = {
    "name": "Peppermint Delight",
    "description": "A fresh, invigorating bar.",
    "method": "cold_process",
    "difficulty": "beginner",
    "cure_time_days": 28,
    "batch_size_grams": 500,
    "yield_bars": 8,
    "is_published": True,
}


# ---------------------------------------------------------------------------
# Recipe list & filter tests (4–10)
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_4_recipe_list_public(client):
    """GET /api/v1/recipes/ (no auth) returns HTTP 200 with paginated results."""
    user = make_user()
    make_recipe(user)
    response = client.get("/api/v1/recipes/")
    assert response.status_code == 200
    data = response.json()
    # DRF pagination wraps results in {count, next, previous, results}
    assert "results" in data
    assert data["count"] >= 1


@pytest.mark.django_db
def test_5_search_filter(client):
    """?search=lavender only returns recipes matching 'lavender' in name/description/tags."""
    user = make_user()
    make_recipe(user, name="Lavender Dream")
    make_recipe(user, name="Rose Blossom")
    response = client.get("/api/v1/recipes/?search=lavender")
    assert response.status_code == 200
    results = response.json()["results"]
    assert all("lavender" in r["name"].lower() for r in results)
    assert len(results) == 1


@pytest.mark.django_db
def test_6_method_filter(client):
    """?method=cold_process returns only cold-process recipes."""
    user = make_user()
    make_recipe(user, name="Cold Bar", method=Recipe.Method.COLD_PROCESS)
    make_recipe(user, name="HP Bar", method=Recipe.Method.HOT_PROCESS)
    response = client.get("/api/v1/recipes/?method=cold_process")
    assert response.status_code == 200
    results = response.json()["results"]
    assert all(r["method"] == "cold_process" for r in results)


@pytest.mark.django_db
def test_7_difficulty_filter(client):
    """?difficulty=beginner returns only beginner recipes."""
    user = make_user()
    make_recipe(user, name="Easy Bar", difficulty=Recipe.Difficulty.BEGINNER)
    make_recipe(user, name="Hard Bar", difficulty=Recipe.Difficulty.ADVANCED)
    response = client.get("/api/v1/recipes/?difficulty=beginner")
    assert response.status_code == 200
    results = response.json()["results"]
    assert all(r["difficulty"] == "beginner" for r in results)


@pytest.mark.django_db
def test_8_ordering_by_average_rating(client):
    """?ordering=-average_rating returns recipes sorted highest rating first."""
    user = make_user()
    make_recipe(user, name="Low Rated", average_rating=1.5)
    make_recipe(user, name="High Rated", average_rating=4.8)
    response = client.get("/api/v1/recipes/?ordering=-average_rating")
    assert response.status_code == 200
    results = response.json()["results"]
    ratings = [r["average_rating"] for r in results]
    assert ratings == sorted(ratings, reverse=True)


@pytest.mark.django_db
def test_9_pagination_page_2(client):
    """?page=2 returns the second page (or empty list if fewer than 13 recipes)."""
    user = make_user()
    for i in range(5):
        make_recipe(user, name=f"Recipe {i}")
    response = client.get("/api/v1/recipes/?page=2")
    # Either returns 200 with an empty results list, or 404 with invalid page
    assert response.status_code in (200, 404)
    if response.status_code == 200:
        assert "results" in response.json()


@pytest.mark.django_db
def test_10_top_rated_endpoint(client):
    """GET /api/v1/recipes/top-rated/ returns up to 6 recipes, highest rated first."""
    user = make_user()
    for i in range(8):
        make_recipe(user, name=f"Recipe {i}", average_rating=float(i))
    response = client.get("/api/v1/recipes/top-rated/")
    assert response.status_code == 200
    results = response.json()
    assert len(results) <= 6
    ratings = [r["average_rating"] for r in results]
    assert ratings == sorted(ratings, reverse=True)


# ---------------------------------------------------------------------------
# Recipe CRUD tests (11–21)
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_11_create_recipe_unauthenticated(client):
    """POST /api/v1/recipes/ without auth → HTTP 401."""
    response = client.post(
        "/api/v1/recipes/", VALID_PAYLOAD, content_type="application/json"
    )
    assert response.status_code == 401


@pytest.mark.django_db
def test_12_create_recipe_authenticated(client):
    """POST /api/v1/recipes/ with valid data → HTTP 201, slug auto-generated, author = user."""
    user = make_user()
    headers = auth_header(client, user.email, STRONG_PASSWORD)
    response = client.post(
        "/api/v1/recipes/", VALID_PAYLOAD, content_type="application/json", **headers
    )
    assert response.status_code == 201, response.json()
    data = response.json()
    assert data["slug"] == "peppermint-delight"
    assert data["author"]["display_name"] == user.display_name


@pytest.mark.django_db
def test_13_create_recipe_with_nested_ingredients_and_steps(client):
    """POST with nested ingredients + steps stores all child records in the DB."""
    user = make_user()
    ing = Ingredient.objects.create(
        name="Olive Oil",
        category=Ingredient.Category.OIL,
        saponification_value=0.134,
    )
    headers = auth_header(client, user.email, STRONG_PASSWORD)
    payload = {
        **VALID_PAYLOAD,
        "name": "Nested Soap",
        "ingredients": [
            {"ingredient_id": str(ing.id), "amount_grams": 300.0, "percentage": 60.0}
        ],
        "steps": [
            {"order": 1, "instruction": "Melt oils.", "image_url": ""},
            {"order": 2, "instruction": "Add lye solution.", "image_url": ""},
        ],
    }
    response = client.post(
        "/api/v1/recipes/", payload, content_type="application/json", **headers
    )
    assert response.status_code == 201, response.json()
    recipe = Recipe.objects.get(slug="nested-soap")
    assert RecipeIngredient.objects.filter(recipe=recipe).count() == 1
    assert Step.objects.filter(recipe=recipe).count() == 2


@pytest.mark.django_db
def test_14_recipe_detail_returns_full_data(client):
    """GET /api/v1/recipes/{slug}/ returns full recipe with ingredients and steps."""
    user = make_user()
    recipe = make_recipe(user)
    response = client.get(f"/api/v1/recipes/{recipe.slug}/")
    assert response.status_code == 200
    data = response.json()
    assert data["slug"] == recipe.slug
    assert "ingredients" in data
    assert "steps" in data
    assert "description" in data


@pytest.mark.django_db
def test_15_recipe_ingredients_endpoint(client):
    """GET /api/v1/recipes/{slug}/ingredients/ returns the ingredient list."""
    user = make_user()
    recipe = make_recipe(user)
    ing = Ingredient.objects.create(
        name="Castor Oil", category=Ingredient.Category.OIL, saponification_value=0.128
    )
    RecipeIngredient.objects.create(recipe=recipe, ingredient=ing, amount_grams=50.0)
    response = client.get(f"/api/v1/recipes/{recipe.slug}/ingredients/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["ingredient"]["name"] == "Castor Oil"


@pytest.mark.django_db
def test_16_put_recipe_by_author(client):
    """PUT /api/v1/recipes/{slug}/ by the author → HTTP 200, recipe updated."""
    user = make_user()
    recipe = make_recipe(user)
    headers = auth_header(client, user.email, STRONG_PASSWORD)
    payload = {**VALID_PAYLOAD, "name": "Updated Name", "description": "Updated."}
    response = client.put(
        f"/api/v1/recipes/{recipe.slug}/", payload, content_type="application/json", **headers
    )
    assert response.status_code == 200, response.json()
    assert response.json()["name"] == "Updated Name"


@pytest.mark.django_db
def test_17_put_recipe_by_other_user_returns_403(client):
    """PUT /api/v1/recipes/{slug}/ by a different user → HTTP 403."""
    author = make_user("author@example.com")
    other = make_user("other@example.com")
    recipe = make_recipe(author)
    headers = auth_header(client, other.email, STRONG_PASSWORD)
    response = client.put(
        f"/api/v1/recipes/{recipe.slug}/",
        {**VALID_PAYLOAD, "name": "Hacked"},
        content_type="application/json",
        **headers,
    )
    assert response.status_code == 403


@pytest.mark.django_db
def test_18_delete_recipe_by_author(client):
    """DELETE /api/v1/recipes/{slug}/ by the author → HTTP 204."""
    user = make_user()
    recipe = make_recipe(user)
    headers = auth_header(client, user.email, STRONG_PASSWORD)
    response = client.delete(f"/api/v1/recipes/{recipe.slug}/", **headers)
    assert response.status_code == 204
    assert not Recipe.objects.filter(pk=recipe.pk).exists()


@pytest.mark.django_db
def test_19_delete_recipe_by_other_user_returns_403(client):
    """DELETE /api/v1/recipes/{slug}/ by a different user → HTTP 403."""
    author = make_user("author@example.com")
    other = make_user("other@example.com")
    recipe = make_recipe(author)
    headers = auth_header(client, other.email, STRONG_PASSWORD)
    response = client.delete(f"/api/v1/recipes/{recipe.slug}/", **headers)
    assert response.status_code == 403
    assert Recipe.objects.filter(pk=recipe.pk).exists()


@pytest.mark.django_db
def test_20_my_recipes_returns_only_own(client):
    """GET /api/v1/recipes/my/ returns only the authenticated user's recipes."""
    user_a = make_user("a@example.com")
    user_b = make_user("b@example.com")
    make_recipe(user_a, name="A's Recipe")
    make_recipe(user_b, name="B's Recipe")
    headers = auth_header(client, user_a.email, STRONG_PASSWORD)
    response = client.get("/api/v1/recipes/my/", **headers)
    assert response.status_code == 200
    results = response.json()
    assert all(r["author"]["display_name"] == user_a.display_name for r in results)
    assert len(results) == 1


@pytest.mark.django_db
def test_21_my_recipes_unauthenticated_returns_401(client):
    """GET /api/v1/recipes/my/ without auth → HTTP 401."""
    response = client.get("/api/v1/recipes/my/")
    assert response.status_code == 401


# ---------------------------------------------------------------------------
# Slug tests (22–23)
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_22_slug_generated_from_name(client):
    """Creating a recipe named 'Lavender Dream' produces slug 'lavender-dream'."""
    user = make_user()
    headers = auth_header(client, user.email, STRONG_PASSWORD)
    payload = {**VALID_PAYLOAD, "name": "Lavender Dream"}
    response = client.post(
        "/api/v1/recipes/", payload, content_type="application/json", **headers
    )
    assert response.status_code == 201, response.json()
    assert response.json()["slug"] == "lavender-dream"


@pytest.mark.django_db
def test_23_duplicate_name_gets_unique_slug(client):
    """Creating two recipes with the same name produces distinct slugs."""
    user = make_user()
    headers = auth_header(client, user.email, STRONG_PASSWORD)
    payload = {**VALID_PAYLOAD, "name": "Lavender Dream"}

    resp1 = client.post(
        "/api/v1/recipes/", payload, content_type="application/json", **headers
    )
    resp2 = client.post(
        "/api/v1/recipes/", payload, content_type="application/json", **headers
    )
    assert resp1.status_code == 201
    assert resp2.status_code == 201
    slug1 = resp1.json()["slug"]
    slug2 = resp2.json()["slug"]
    assert slug1 != slug2, f"Expected unique slugs, both got '{slug1}'"
    assert slug1 == "lavender-dream"
    assert slug2 == "lavender-dream-2"
