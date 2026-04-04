import uuid
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # ------------------------------------------------------------------ Tag
        migrations.CreateModel(
            name="Tag",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("name", models.CharField(max_length=50, unique=True)),
            ],
        ),
        # --------------------------------------------------------------- Ingredient
        migrations.CreateModel(
            name="Ingredient",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("name", models.CharField(max_length=150, unique=True)),
                (
                    "category",
                    models.CharField(
                        choices=[
                            ("oil", "Oil"),
                            ("lye", "Lye"),
                            ("liquid", "Liquid"),
                            ("additive", "Additive"),
                            ("fragrance", "Fragrance"),
                            ("colorant", "Colorant"),
                        ],
                        max_length=20,
                    ),
                ),
                (
                    "saponification_value",
                    models.FloatField(
                        blank=True,
                        null=True,
                        help_text="NaOH SAP value (grams of NaOH to saponify 1g of oil)",
                    ),
                ),
                ("description", models.TextField(blank=True)),
            ],
            options={"ordering": ["name"]},
        ),
        # ------------------------------------------------------------------ Recipe
        migrations.CreateModel(
            name="Recipe",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                (
                    "author",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="recipes",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                ("name", models.CharField(max_length=200)),
                ("slug", models.SlugField(blank=True, max_length=220, unique=True)),
                ("description", models.TextField()),
                (
                    "method",
                    models.CharField(
                        choices=[
                            ("cold_process", "Cold Process"),
                            ("hot_process", "Hot Process"),
                            ("melt_and_pour", "Melt & Pour"),
                            ("liquid", "Liquid"),
                        ],
                        max_length=20,
                    ),
                ),
                (
                    "difficulty",
                    models.CharField(
                        choices=[
                            ("beginner", "Beginner"),
                            ("intermediate", "Intermediate"),
                            ("advanced", "Advanced"),
                        ],
                        max_length=20,
                    ),
                ),
                ("cure_time_days", models.PositiveIntegerField(default=28)),
                ("batch_size_grams", models.PositiveIntegerField()),
                ("yield_bars", models.PositiveIntegerField()),
                ("image_url", models.URLField(blank=True, max_length=500)),
                ("is_published", models.BooleanField(default=False)),
                ("tags", models.ManyToManyField(blank=True, to="recipes.tag")),
                ("average_rating", models.FloatField(default=0.0)),
                ("rating_count", models.PositiveIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"ordering": ["-created_at"]},
        ),
        # --------------------------------------------------------- RecipeIngredient
        migrations.CreateModel(
            name="RecipeIngredient",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "recipe",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="recipe_ingredients",
                        to="recipes.recipe",
                    ),
                ),
                (
                    "ingredient",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="recipes.ingredient",
                    ),
                ),
                ("amount_grams", models.FloatField()),
                ("percentage", models.FloatField(blank=True, null=True)),
                ("notes", models.CharField(blank=True, max_length=300)),
            ],
            options={"unique_together": {("recipe", "ingredient")}},
        ),
        # ------------------------------------------------------------------ Step
        migrations.CreateModel(
            name="Step",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "recipe",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="steps",
                        to="recipes.recipe",
                    ),
                ),
                ("order", models.PositiveIntegerField()),
                ("instruction", models.TextField()),
                ("image_url", models.URLField(blank=True, max_length=500)),
            ],
            options={
                "ordering": ["order"],
                "unique_together": {("recipe", "order")},
            },
        ),
    ]
