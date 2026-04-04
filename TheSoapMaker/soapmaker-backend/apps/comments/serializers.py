from rest_framework import serializers
from .models import Comment


class CommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="user.display_name", read_only=True)
    author_avatar = serializers.CharField(source="user.avatar_url", read_only=True)
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = [
            "id", "parent", "body", "author_name", "author_avatar",
            "is_flagged", "replies", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "is_flagged", "created_at", "updated_at"]

    def get_replies(self, obj):
        """Return direct child comments (one level deep)."""
        qs = obj.replies.all().order_by("created_at")
        return ReplySerializer(qs, many=True).data


class ReplySerializer(serializers.ModelSerializer):
    """Flat serializer for replies — no further nesting."""

    author_name = serializers.CharField(source="user.display_name", read_only=True)
    author_avatar = serializers.CharField(source="user.avatar_url", read_only=True)

    class Meta:
        model = Comment
        fields = [
            "id", "parent", "body", "author_name", "author_avatar",
            "is_flagged", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "is_flagged", "created_at", "updated_at"]
