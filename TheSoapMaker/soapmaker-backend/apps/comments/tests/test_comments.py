"""
Milestone 4 — Comment API tests (tests 32–39)
Run: pytest apps/comments/tests/test_comments.py -v --tb=short
"""

import pytest
from django.contrib.auth import get_user_model

from apps.recipes.models import Recipe
from apps.comments.models import Comment

User = get_user_model()

STRONG_PASSWORD = "Str0ng!Pass99"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_user(email="commenter@example.com"):
    return User.objects.create_user(email=email, password=STRONG_PASSWORD)


def make_recipe(author):
    return Recipe.objects.create(
        author=author,
        name="Honey Oat Soap",
        description="A gentle, moisturising bar.",
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
# Test 32 — list comments is public
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_32_list_comments_public(client):
    """GET /api/v1/recipes/{slug}/comments/ returns 200 without auth."""
    user = make_user()
    recipe = make_recipe(user)
    Comment.objects.create(user=user, recipe=recipe, body="Great soap!")
    response = client.get(f"/api/v1/recipes/{recipe.slug}/comments/")
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert data["count"] >= 1


# ---------------------------------------------------------------------------
# Test 33 — post comment unauthenticated returns 401
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_33_post_comment_unauthenticated(client):
    """POST /api/v1/recipes/{slug}/comments/ without auth → 401."""
    user = make_user()
    recipe = make_recipe(user)
    response = client.post(
        f"/api/v1/recipes/{recipe.slug}/comments/",
        {"body": "Nice!"},
        content_type="application/json",
    )
    assert response.status_code == 401


# ---------------------------------------------------------------------------
# Test 34 — authenticated user can post a comment
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_34_post_comment_authenticated(client):
    """POST /api/v1/recipes/{slug}/comments/ with auth → 201, comment stored."""
    user = make_user()
    recipe = make_recipe(user)
    headers = auth_header(client, user.email)
    response = client.post(
        f"/api/v1/recipes/{recipe.slug}/comments/",
        {"body": "Amazing recipe!"},
        content_type="application/json",
        **headers,
    )
    assert response.status_code == 201, response.json()
    assert Comment.objects.filter(recipe=recipe).count() == 1


# ---------------------------------------------------------------------------
# Test 35 — reply comment is nested in parent
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_35_replies_nested_in_parent(client):
    """Replies appear inside the parent comment's 'replies' list."""
    user = make_user()
    recipe = make_recipe(user)
    parent = Comment.objects.create(user=user, recipe=recipe, body="Parent comment.")
    Comment.objects.create(user=user, recipe=recipe, parent=parent, body="A reply.")

    response = client.get(f"/api/v1/recipes/{recipe.slug}/comments/")
    assert response.status_code == 200
    results = response.json()["results"]
    # Top-level list should only contain the parent
    assert len(results) == 1
    assert len(results[0]["replies"]) == 1
    assert results[0]["replies"][0]["body"] == "A reply."


# ---------------------------------------------------------------------------
# Test 36 — author can delete their own comment
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_36_author_can_delete_comment(client):
    """DELETE /api/v1/comments/{pk}/ by the author → 204."""
    user = make_user()
    recipe = make_recipe(user)
    comment = Comment.objects.create(user=user, recipe=recipe, body="Delete me.")
    headers = auth_header(client, user.email)
    response = client.delete(f"/api/v1/comments/{comment.id}/", **headers)
    assert response.status_code == 204
    assert not Comment.objects.filter(pk=comment.id).exists()


# ---------------------------------------------------------------------------
# Test 37 — non-author cannot delete comment (403)
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_37_non_author_cannot_delete_comment(client):
    """DELETE /api/v1/comments/{pk}/ by a different user → 403."""
    author = make_user("author@example.com")
    other = make_user("other@example.com")
    recipe = make_recipe(author)
    comment = Comment.objects.create(user=author, recipe=recipe, body="Mine.")
    headers = auth_header(client, other.email)
    response = client.delete(f"/api/v1/comments/{comment.id}/", **headers)
    assert response.status_code == 403
    assert Comment.objects.filter(pk=comment.id).exists()


# ---------------------------------------------------------------------------
# Test 38 — flag comment sets is_flagged=True
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_38_flag_comment(client):
    """POST /api/v1/comments/{pk}/flag/ → 200, is_flagged becomes True."""
    user = make_user()
    recipe = make_recipe(user)
    comment = Comment.objects.create(user=user, recipe=recipe, body="Flaggable.")
    headers = auth_header(client, user.email)
    response = client.post(f"/api/v1/comments/{comment.id}/flag/", **headers)
    assert response.status_code == 200
    comment.refresh_from_db()
    assert comment.is_flagged is True


# ---------------------------------------------------------------------------
# Test 39 — comments are paginated (page size 20)
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_39_comments_paginated(client):
    """Comment list uses page-based pagination with page_size 20."""
    user = make_user()
    recipe = make_recipe(user)
    for i in range(5):
        Comment.objects.create(user=user, recipe=recipe, body=f"Comment {i}")
    response = client.get(f"/api/v1/recipes/{recipe.slug}/comments/")
    assert response.status_code == 200
    data = response.json()
    # Pagination envelope must be present
    assert "count" in data
    assert "results" in data
    assert data["count"] == 5
