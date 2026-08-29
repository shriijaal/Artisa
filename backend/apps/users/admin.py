from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from apps.users.models import User, ArtistProfile, ArtistApplication


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'role', 'is_staff', 'is_active')
    list_filter = ('role', 'is_staff', 'is_active')
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Role', {'fields': ('role',)}),
    )


@admin.register(ArtistProfile)
class ArtistProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'status', 'verified_badge', 'created_at')
    list_filter = ('status', 'verified_badge')
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(ArtistApplication)
class ArtistApplicationAdmin(admin.ModelAdmin):
    list_display = ('user', 'status', 'has_portfolio', 'has_verification_document', 'created_at', 'reviewed_at')
    list_filter = ('status', 'created_at', 'reviewed_at')
    search_fields = ('user__username', 'user__email', 'reason')
    readonly_fields = ('created_at', 'updated_at', 'reviewed_at')
    fieldsets = (
        ('Application Info', {
            'fields': ('user', 'status', 'reason')
        }),
        ('Portfolio & Verification', {
            'fields': ('portfolio_samples', 'verification_document')
        }),
        ('Review Info', {
            'fields': ('rejection_reason', 'reviewed_by', 'reviewed_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    actions = ['approve_applications', 'reject_applications']

    def has_portfolio(self, obj):
        return bool(obj.portfolio_samples)
    has_portfolio.boolean = True
    has_portfolio.short_description = 'Portfolio'

    def has_verification_document(self, obj):
        return bool(obj.verification_document)
    has_verification_document.boolean = True
    has_verification_document.short_description = 'Verification Doc'

    def approve_applications(self, request, queryset):
        from django.utils import timezone
        for application in queryset.filter(status=ArtistApplication.Status.PENDING):
            application.status = ArtistApplication.Status.APPROVED
            application.reviewed_by = request.user
            application.reviewed_at = timezone.now()
            application.save()
            
            # Create or update artist profile
            profile, created = ArtistProfile.objects.get_or_create(
                user=application.user,
                defaults={
                    'status': ArtistProfile.Status.APPROVED,
                    'verified_badge': True
                }
            )
            if not created:
                profile.status = ArtistProfile.Status.APPROVED
                profile.verified_badge = True
                profile.save()
        
        self.message_user(request, f'{queryset.count()} application(s) approved.')
    approve_applications.short_description = 'Approve selected applications'

    def reject_applications(self, request, queryset):
        from django.utils import timezone
        for application in queryset.filter(status=ArtistApplication.Status.PENDING):
            application.status = ArtistApplication.Status.REJECTED
            application.reviewed_by = request.user
            application.reviewed_at = timezone.now()
            application.save()
        
        self.message_user(request, f'{queryset.count()} application(s) rejected.')
    reject_applications.short_description = 'Reject selected applications'
