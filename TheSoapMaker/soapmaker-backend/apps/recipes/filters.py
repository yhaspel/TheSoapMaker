import django_filters
from .models import Recipe


class RecipeFilter(django_filters.FilterSet):
    search = django_filters.CharFilter(method="filter_search", label="Search")
    method = django_filters.ChoiceFilter(choices=Recipe.Method.choices)
    difficulty = django_filters.ChoiceFilter(choices=Recipe.Difficulty.choices)
    tag = django_filters.CharFilter(field_name="tags__name", lookup_expr="iexact", label="Tag name")
    ordering = django_filters.OrderingFilter(
        fields=(
            ("average_rating", "average_rating"),
            ("created_at", "created_at"),
            ("rating_count", "rating_count"),
        ),
        field_labels={
            "average_rating": "Average Rating",
            "created_at": "Date Created",
            "rating_count": "Rating Count",
        },
    )

    class Meta:
        model = Recipe
        fields = ["method", "difficulty"]

    def filter_search(self, queryset, name, value):
        """Full-text search across name, description, and tags."""
        from django.db.models import Q
        return queryset.filter(
            Q(name__icontains=value)
            | Q(description__icontains=value)
            | Q(tags__name__icontains=value)
        ).distinct()
