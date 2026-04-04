from django.urls import path
from .views import (
    RecipeListCreateView,
    RecipeDetailView,
    TopRatedView,
    MyRecipesView,
    RecipeIngredientListView,
    IngredientListView,
    IngredientDetailView,
    CloudinaryUploadPresignView,
)

urlpatterns = [
    # Recipes
    path("recipes/", RecipeListCreateView.as_view(), name="recipe-list-create"),
    path("recipes/top-rated/", TopRatedView.as_view(), name="recipe-top-rated"),
    path("recipes/my/", MyRecipesView.as_view(), name="recipe-my"),
    path("recipes/upload-url/", CloudinaryUploadPresignView.as_view(), name="recipe-upload-url"),
    path("recipes/<slug:slug>/", RecipeDetailView.as_view(), name="recipe-detail"),
    path("recipes/<slug:slug>/ingredients/", RecipeIngredientListView.as_view(), name="recipe-ingredients"),
    # Ingredients
    path("ingredients/", IngredientListView.as_view(), name="ingredient-list"),
    path("ingredients/<uuid:pk>/", IngredientDetailView.as_view(), name="ingredient-detail"),
]
