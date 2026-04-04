from django.urls import path
from .views import RecipeCommentListCreateView

urlpatterns = [
    path("recipes/<slug:slug>/comments/", RecipeCommentListCreateView.as_view(), name="recipe-comments"),
]
