from rest_framework import serializers
from .models import Rating


class RatingSerializer(serializers.ModelSerializer):
    user_display_name = serializers.CharField(source="user.display_name", read_only=True)

    class Meta:
        model = Rating
        fields = ["id", "stars", "user_display_name", "created_at"]
        read_only_fields = ["id", "user_display_name", "created_at"]
