from rest_framework import serializers
from .models import Recipe, Ingredient, RecipeIngredient, Step, Tag


# ---------------------------------------------------------------------------
# Sub-object serializers
# ---------------------------------------------------------------------------

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name"]


class IngredientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingredient
        fields = ["id", "name", "category", "saponification_value", "description"]


class StepSerializer(serializers.ModelSerializer):
    class Meta:
        model = Step
        fields = ["order", "instruction", "image_url"]


class RecipeIngredientSerializer(serializers.ModelSerializer):
    """Read-only nested representation — ingredient detail + amounts."""
    ingredient = IngredientSerializer(read_only=True)

    class Meta:
        model = RecipeIngredient
        fields = ["ingredient", "amount_grams", "percentage", "notes"]


class RecipeIngredientWriteSerializer(serializers.Serializer):
    """Writable nested ingredient used in RecipeWriteSerializer."""
    ingredient_id = serializers.UUIDField()
    amount_grams = serializers.FloatField()
    percentage = serializers.FloatField(required=False, allow_null=True)
    notes = serializers.CharField(max_length=300, allow_blank=True, default="")


# ---------------------------------------------------------------------------
# Author nested serializer
# ---------------------------------------------------------------------------

class AuthorSerializer(serializers.Serializer):
    display_name = serializers.CharField(source="author.display_name")
    avatar_url = serializers.CharField(source="author.avatar_url", allow_null=True)

    def to_representation(self, instance):
        return {
            "display_name": instance.author.display_name,
            "avatar_url": instance.author.avatar_url,
        }


# ---------------------------------------------------------------------------
# Recipe list serializer — compact (for paginated list views)
# ---------------------------------------------------------------------------

class RecipeListSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)
    author = serializers.SerializerMethodField()

    class Meta:
        model = Recipe
        fields = [
            "id",
            "slug",
            "name",
            "method",
            "difficulty",
            "average_rating",
            "rating_count",
            "image_url",
            "is_premium",
            "author",
            "tags",
            "created_at",
        ]

    def get_author(self, obj):
        return {
            "display_name": obj.author.display_name,
            "avatar_url": obj.author.avatar_url,
        }


# ---------------------------------------------------------------------------
# Recipe detail serializer — full view (includes ingredients + steps)
# ---------------------------------------------------------------------------

class RecipeDetailSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)
    author = serializers.SerializerMethodField()
    ingredients = RecipeIngredientSerializer(
        source="recipe_ingredients", many=True, read_only=True
    )
    steps = StepSerializer(many=True, read_only=True)

    class Meta:
        model = Recipe
        fields = [
            "id",
            "slug",
            "name",
            "description",
            "method",
            "difficulty",
            "cure_time_days",
            "batch_size_grams",
            "yield_bars",
            "image_url",
            "is_published",
            "is_premium",
            "tags",
            "average_rating",
            "rating_count",
            "author",
            "ingredients",
            "steps",
            "created_at",
            "updated_at",
        ]

    def get_author(self, obj):
        return {
            "display_name": obj.author.display_name,
            "avatar_url": obj.author.avatar_url,
        }


# ---------------------------------------------------------------------------
# Recipe write serializer — for POST / PUT / PATCH
# ---------------------------------------------------------------------------

class RecipeWriteSerializer(serializers.ModelSerializer):
    """
    Accepts nested `ingredients` and `steps` arrays.
    ingredients: [{ingredient_id, amount_grams, percentage?, notes?}, ...]
    steps:       [{order, instruction, image_url?}, ...]
    tag_ids:     [uuid, ...]  — list of existing Tag UUIDs
    """
    ingredients = RecipeIngredientWriteSerializer(many=True, required=False)
    steps = StepSerializer(many=True, required=False)
    tag_ids = serializers.ListField(
        child=serializers.UUIDField(), required=False, write_only=True
    )

    class Meta:
        model = Recipe
        fields = [
            "name",
            "description",
            "method",
            "difficulty",
            "cure_time_days",
            "batch_size_grams",
            "yield_bars",
            "image_url",
            "is_published",
            "tag_ids",
            "ingredients",
            "steps",
        ]

    def create(self, validated_data):
        ingredients_data = validated_data.pop("ingredients", [])
        steps_data = validated_data.pop("steps", [])
        tag_ids = validated_data.pop("tag_ids", [])

        recipe = Recipe.objects.create(**validated_data)

        if tag_ids:
            recipe.tags.set(Tag.objects.filter(id__in=tag_ids))

        self._save_ingredients(recipe, ingredients_data)
        self._save_steps(recipe, steps_data)
        return recipe

    def update(self, instance, validated_data):
        ingredients_data = validated_data.pop("ingredients", None)
        steps_data = validated_data.pop("steps", None)
        tag_ids = validated_data.pop("tag_ids", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if tag_ids is not None:
            instance.tags.set(Tag.objects.filter(id__in=tag_ids))

        if ingredients_data is not None:
            instance.recipe_ingredients.all().delete()
            self._save_ingredients(instance, ingredients_data)

        if steps_data is not None:
            instance.steps.all().delete()
            self._save_steps(instance, steps_data)

        return instance

    def _save_ingredients(self, recipe, ingredients_data):
        for item in ingredients_data:
            ingredient_id = item.pop("ingredient_id")
            try:
                ingredient = Ingredient.objects.get(id=ingredient_id)
                RecipeIngredient.objects.create(
                    recipe=recipe, ingredient=ingredient, **item
                )
            except Ingredient.DoesNotExist:
                pass  # silently skip unknown ingredient IDs

    def _save_steps(self, recipe, steps_data):
        for step_data in steps_data:
            Step.objects.create(recipe=recipe, **step_data)

    def to_representation(self, instance):
        """Return the full detail representation after write operations."""
        return RecipeDetailSerializer(instance, context=self.context).data
