from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView
from rest_framework.routers import DefaultRouter

from apps.accounts.views import UserViewSet
from apps.tickets.views import TicketAttachmentViewSet, TicketCategoryViewSet, TicketCommentViewSet, TicketViewSet


router = DefaultRouter()
router.register("users", UserViewSet, basename="user")
router.register("categories", TicketCategoryViewSet, basename="ticket-category")
router.register("tickets", TicketViewSet, basename="ticket")
router.register("comments", TicketCommentViewSet, basename="ticket-comment")
router.register("attachments", TicketAttachmentViewSet, basename="ticket-attachment")


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/swagger/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/docs/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
    path("api/", include(router.urls)),
    path("api-auth/", include("rest_framework.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
