from django.urls import path
from .views import UserProfileView, AvatarUploadView

# Mounted under api/v1/auth/ in config/urls.py
urlpatterns = [
    path("user/", UserProfileView.as_view(), name="user-profile"),
]

# Mounted under api/v1/users/ in config/urls.py
users_urlpatterns = [
    path("avatar/", AvatarUploadView.as_view(), name="avatar-upload"),
]
