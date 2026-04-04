from django.db.models import Avg
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver


def _recalculate_recipe_rating(recipe):
    """Recompute and persist average_rating and rating_count on the recipe."""
    from .models import Rating

    agg = Rating.objects.filter(recipe=recipe).aggregate(avg=Avg("stars"))
    recipe.average_rating = round(agg["avg"] or 0.0, 2)
    recipe.rating_count = Rating.objects.filter(recipe=recipe).count()
    recipe.save(update_fields=["average_rating", "rating_count"])


# NOTE: sender must be the actual model class, NOT a string label.
# Using a string like "ratings.Rating" with @receiver does NOT work —
# the signal would silently never fire.
from apps.ratings.models import Rating  # noqa: E402  (import after function def)


@receiver(post_save, sender=Rating)
def on_rating_saved(sender, instance, **kwargs):
    _recalculate_recipe_rating(instance.recipe)


@receiver(post_delete, sender=Rating)
def on_rating_deleted(sender, instance, **kwargs):
    _recalculate_recipe_rating(instance.recipe)
