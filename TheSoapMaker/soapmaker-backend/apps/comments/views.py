from rest_framework import generics, permissions, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from .models import Comment
from .serializers import CommentSerializer


class CommentPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class RecipeCommentListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/v1/recipes/<slug>/comments/  — public, paginated (page size 20)
    POST /api/v1/recipes/<slug>/comments/  — authenticated; creates a top-level
         or reply comment (include "parent": <uuid> in body for replies).
    """

    serializer_class = CommentSerializer
    pagination_class = CommentPagination

    def get_queryset(self):
        from apps.recipes.models import Recipe

        recipe = Recipe.objects.get(slug=self.kwargs["slug"])
        # Only return top-level comments; replies are nested inside each comment.
        return Comment.objects.filter(recipe=recipe, parent=None).order_by("created_at")

    def perform_create(self, serializer):
        from apps.recipes.models import Recipe

        recipe = Recipe.objects.get(slug=self.kwargs["slug"])
        serializer.save(user=self.request.user, recipe=recipe)

    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]


class CommentDeleteView(APIView):
    """DELETE /api/v1/comments/<pk>/  — author or staff only."""

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Delete a comment",
        description="Deletes a comment. Only the comment author or staff members can delete.",
        responses={204: None, 403: None, 404: None},
        tags=["comments"],
    )
    def delete(self, request, pk):
        try:
            comment = Comment.objects.get(pk=pk)
        except Comment.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        if comment.user != request.user and not request.user.is_staff:
            return Response({"detail": "You do not have permission to delete this comment."}, status=status.HTTP_403_FORBIDDEN)

        comment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CommentFlagView(APIView):
    """POST /api/v1/comments/<pk>/flag/  — any authenticated user can flag a comment."""

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Flag a comment",
        description="Marks a comment as flagged for review. Any authenticated user can flag.",
        responses={200: None, 404: None},
        tags=["comments"],
    )
    def post(self, request, pk):
        try:
            comment = Comment.objects.get(pk=pk)
        except Comment.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        comment.is_flagged = True
        comment.save(update_fields=["is_flagged"])
        return Response({"detail": "Comment flagged."}, status=status.HTTP_200_OK)
