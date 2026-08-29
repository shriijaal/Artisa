from django.contrib import admin

from apps.messaging.models import Message


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'sender', 'receiver', 'commission', 'read_at', 'created_at')
    list_filter = ('read_at', 'created_at')
    search_fields = ('body', 'sender__username', 'receiver__username')
    readonly_fields = ('id', 'created_at')
