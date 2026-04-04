from rest_framework import serializers

from .models import Subscription


class SubscriptionSerializer(serializers.ModelSerializer):
    trial_days_remaining = serializers.SerializerMethodField()

    class Meta:
        model = Subscription
        fields = [
            "id",
            "plan",
            "status",
            "current_period_end",
            "cancel_at_period_end",
            "trial_days_remaining",
        ]
        read_only_fields = fields

    def get_trial_days_remaining(self, obj) -> int | None:
        """
        Return the number of full days left in the trial, or None if
        the user's trial has ended or was never started.
        """
        from django.utils import timezone

        user = obj.user
        if not user.trial_ends_at:
            return None
        delta = user.trial_ends_at - timezone.now()
        remaining = delta.days
        return max(remaining, 0) if delta.total_seconds() > 0 else 0
