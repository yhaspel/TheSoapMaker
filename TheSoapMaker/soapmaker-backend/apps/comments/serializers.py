from rest_framework import serializers
from .models import Comment


class CommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="user.display_name", read_only=True)
    author_avatar = serializers.CharField(source="user.avatar_url", read_only=True)

    class Meta:
        model = Comment
        fields = [
            "id", "parent", "body", "author_name", "author_avatar",
            "is_flagged", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "is_flagged", "created_at", "updated_at"]
