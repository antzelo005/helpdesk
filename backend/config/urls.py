from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView
from rest_framework.routers import DefaultRouter
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenVerifyView

from apps.accounts.views import ChangePasswordView, CurrentUserView, RegisterView, UserViewSet
from apps.tickets.views import TicketAttachmentViewSet, TicketCategoryViewSet, TicketCommentViewSet, TicketViewSet


router = DefaultRouter()
router.register("users", UserViewSet, basename="user")
router.register("categories", TicketCategoryViewSet, basename="ticket-category")
router.register("tickets", TicketViewSet, basename="ticket")
router.register("comments", TicketCommentViewSet, basename="ticket-comment")
router.register("attachments", TicketAttachmentViewSet, basename="ticket-attachment")


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/token/", TokenObtainPairView.as_view(permission_classes=[AllowAny]), name="token_obtain_pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(permission_classes=[AllowAny]), name="token_refresh"),
    path("api/auth/token/verify/", TokenVerifyView.as_view(permission_classes=[AllowAny]), name="token_verify"),
    path("api/auth/register/", RegisterView.as_view(), name="register"),
    path("api/auth/me/", CurrentUserView.as_view(), name="current-user"),
    path("api/auth/change-password/", ChangePasswordView.as_view(), name="change-password"),
    path("api/schema/", SpectacularAPIView.as_view(permission_classes=[AllowAny]), name="schema"),
    path("api/docs/swagger/", SpectacularSwaggerView.as_view(url_name="schema", permission_classes=[AllowAny]), name="swagger-ui"),
    path("api/docs/redoc/", SpectacularRedocView.as_view(url_name="schema", permission_classes=[AllowAny]), name="redoc"),
    path("api/", include(router.urls)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
