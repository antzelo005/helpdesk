from rest_framework import permissions

from apps.accounts.models import User


def can_access_ticket(user: User, ticket) -> bool:
    if user.role == User.Roles.ADMIN:
        return True
    if user.role == User.Roles.AGENT:
        return ticket.assigned_to_id == user.id
    return ticket.created_by_id == user.id


class IsAdminOrAuthenticatedReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return user.role == User.Roles.ADMIN


class TicketPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        if user.role == User.Roles.ADMIN:
            return True

        if view.action == "create":
            return user.role == User.Roles.CLIENT

        if view.action == "destroy":
            return False

        return True

    def has_object_permission(self, request, view, obj):
        user = request.user

        if user.role == User.Roles.ADMIN:
            return True

        if user.role == User.Roles.CLIENT:
            return obj.created_by_id == user.id and request.method in permissions.SAFE_METHODS

        if user.role == User.Roles.AGENT:
            if obj.assigned_to_id != user.id:
                return False
            if request.method in permissions.SAFE_METHODS:
                return True
            return view.action in {"update", "partial_update"}

        return False


class TicketCommentPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return True

    def has_object_permission(self, request, view, obj):
        user = request.user

        if user.role == User.Roles.ADMIN:
            return True

        if not can_access_ticket(user, obj.ticket):
            return False

        if request.method in permissions.SAFE_METHODS:
            return True

        return obj.author_id == user.id


class TicketAttachmentPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return True

    def has_object_permission(self, request, view, obj):
        user = request.user

        if user.role == User.Roles.ADMIN:
            return True

        if not can_access_ticket(user, obj.ticket):
            return False

        if request.method in permissions.SAFE_METHODS:
            return True

        return obj.uploaded_by_id == user.id
