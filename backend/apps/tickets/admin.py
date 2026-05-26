from django.contrib import admin

from .models import Ticket, TicketAttachment, TicketCategory, TicketComment


@admin.register(TicketCategory)
class TicketCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "is_active", "created_at")
    list_filter = ("is_active",)
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}


class TicketCommentInline(admin.TabularInline):
    model = TicketComment
    extra = 0


class TicketAttachmentInline(admin.TabularInline):
    model = TicketAttachment
    extra = 0


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "category", "status", "priority", "created_by", "assigned_to", "created_at")
    list_filter = ("status", "priority", "category")
    search_fields = ("title", "description", "created_by__username", "assigned_to__username")
    autocomplete_fields = ("created_by", "assigned_to", "category")
    inlines = [TicketCommentInline, TicketAttachmentInline]


@admin.register(TicketComment)
class TicketCommentAdmin(admin.ModelAdmin):
    list_display = ("id", "ticket", "author", "created_at")
    search_fields = ("ticket__title", "author__username", "body")
    autocomplete_fields = ("ticket", "author")


@admin.register(TicketAttachment)
class TicketAttachmentAdmin(admin.ModelAdmin):
    list_display = ("id", "ticket", "uploaded_by", "created_at")
    search_fields = ("ticket__title", "uploaded_by__username")
    autocomplete_fields = ("ticket", "uploaded_by")
