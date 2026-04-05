from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAuthorOrReadOnly(BasePermission):
    """
    Read access: anyone.
    Write access (PUT, PATCH, DELETE): only the recipe's author.
    Returns 403 (not 401) for authenticated non-authors.
    """

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return obj.author == request.user


class IsPremiumUser(BasePermission):
    """Only premium users may proceed."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.is_premium
        )


class CanViewPremiumRecipe(BasePermission):
    """
    For recipe detail retrieval: if the recipe is premium, only premium
    users (or the recipe author) may view it.
    Write operations are handled by other permissions.
    """

    def has_object_permission(self, request, view, obj):
        if request.method not in SAFE_METHODS:
            return True  # let other perms handle writes
        if not getattr(obj, "is_premium", False):
            return True  # not a premium recipe — everyone can view
        # Premium recipe: allow if user is premium or is the author
        user = request.user
        if user and user.is_authenticated:
            if user.is_premium or obj.author == user:
                return True
        return False
