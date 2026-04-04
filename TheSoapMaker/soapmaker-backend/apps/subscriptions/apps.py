from django.apps import AppConfig


class SubscriptionsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.subscriptions"

    def ready(self):
        # Import models module to register the post_save signal defined there.
        import apps.subscriptions.models  # noqa: F401
