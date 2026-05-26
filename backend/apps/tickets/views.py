from django.db.models import QuerySet
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied

from apps.accounts.models import User

from .models import Ticket, TicketAttachment, TicketCategory, TicketComment
from .permissions import (
    IsAdminOrAuthenticatedReadOnly,
    TicketAttachmentPermission,
    TicketCommentPermission,
    TicketPermission,
    can_access_ticket,
)
from .serializers import TicketAttachmentSerializer, TicketCategorySerializer, TicketCommentSerializer, TicketSerializer


@extend_schema_view(list=extend_schema(tags=["Categories"]), retrieve=extend_schema(tags=["Categories"]))
class TicketCategoryViewSet(viewsets.ModelViewSet):
    queryset = TicketCategory.objects.all()
    serializer_class = TicketCategorySerializer
    permission_classes = [IsAdminOrAuthenticatedReadOnly]
    search_fields = ("name", "slug", "description")
    ordering_fields = ("name", "created_at")

    def get_queryset(self) -> QuerySet[TicketCategory]:
        queryset = super().get_queryset()
        if self.request.user.role == User.Roles.ADMIN:
            return queryset
        return queryset.filter(is_active=True)


@extend_schema(tags=["Tickets"])
class TicketViewSet(viewsets.ModelViewSet):
    serializer_class = TicketSerializer
    queryset = Ticket.objects.select_related("category", "created_by", "assigned_to").prefetch_related("comments__author", "attachments__uploaded_by")
    permission_classes = [TicketPermission]
    filterset_fields = ("status", "priority", "category", "assigned_to")
    search_fields = ("title", "description")
    ordering_fields = ("created_at", "updated_at", "priority", "status")

    def get_queryset(self) -> QuerySet[Ticket]:
        user = self.request.user
        queryset = self.queryset
        if user.role == User.Roles.ADMIN:
            return queryset
        if user.role == User.Roles.AGENT:
            return queryset.filter(assigned_to=user)
        return queryset.filter(created_by=user)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        user = self.request.user
        ticket = self.get_object()
        if user.role == User.Roles.CLIENT:
            raise PermissionDenied("Clients cannot update tickets.")
        if user.role == User.Roles.AGENT:
            changed_fields = set(serializer.validated_data.keys())
            if changed_fields - {"status"}:
                raise PermissionDenied("Agents can only update ticket status.")
            if ticket.assigned_to_id != user.id:
                raise PermissionDenied("Agents can only update assigned tickets.")
        serializer.save()

    def perform_destroy(self, instance):
        if self.request.user.role != User.Roles.ADMIN:
            raise PermissionDenied("Only admins can delete tickets.")
        instance.delete()


@extend_schema(tags=["Comments"])
class TicketCommentViewSet(viewsets.ModelViewSet):
    serializer_class = TicketCommentSerializer
    queryset = TicketComment.objects.select_related("ticket", "author")
    permission_classes = [TicketCommentPermission]
    filterset_fields = ("ticket", "author")
    ordering_fields = ("created_at", "updated_at")

    def get_queryset(self) -> QuerySet[TicketComment]:
        user = self.request.user
        queryset = self.queryset
        if user.role == User.Roles.ADMIN:
            return queryset
        if user.role == User.Roles.AGENT:
            return queryset.filter(ticket__assigned_to=user)
        return queryset.filter(ticket__created_by=user)

    def perform_create(self, serializer):
        ticket = serializer.validated_data["ticket"]
        if not can_access_ticket(self.request.user, ticket):
            raise PermissionDenied("You do not have access to this ticket.")
        serializer.save(author=self.request.user)

    def perform_update(self, serializer):
        comment = self.get_object()
        user = self.request.user
        if user.role != User.Roles.ADMIN and comment.author_id != user.id:
            raise PermissionDenied("You can only edit your own comments.")
        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user
        if user.role != User.Roles.ADMIN and instance.author_id != user.id:
            raise PermissionDenied("You can only delete your own comments.")
        instance.delete()


@extend_schema(tags=["Attachments"])
class TicketAttachmentViewSet(viewsets.ModelViewSet):
    serializer_class = TicketAttachmentSerializer
    queryset = TicketAttachment.objects.select_related("ticket", "uploaded_by")
    permission_classes = [TicketAttachmentPermission]
    filterset_fields = ("ticket", "uploaded_by")
    ordering_fields = ("created_at",)

    def get_queryset(self) -> QuerySet[TicketAttachment]:
        user = self.request.user
        queryset = self.queryset
        if user.role == User.Roles.ADMIN:
            return queryset
        if user.role == User.Roles.AGENT:
            return queryset.filter(ticket__assigned_to=user)
        return queryset.filter(ticket__created_by=user)

    def perform_create(self, serializer):
        ticket = serializer.validated_data["ticket"]
        if not can_access_ticket(self.request.user, ticket):
            raise PermissionDenied("You do not have access to this ticket.")
        serializer.save(uploaded_by=self.request.user)

    def perform_destroy(self, instance):
        user = self.request.user
        if user.role != User.Roles.ADMIN and instance.uploaded_by_id != user.id:
            raise PermissionDenied("You can only delete your own attachments.")
        instance.delete()
