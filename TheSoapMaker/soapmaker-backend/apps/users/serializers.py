from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """
    Full read-only representation returned by dj-rest-auth USER_DETAILS_SERIALIZER
    and the /auth/user/ GET endpoint.
    """
    is_in_trial = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "display_name",
            "avatar_url",
            "bio",
            "is_premium",
            "is_in_trial",
            "trial_ends_at",
            "date_joined",
        ]
        read_only_fields = ["id", "email", "is_premium", "is_in_trial", "trial_ends_at", "date_joined"]


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Writable serializer for PUT /api/v1/auth/user/ — lets the user update
    their display_name, avatar_url, and bio. Sensitive fields stay read-only.
    """
    is_in_trial = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "display_name",
            "avatar_url",
            "bio",
            "is_premium",
            "is_in_trial",
            "trial_ends_at",
            "date_joined",
        ]
        read_only_fields = ["id", "email", "is_premium", "is_in_trial", "trial_ends_at", "date_joined"]
