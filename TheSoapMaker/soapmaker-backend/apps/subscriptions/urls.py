from django.urls import path
from .views import SubscriptionStatusView

urlpatterns = [
    path("subscriptions/status/", SubscriptionStatusView.as_view(), name="subscription-status"),
]
