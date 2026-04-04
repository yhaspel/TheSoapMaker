from django.contrib import admin
from django.urls import path, include
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView


@api_view(["GET"])
@permission_classes([AllowAny])
def health(request):
    return Response({"status": "ok"})


urlpatterns = [
    path("admin/", admin.site.urls),

    # Health check
    path("api/v1/health/", health, name="health"),

    # OpenAPI / Swagger UI
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/schema/swagger-ui/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),

    # -----------------------------------------------------------------------
    # Authentication (dj-rest-auth)
    # -----------------------------------------------------------------------
    # POST /api/v1/auth/login/            — email + password → JWT
    # POST /api/v1/auth/logout/           — blacklist refresh token
    # POST /api/v1/auth/password/change/  — change password
    # POST /api/v1/auth/password/reset/   — request password reset email
    path("api/v1/auth/", include("dj_rest_auth.urls")),

    # POST /api/v1/auth/registration/     — email/password sign-up
    path("api/v1/auth/registration/", include("dj_rest_auth.registration.urls")),

    # GET/PUT /api/v1/auth/user/          — own profile (custom view)
    path("api/v1/auth/", include("apps.users.urls")),

    # POST /api/v1/auth/token/refresh/    — refresh access token
    path(
        "api/v1/auth/token/refresh/",
        include("rest_framework_simplejwt.urls"),
    ),

    # Social OAuth redirects (allauth)
    # GET /api/v1/auth/google/
    # GET /api/v1/auth/facebook/
    # GET /api/v1/auth/twitter/
    path("api/v1/auth/", include("allauth.socialaccount.urls")),

    # -----------------------------------------------------------------------
    # App APIs (to be expanded in later milestones)
    # -----------------------------------------------------------------------
    path("api/v1/", include("apps.recipes.urls")),
    path("api/v1/", include("apps.ratings.urls")),
    path("api/v1/", include("apps.comments.urls")),
    path("api/v1/", include("apps.subscriptions.urls")),
]
