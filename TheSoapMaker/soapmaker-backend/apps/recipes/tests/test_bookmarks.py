import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.recipes.models import Bookmark, Recipe
from apps.users.models import CustomUser


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user(db):
    return CustomUser.objects.create_user(
        email='test@example.com',
        password='testpass123',
        display_name='Test User',
    )


@pytest.fixture
def other_user(db):
    return CustomUser.objects.create_user(
        email='other@example.com',
        password='testpass123',
        display_name='Other User',
    )


@pytest.fixture
def recipe(db, user):
    return Recipe.objects.create(
        author=user,
        name='Lavender Soap',
        description='A lovely lavender soap',
        method='cold_process',
        difficulty='beginner',
        cure_time_days=28,
        batch_size_grams=1000,
        yield_bars=8,
        is_published=True,
    )


class TestBookmarkToggle:
    def test_unauthenticated_bookmark_returns_401(self, api_client, recipe):
        url = reverse('recipe-bookmark', kwargs={'slug': recipe.slug})
        response = api_client.post(url)
        assert response.status_code == 401

    def test_bookmark_toggle_on_creates_bookmark(self, api_client, user, recipe):
        api_client.force_authenticate(user=user)
        url = reverse('recipe-bookmark', kwargs={'slug': recipe.slug})
        response = api_client.post(url)
        assert response.status_code == 201
        assert Bookmark.objects.filter(user=user, recipe=recipe).exists()

    def test_bookmark_toggle_off_removes_bookmark(self, api_client, user, recipe):
        # First bookmark it
        Bookmark.objects.create(user=user, recipe=recipe)
        api_client.force_authenticate(user=user)
        url = reverse('recipe-bookmark', kwargs={'slug': recipe.slug})
        response = api_client.post(url)
        assert response.status_code == 204
        assert not Bookmark.objects.filter(user=user, recipe=recipe).exists()

    def test_get_bookmarked_returns_only_current_users_recipes(
        self, api_client, user, other_user, recipe, db
    ):
        # User bookmarks the recipe
        Bookmark.objects.create(user=user, recipe=recipe)
        # Other user does NOT bookmark it
        api_client.force_authenticate(user=user)
        url = reverse('recipe-bookmarked')
        response = api_client.get(url)
        assert response.status_code == 200
        slugs = [r['slug'] for r in response.data]
        assert recipe.slug in slugs

        # Other user sees no bookmarks
        api_client.force_authenticate(user=other_user)
        response = api_client.get(url)
        assert response.status_code == 200
        assert len(response.data) == 0


class TestAdvancedFilters:
    def test_cure_time_min_filter(self, api_client, user, db):
        # Create recipe with cure_time_days = 14
        Recipe.objects.create(
            author=user, name='Quick Soap', description='Quick soap',
            method='melt_and_pour', difficulty='beginner',
            cure_time_days=14, batch_size_grams=500, yield_bars=4,
            is_published=True,
        )
        # Create recipe with cure_time_days = 56
        Recipe.objects.create(
            author=user, name='Long Cure Soap', description='Long cure',
            method='cold_process', difficulty='advanced',
            cure_time_days=56, batch_size_grams=500, yield_bars=4,
            is_published=True,
        )
        url = reverse('recipe-list-create')
        response = api_client.get(url, {'cure_time_min': 28})
        assert response.status_code == 200
        slugs = [r['slug'] for r in response.data.get('results', [])]
        # Only the 56-day recipe should appear (14-day is filtered out)
        names = [r['name'] for r in response.data.get('results', [])]
        assert 'Long Cure Soap' in names
        assert 'Quick Soap' not in names
