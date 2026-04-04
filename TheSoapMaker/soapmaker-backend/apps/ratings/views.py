from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Rating
from .serializers import RatingSerializer


class RateRecipeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, slug):
        from apps.recipes.models import Recipe
        recipe = Recipe.objects.get(slug=slug)
        rating, _ = Rating.objects.update_or_create(
            user=request.user,
            recipe=recipe,
            defaults={"stars": request.data.get("stars")},
        )
        return Response(RatingSerializer(rating).data)
