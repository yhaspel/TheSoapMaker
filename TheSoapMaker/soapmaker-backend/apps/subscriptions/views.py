from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .serializers import SubscriptionSerializer


class SubscriptionStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            sub = request.user.subscription
            serializer = SubscriptionSerializer(sub)
            return Response(serializer.data)
        except Exception:
            return Response({"plan": "free", "status": "active"})
