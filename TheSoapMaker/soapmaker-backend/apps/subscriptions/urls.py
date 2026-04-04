from django.urls import path

from .views import CancelView, CreateCheckoutView, SubscriptionStatusView, WebhookView

urlpatterns = [
    path("subscriptions/status/", SubscriptionStatusView.as_view(), name="subscription-status"),
    path("subscriptions/checkout/", CreateCheckoutView.as_view(), name="subscription-checkout"),
    path("subscriptions/cancel/", CancelView.as_view(), name="subscription-cancel"),
    path("subscriptions/webhook/", WebhookView.as_view(), name="subscription-webhook"),
]
