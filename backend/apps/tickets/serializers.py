from rest_framework import serializers

from apps.accounts.models import User
from apps.accounts.serializers import UserSerializer

from .models import Ticket, TicketAttachment, TicketCategory, TicketComment


class TicketCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = TicketCategory
        fields = ("id", "name", "slug", "description", "is_active", "created_at")
        read_only_fields = ("id", "created_at")


class TicketCommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    author_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source="author", write_only=True, required=False
    )
    ticket_id = serializers.PrimaryKeyRelatedField(queryset=Ticket.objects.all(), source="ticket")

    class Meta:
        model = TicketComment
        fields = ("id", "ticket", "ticket_id", "author", "author_id", "body", "created_at", "updated_at")
        read_only_fields = ("id", "ticket", "author", "created_at", "updated_at")


class TicketAttachmentSerializer(serializers.ModelSerializer):
    uploaded_by = UserSerializer(read_only=True)
    ticket_id = serializers.PrimaryKeyRelatedField(queryset=Ticket.objects.all(), source="ticket")

    class Meta:
        model = TicketAttachment
        fields = ("id", "ticket", "ticket_id", "uploaded_by", "file", "created_at")
        read_only_fields = ("id", "ticket", "uploaded_by", "created_at")


class TicketSerializer(serializers.ModelSerializer):
    category = TicketCategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(queryset=TicketCategory.objects.all(), source="category", write_only=True)
    created_by = UserSerializer(read_only=True)
    assigned_to = UserSerializer(read_only=True)
    assigned_to_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role=User.Roles.AGENT),
        source="assigned_to",
        write_only=True,
        allow_null=True,
        required=False,
    )
    comments = TicketCommentSerializer(many=True, read_only=True)
    attachments = TicketAttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = Ticket
        fields = (
            "id",
            "title",
            "description",
            "category",
            "category_id",
            "status",
            "priority",
            "created_by",
            "assigned_to",
            "assigned_to_id",
            "created_at",
            "updated_at",
            "comments",
            "attachments",
        )
        read_only_fields = ("id", "created_by", "created_at", "updated_at", "comments", "attachments")

    def validate(self, attrs):
        request = self.context["request"]
        user = request.user
        if user.role == User.Roles.CLIENT:
            attrs.pop("assigned_to", None)
            attrs["status"] = Ticket.Status.OPEN
        return attrs
