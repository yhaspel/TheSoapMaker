from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import serializers

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """
    Full read-only representation returned by dj-rest-auth USER_DETAILS_SERIALIZER
    and the /auth/user/ GET endpoint.
    """

    is_in_trial = serializers.BooleanField(read_only=True)
    trial_days_remaining = serializers.SerializerMethodField()

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
            "trial_days_remaining",
            "date_joined",
        ]
        read_only_fields = [
            "id", "email", "is_premium", "is_in_trial",
            "trial_ends_at", "trial_days_remaining", "date_joined",
        ]

    def get_trial_days_remaining(self, obj) -> int | None:
        if not obj.trial_ends_at:
            return None
        delta = obj.trial_ends_at - timezone.now()
        return max(delta.days, 0) if delta.total_seconds() > 0 else 0


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Writable serializer for PUT /api/v1/auth/user/ — lets the user update
    their display_name, avatar_url, and bio. Sensitive fields stay read-only.
    """

    is_in_trial = serializers.BooleanField(read_only=True)
    trial_days_remaining = serializers.SerializerMethodField()

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
            "trial_days_remaining",
            "date_joined",
        ]
        read_only_fields = [
            "id", "email", "is_premium", "is_in_trial",
            "trial_ends_at", "trial_days_remaining", "date_joined",
        ]

    def get_trial_days_remaining(self, obj) -> int | None:
        if not obj.trial_ends_at:
            return None
        delta = obj.trial_ends_at - timezone.now()
        return max(delta.days, 0) if delta.total_seconds() > 0 else 0


from dj_rest_auth.registration.serializers import RegisterSerializer

class CustomRegisterSerializer(RegisterSerializer):
    """
    dj-rest-auth has a bug with allauth 65+ where it assumes 'username' is required
    if it's missing from ACCOUNT_SIGNUP_FIELDS. We explicitly remove it here and
    add the frontend's display_name field.
    """
    username = None
    display_name = serializers.CharField(max_length=100, required=True)

    def get_cleaned_data(self):
        data = super().get_cleaned_data()
        data['display_name'] = self.validated_data.get('display_name', '')
        return data

    def custom_signup(self, request, user):
        user.display_name = self.cleaned_data.get('display_name', '')
        user.save(update_fields=['display_name'])
