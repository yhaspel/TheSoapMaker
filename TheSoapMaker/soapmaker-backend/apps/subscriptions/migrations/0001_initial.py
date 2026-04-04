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
        migrations.CreateModel(
            name="Subscription",
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
                    "user",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="subscription",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                ("stripe_customer_id", models.CharField(blank=True, max_length=100)),
                ("stripe_subscription_id", models.CharField(blank=True, max_length=100)),
                (
                    "plan",
                    models.CharField(
                        choices=[
                            ("free", "Free"),
                            ("premium_monthly", "Premium Monthly"),
                            ("premium_annual", "Premium Annual"),
                        ],
                        default="free",
                        max_length=20,
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("active", "Active"),
                            ("canceled", "Canceled"),
                            ("past_due", "Past Due"),
                            ("trialing", "Trialing"),
                        ],
                        default="active",
                        max_length=20,
                    ),
                ),
                ("current_period_end", models.DateTimeField(blank=True, null=True)),
                ("cancel_at_period_end", models.BooleanField(default=False)),
            ],
        ),
    ]
