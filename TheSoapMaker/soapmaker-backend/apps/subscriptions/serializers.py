from rest_framework import serializers
from .models import Subscription


class SubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscription
        fields = [
            "id", "plan", "status", "current_period_end", "cancel_at_period_end",
        ]
        read_only_fields = fields
