import uuid
from datetime import timedelta

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class CustomUser(AbstractUser):
    # Remove the username field — email is the unique identifier
    username = None

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    display_name = models.CharField(max_length=100, blank=True)
    avatar_url = models.URLField(max_length=500, blank=True, null=True)
    bio = models.TextField(blank=True)
    # Stored field for quick lookups; kept in sync with subscription status
    is_premium = models.BooleanField(default=False)
    trial_started_at = models.DateTimeField(null=True, blank=True)
    trial_ends_at = models.DateTimeField(null=True, blank=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []  # No extra fields required for createsuperuser

    def save(self, *args, **kwargs):
        # Auto-set trial dates on first creation
        if not self.trial_started_at:
            self.trial_started_at = timezone.now()
            self.trial_ends_at = self.trial_started_at + timedelta(days=7)
        super().save(*args, **kwargs)

    @property
    def is_in_trial(self) -> bool:
        return (
            self.trial_ends_at is not None
            and timezone.now() < self.trial_ends_at
        )

    def __str__(self) -> str:
        return self.email
