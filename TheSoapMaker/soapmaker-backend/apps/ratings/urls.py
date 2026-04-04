from django.urls import path
from .views import RateRecipeView

urlpatterns = [
    path("recipes/<slug:slug>/rate/", RateRecipeView.as_view(), name="rate-recipe"),
]
