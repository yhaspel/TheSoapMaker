import django_filters
from .models import Recipe


class RecipeFilter(django_filters.FilterSet):
    search = django_filters.CharFilter(method="filter_search", label="Search")
    method = django_filters.ChoiceFilter(choices=Recipe.Method.choices)
    difficulty = django_filters.ChoiceFilter(choices=Recipe.Difficulty.choices)
    tag = django_filters.CharFilter(field_name="tags__name", lookup_expr="iexact", label="Tag name")
    author_id = django_filters.UUIDFilter(field_name='author__id')
    cure_time_min = django_filters.NumberFilter(field_name='cure_time_days', lookup_expr='gte')
    cure_time_max = django_filters.NumberFilter(field_name='cure_time_days', lookup_expr='lte')
    batch_size_min = django_filters.NumberFilter(field_name='batch_size_grams', lookup_expr='gte')
    batch_size_max = django_filters.NumberFilter(field_name='batch_size_grams', lookup_expr='lte')
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
        fields = ["method", "difficulty", "author_id", "cure_time_min", "cure_time_max", "batch_size_min", "batch_size_max"]

    def filter_search(self, queryset, name, value):
        """Full-text search across name, description, and tags."""
        from django.db.models import Q
        return queryset.filter(
            Q(name__icontains=value)
            | Q(description__icontains=value)
            | Q(tags__name__icontains=value)
        ).distinct()
