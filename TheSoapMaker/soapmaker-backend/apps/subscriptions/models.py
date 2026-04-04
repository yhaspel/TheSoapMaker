import uuid

from django.conf import settings
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver


class Subscription(models.Model):
    class Plan(models.TextChoices):
        FREE = "free", "Free"
        PREMIUM_MONTHLY = "premium_monthly", "Premium Monthly"
        PREMIUM_ANNUAL = "premium_annual", "Premium Annual"

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        CANCELED = "canceled", "Canceled"
        PAST_DUE = "past_due", "Past Due"
        TRIALING = "trialing", "Trialing"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="subscription"
    )
    stripe_customer_id = models.CharField(max_length=100, blank=True)
    stripe_subscription_id = models.CharField(max_length=100, blank=True)
    plan = models.CharField(max_length=20, choices=Plan.choices, default=Plan.FREE)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    current_period_end = models.DateTimeField(null=True, blank=True)
    cancel_at_period_end = models.BooleanField(default=False)

    def __str__(self) -> str:
        return f"{self.user.email} — {self.plan} ({self.status})"

    @property
    def is_premium_active(self) -> bool:
        """True when the subscription grants premium access."""
        return self.plan != self.Plan.FREE and self.status in (self.Status.ACTIVE, self.Status.TRIALING)


@receiver(post_save, sender=Subscription)
def sync_user_premium_flag(sender, instance, **kwargs):
    """Keep CustomUser.is_premium in sync whenever a Subscription is saved."""
    user = instance.user
    should_be_premium = instance.is_premium_active
    if user.is_premium != should_be_premium:
        user.is_premium = should_be_premium
        user.save(update_fields=["is_premium"])
