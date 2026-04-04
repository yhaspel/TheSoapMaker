from django.urls import path

from .views import RateRecipeView, RecipeRatingsListView

urlpatterns = [
    path("recipes/<slug:slug>/rate/", RateRecipeView.as_view(), name="rate-recipe"),
    path("recipes/<slug:slug>/ratings/", RecipeRatingsListView.as_view(), name="recipe-ratings-list"),
]
