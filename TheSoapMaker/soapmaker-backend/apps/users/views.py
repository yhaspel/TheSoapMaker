import cloudinary.uploader
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status
from .serializers import UserProfileSerializer


class UserProfileView(APIView):
    """
    GET  /api/v1/auth/user/  — return the authenticated user's profile
    PUT  /api/v1/auth/user/  — update display_name, avatar_url, bio
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        serializer = UserProfileSerializer(
            request.user, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def patch(self, request):
        return self.put(request)


class AvatarUploadView(APIView):
    """
    POST /api/v1/users/avatar/  — upload a new profile photo
    Accepts multipart/form-data with an 'avatar' image file.
    Uploads to Cloudinary, persists the URL on the user record,
    and returns { avatar_url: "..." }.
    """

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file = request.FILES.get('avatar')
        if not file:
            return Response(
                {'error': 'No file provided. Send a file under the "avatar" key.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            result = cloudinary.uploader.upload(
                file,
                folder='avatars',
                public_id=str(request.user.id),
                overwrite=True,
                transformation=[
                    {'width': 300, 'height': 300, 'crop': 'fill', 'gravity': 'face'},
                ],
                resource_type='image',
            )
        except Exception as exc:
            return Response(
                {'error': f'Upload failed: {exc}'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        url = result['secure_url']
        request.user.avatar_url = url
        request.user.save(update_fields=['avatar_url'])
        return Response({'avatar_url': url}, status=status.HTTP_200_OK)
