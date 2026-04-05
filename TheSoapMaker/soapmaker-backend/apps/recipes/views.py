import hashlib
import time

from django.conf import settings
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, generics, status
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from drf_spectacular.utils import extend_schema

from .filters import RecipeFilter
from .models import Ingredient, Recipe, RecipeIngredient, Bookmark
from .permissions import IsAuthorOrReadOnly, IsPremiumUser, CanViewPremiumRecipe
from django.shortcuts import get_object_or_404
from .serializers import (
    IngredientSerializer,
    RecipeDetailSerializer,
    RecipeIngredientSerializer,
    RecipeListSerializer,
    RecipeWriteSerializer,
)


# ---------------------------------------------------------------------------
# Pagination
# ---------------------------------------------------------------------------

class RecipePagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = "page_size"
    max_page_size = 50


# ---------------------------------------------------------------------------
# Recipe views
# ---------------------------------------------------------------------------

class RecipeListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/v1/recipes/  — paginated, filterable list (public)
    POST /api/v1/recipes/  — create a new recipe (authenticated)
    """
    queryset = (
        Recipe.objects.filter(is_published=True)
        .select_related("author")
        .prefetch_related("tags", "recipe_ingredients__ingredient", "steps")
    )
    pagination_class = RecipePagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = RecipeFilter
    search_fields = ["name", "description", "tags__name"]
    ordering_fields = ["average_rating", "created_at", "rating_count"]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return RecipeWriteSerializer
        return RecipeListSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsPremiumUser()]
        return [AllowAny()]

    def perform_create(self, serializer):
        serializer.save(
            author=self.request.user,
            is_premium=self.request.user.is_premium,
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class RecipeDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/v1/recipes/{slug}/  — full detail (public)
    PUT    /api/v1/recipes/{slug}/  — update (author only)
    PATCH  /api/v1/recipes/{slug}/  — partial update (author only)
    DELETE /api/v1/recipes/{slug}/  — delete (author only)
    """
    queryset = (
        Recipe.objects.select_related("author")
        .prefetch_related("tags", "recipe_ingredients__ingredient", "steps")
    )
    lookup_field = "slug"
    permission_classes = [IsAuthenticatedOrReadOnly, IsAuthorOrReadOnly, CanViewPremiumRecipe]

    def get_permissions(self):
        if self.request.method in ("PUT", "PATCH"):
            # Editing requires premium + being the author
            return [IsPremiumUser(), IsAuthorOrReadOnly()]
        return [CanViewPremiumRecipe()]

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return RecipeWriteSerializer
        return RecipeDetailSerializer


class TopRatedView(generics.ListAPIView):
    """GET /api/v1/recipes/top-rated/  — top 6 by average_rating (public)"""
    serializer_class = RecipeListSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return (
            Recipe.objects.filter(is_published=True)
            .select_related("author")
            .prefetch_related("tags")
            .order_by("-average_rating")[:6]
        )


class MyRecipesView(generics.ListAPIView):
    """GET /api/v1/recipes/my/  — authenticated user's own recipes"""
    serializer_class = RecipeListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Recipe.objects.filter(author=self.request.user)
            .select_related("author")
            .prefetch_related("tags")
            .order_by("-created_at")
        )


class RecipeIngredientListView(generics.ListAPIView):
    """GET /api/v1/recipes/{slug}/ingredients/  — ingredients for one recipe (public)"""
    serializer_class = RecipeIngredientSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return (
            RecipeIngredient.objects.filter(recipe__slug=self.kwargs["slug"])
            .select_related("ingredient")
        )


# ---------------------------------------------------------------------------
# Ingredient views
# ---------------------------------------------------------------------------

class IngredientListView(generics.ListAPIView):
    """GET /api/v1/ingredients/  — full ingredient catalogue (public, unpaginated for autocomplete)"""
    queryset = Ingredient.objects.all().order_by("name")
    serializer_class = IngredientSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "category"]
    pagination_class = None  # autocomplete needs a plain array, not a paginated envelope


class IngredientDetailView(generics.RetrieveAPIView):
    """GET /api/v1/ingredients/{id}/  — single ingredient with SAP value"""
    queryset = Ingredient.objects.all()
    serializer_class = IngredientSerializer
    permission_classes = [AllowAny]


# ---------------------------------------------------------------------------
# Cloudinary presigned upload URL
# ---------------------------------------------------------------------------

class CloudinaryUploadPresignView(APIView):
    """
    POST /api/v1/recipes/upload-url/
    Returns a signed upload payload so the browser can upload directly to Cloudinary.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        cloud_name = getattr(settings, "CLOUDINARY_CLOUD_NAME", "") or ""
        api_key = getattr(settings, "CLOUDINARY_API_KEY", "") or ""
        api_secret = getattr(settings, "CLOUDINARY_API_SECRET", "") or ""

        if not all([cloud_name, api_key, api_secret]):
            return Response(
                {"detail": "Cloudinary is not configured on the server."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        timestamp = int(time.time())
        folder = "soapmaker/recipes"
        params_to_sign = f"folder={folder}&timestamp={timestamp}{api_secret}"
        signature = hashlib.sha1(params_to_sign.encode()).hexdigest()  # noqa: S324

        upload_url = f"https://api.cloudinary.com/v1_1/{cloud_name}/image/upload"

        return Response(
            {
                "upload_url": upload_url,
                "api_key": api_key,
                "timestamp": timestamp,
                "signature": signature,
                "folder": folder,
            }
        )


class BookmarkToggleView(APIView):
    """
    POST /api/v1/recipes/{slug}/bookmark/  — toggle bookmark on/off
    Returns 201 {"bookmarked": true} when added, 204 when removed.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Toggle recipe bookmark",
        description="Adds bookmark (201) or removes it (204).",
        responses={201: None, 204: None},
        tags=["recipes"],
    )
    def post(self, request, slug):
        recipe = get_object_or_404(Recipe, slug=slug)
        bookmark, created = Bookmark.objects.get_or_create(
            user=request.user, recipe=recipe
        )
        if not created:
            bookmark.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response({'bookmarked': True, 'slug': slug}, status=status.HTTP_201_CREATED)


class BookmarkedRecipesView(generics.ListAPIView):
    """GET /api/v1/recipes/bookmarked/  — current user's bookmarked recipes"""
    serializer_class = RecipeListSerializer
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="List bookmarked recipes",
        description="Returns all recipes bookmarked by the authenticated user.",
        responses={200: RecipeListSerializer(many=True)},
        tags=["recipes"],
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        return (
            Recipe.objects.filter(bookmarks__user=self.request.user)
            .select_related('author')
            .prefetch_related('tags')
            .order_by('-bookmarks__created_at')
        )
