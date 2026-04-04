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
