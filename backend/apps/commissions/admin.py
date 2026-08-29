from django.contrib import admin
from apps.commissions.models import Commission, CommissionDeliverable, CommissionReferenceImage


@admin.register(Commission)
class CommissionAdmin(admin.ModelAdmin):
    list_display = ('title', 'customer', 'artist', 'status', 'budget_min', 'budget_max', 'deadline', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('title', 'description', 'customer__username', 'artist__username')
    readonly_fields = ('id', 'created_at', 'updated_at')


@admin.register(CommissionDeliverable)
class CommissionDeliverableAdmin(admin.ModelAdmin):
    list_display = ('commission', 'revision_number', 'created_at')
    list_filter = ('revision_number',)


@admin.register(CommissionReferenceImage)
class CommissionReferenceImageAdmin(admin.ModelAdmin):
    list_display = ('commission', 'created_at')

