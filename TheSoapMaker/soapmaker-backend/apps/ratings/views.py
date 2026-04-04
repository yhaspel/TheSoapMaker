from rest_framework import status
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from .models import Rating
from .serializers import RatingSerializer


class RateRecipeView(APIView):
    """POST /api/v1/recipes/<slug>/rate/  — create (201) or update (200) a rating."""

    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Submit or update a recipe rating",
        description="Creates a new rating (201) or updates an existing one (200). Requires authentication.",
        request=RatingSerializer,
        responses={200: RatingSerializer, 201: RatingSerializer, 404: None},
        tags=["ratings"],
    )
    def post(self, request, slug):
        from apps.recipes.models import Recipe

        try:
            recipe = Recipe.objects.get(slug=slug)
        except Recipe.DoesNotExist:
            return Response({"detail": "Recipe not found."}, status=status.HTTP_404_NOT_FOUND)

        stars = request.data.get("stars")
        if stars is None:
            return Response({"stars": ["This field is required."]}, status=status.HTTP_400_BAD_REQUEST)

        rating, created = Rating.objects.update_or_create(
            user=request.user,
            recipe=recipe,
            defaults={"stars": stars},
        )
        http_status = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(RatingSerializer(rating).data, status=http_status)


class RecipeRatingsListView(ListAPIView):
    """GET /api/v1/recipes/<slug>/ratings/  — list all ratings for a recipe (public)."""

    serializer_class = RatingSerializer

    def get_queryset(self):
        from apps.recipes.models import Recipe

        recipe = Recipe.objects.get(slug=self.kwargs["slug"])
        return Rating.objects.filter(recipe=recipe).order_by("-created_at")
