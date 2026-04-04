from django.urls import path

from .views import CommentDeleteView, CommentFlagView, RecipeCommentListCreateView

urlpatterns = [
    path("recipes/<slug:slug>/comments/", RecipeCommentListCreateView.as_view(), name="recipe-comments"),
    path("comments/<uuid:pk>/", CommentDeleteView.as_view(), name="comment-delete"),
    path("comments/<uuid:pk>/flag/", CommentFlagView.as_view(), name="comment-flag"),
]
