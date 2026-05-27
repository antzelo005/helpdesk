from rest_framework import decorators, generics, permissions, response, status, viewsets
from rest_framework.views import APIView

from .models import User
from .serializers import ChangePasswordSerializer, CurrentUserUpdateSerializer, RegisterSerializer, UserSerializer


class IsAdminRole(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == User.Roles.ADMIN)


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all().order_by("id")
    serializer_class = UserSerializer
    permission_classes = [IsAdminRole]
    search_fields = ("username", "email", "first_name", "last_name")
    ordering_fields = ("id", "username", "email", "role")

    @decorators.action(detail=False, methods=["get"], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return response.Response(serializer.data)


class CurrentUserView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return CurrentUserUpdateSerializer
        return UserSerializer


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        user = request.user
        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password"])

        return response.Response({"detail": "Password updated successfully."}, status=status.HTTP_200_OK)


class RegisterView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return response.Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
