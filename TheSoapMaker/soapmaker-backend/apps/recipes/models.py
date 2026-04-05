from django.conf import settings
import uuid
from django.db import models
from django.utils.text import slugify


class Tag(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50, unique=True)

    def __str__(self) -> str:
        return self.name


class Ingredient(models.Model):
    class Category(models.TextChoices):
        OIL = "oil", "Oil"
        LYE = "lye", "Lye"
        LIQUID = "liquid", "Liquid"
        ADDITIVE = "additive", "Additive"
        FRAGRANCE = "fragrance", "Fragrance"
        COLORANT = "colorant", "Colorant"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150, unique=True)
    category = models.CharField(max_length=20, choices=Category.choices)
    saponification_value = models.FloatField(
        null=True,
        blank=True,
        help_text="NaOH SAP value (grams of NaOH to saponify 1g of oil)",
    )
    description = models.TextField(blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class Recipe(models.Model):
    class Method(models.TextChoices):
        COLD_PROCESS = "cold_process", "Cold Process"
        HOT_PROCESS = "hot_process", "Hot Process"
        MELT_AND_POUR = "melt_and_pour", "Melt & Pour"
        LIQUID = "liquid", "Liquid"

    class Difficulty(models.TextChoices):
        BEGINNER = "beginner", "Beginner"
        INTERMEDIATE = "intermediate", "Intermediate"
        ADVANCED = "advanced", "Advanced"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="recipes"
    )
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    description = models.TextField()
    method = models.CharField(max_length=20, choices=Method.choices)
    difficulty = models.CharField(max_length=20, choices=Difficulty.choices)
    cure_time_days = models.PositiveIntegerField(default=28)
    batch_size_grams = models.PositiveIntegerField()
    yield_bars = models.PositiveIntegerField()
    image_url = models.URLField(max_length=500, blank=True)
    is_published = models.BooleanField(default=False)
    is_premium = models.BooleanField(
        default=False,
        help_text="Auto-set to True when the author is a premium user at creation time.",
    )
    tags = models.ManyToManyField(Tag, blank=True)
    # Denormalized for fast sorting/listing — updated via signals
    average_rating = models.FloatField(default=0.0)
    rating_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self._unique_slug(slugify(self.name))
        super().save(*args, **kwargs)

    def _unique_slug(self, base_slug: str) -> str:
        """Return base_slug if available, otherwise append -2, -3, ... until unique."""
        slug = base_slug
        counter = 2
        qs = Recipe.objects.filter(slug=slug)
        if self.pk:
            qs = qs.exclude(pk=self.pk)
        while qs.exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
            qs = Recipe.objects.filter(slug=slug)
            if self.pk:
                qs = qs.exclude(pk=self.pk)
        return slug

    def __str__(self) -> str:
        return self.name


class RecipeIngredient(models.Model):
    recipe = models.ForeignKey(
        Recipe, on_delete=models.CASCADE, related_name="recipe_ingredients"
    )
    ingredient = models.ForeignKey(Ingredient, on_delete=models.CASCADE)
    amount_grams = models.FloatField()
    percentage = models.FloatField(null=True, blank=True)
    notes = models.CharField(max_length=300, blank=True)

    class Meta:
        unique_together = ("recipe", "ingredient")

    def __str__(self) -> str:
        return f"{self.ingredient.name} in {self.recipe.name}"


class Step(models.Model):
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name="steps")
    order = models.PositiveIntegerField()
    instruction = models.TextField()
    duration_minutes = models.PositiveIntegerField(null=True, blank=True)
    image_url = models.URLField(max_length=500, blank=True)

    class Meta:
        ordering = ["order"]
        unique_together = ("recipe", "order")

    def __str__(self) -> str:
        return f"Step {self.order} of {self.recipe.name}"


class Bookmark(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='bookmarks',
    )
    recipe = models.ForeignKey(
        Recipe,
        on_delete=models.CASCADE,
        related_name='bookmarks',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'recipe')
        ordering = ['-created_at']

    def __str__(self) -> str:
        return f'{self.user} bookmarked {self.recipe.name}'
