"""
Milestone 3 — Ingredient API tests (tests 1–3)
Run: pytest apps/recipes/tests/test_ingredients.py -v --tb=short
"""

import pytest
from django.core.management import call_command
from django.contrib.auth import get_user_model

from apps.recipes.models import Ingredient

User = get_user_model()


# ---------------------------------------------------------------------------
# Test 1 — GET /api/v1/ingredients/ returns 200 and a list
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_1_ingredient_list_returns_200(client):
    """GET /api/v1/ingredients/ is public and returns HTTP 200."""
    Ingredient.objects.create(
        name="Olive Oil",
        category=Ingredient.Category.OIL,
        saponification_value=0.134,
    )
    response = client.get("/api/v1/ingredients/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


# ---------------------------------------------------------------------------
# Test 2 — GET /api/v1/ingredients/{id}/ returns SAP value
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_2_ingredient_detail_includes_sap_value(client):
    """GET /api/v1/ingredients/{id}/ returns the ingredient with saponification_value."""
    ing = Ingredient.objects.create(
        name="Coconut Oil",
        category=Ingredient.Category.OIL,
        saponification_value=0.190,
        description="High-lather oil",
    )
    response = client.get(f"/api/v1/ingredients/{ing.id}/")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Coconut Oil"
    assert data["saponification_value"] == pytest.approx(0.190)


# ---------------------------------------------------------------------------
# Test 3 — seed_ingredients command populates >= 10 ingredients
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_3_seed_ingredients_command(db):
    """Running seed_ingredients should result in at least 10 ingredients in the DB."""
    assert Ingredient.objects.count() == 0
    call_command("seed_ingredients", verbosity=0)
    assert Ingredient.objects.count() >= 10


# ---------------------------------------------------------------------------
# Test 3b — seed_ingredients is idempotent
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_3b_seed_ingredients_is_idempotent(db):
    """Running seed_ingredients twice should not create duplicates."""
    call_command("seed_ingredients", verbosity=0)
    first_count = Ingredient.objects.count()
    call_command("seed_ingredients", verbosity=0)
    assert Ingredient.objects.count() == first_count
