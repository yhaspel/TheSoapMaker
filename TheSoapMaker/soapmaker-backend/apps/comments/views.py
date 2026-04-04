from rest_framework import generics, permissions
from .models import Comment
from .serializers import CommentSerializer


class RecipeCommentListCreateView(generics.ListCreateAPIView):
    serializer_class = CommentSerializer

    def get_queryset(self):
        from apps.recipes.models import Recipe
        recipe = Recipe.objects.get(slug=self.kwargs["slug"])
        return Comment.objects.filter(recipe=recipe, parent=None)

    def perform_create(self, serializer):
        from apps.recipes.models import Recipe
        recipe = Recipe.objects.get(slug=self.kwargs["slug"])
        serializer.save(user=self.request.user, recipe=recipe)

    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]
