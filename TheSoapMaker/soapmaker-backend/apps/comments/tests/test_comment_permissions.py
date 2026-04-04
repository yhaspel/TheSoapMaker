"""Tests for comment permission edge cases."""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from apps.comments.models import Comment
from apps.recipes.models import Recipe

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def user(db):
    return User.objects.create_user(email="commenter@example.com", password="pass1234!")

@pytest.fixture
def other_user(db):
    return User.objects.create_user(email="other@example.com", password="pass1234!")

@pytest.fixture
def recipe(db, user):
    return Recipe.objects.create(
        name="Test Soap",
        slug="test-soap",
        description="A test recipe",
        method="cold_process",
        difficulty="beginner",
        cure_time_days=28,
        batch_size_grams=500,
        yield_bars=6,
        author=user,
        is_published=True,
    )

@pytest.fixture
def comment(db, user, recipe):
    return Comment.objects.create(user=user, recipe=recipe, body="Great recipe!")

@pytest.mark.django_db
class TestCommentDelete:
    def test_author_can_delete(self, api_client, user, comment):
        api_client.force_authenticate(user=user)
        resp = api_client.delete(f"/api/v1/comments/{comment.pk}/")
        assert resp.status_code == 204

    def test_other_user_cannot_delete(self, api_client, other_user, comment):
        api_client.force_authenticate(user=other_user)
        resp = api_client.delete(f"/api/v1/comments/{comment.pk}/")
        assert resp.status_code == 403

    def test_unauthenticated_cannot_delete(self, api_client, comment):
        resp = api_client.delete(f"/api/v1/comments/{comment.pk}/")
        assert resp.status_code == 401

@pytest.mark.django_db
class TestCommentFlag:
    def test_authenticated_user_can_flag(self, api_client, other_user, comment):
        api_client.force_authenticate(user=other_user)
        resp = api_client.post(f"/api/v1/comments/{comment.pk}/flag/")
        assert resp.status_code == 200
        comment.refresh_from_db()
        assert comment.is_flagged is True

    def test_unauthenticated_cannot_flag(self, api_client, comment):
        resp = api_client.post(f"/api/v1/comments/{comment.pk}/flag/")
        assert resp.status_code == 401
