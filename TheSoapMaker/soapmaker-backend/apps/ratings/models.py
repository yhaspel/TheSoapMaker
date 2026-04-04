from django.conf import settings
import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class Rating(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="ratings")
    recipe = models.ForeignKey("recipes.Recipe", on_delete=models.CASCADE, related_name="ratings")
    stars = models.SmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "recipe")

    def __str__(self) -> str:
        return f"{self.user} rated {self.recipe} — {self.stars}★"
