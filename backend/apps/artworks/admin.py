from django.contrib import admin

from apps.artworks.models import Category, Artwork, ArtworkImage, ArtworkTag, DigitalFile


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'parent', 'created_at')
    list_filter = ('parent', 'created_at')
    search_fields = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}


class ArtworkImageInline(admin.TabularInline):
    model = ArtworkImage
    extra = 0
    readonly_fields = ('thumbnail',)


class ArtworkTagInline(admin.TabularInline):
    model = ArtworkTag
    extra = 1


@admin.register(Artwork)
class ArtworkAdmin(admin.ModelAdmin):
    list_display = ('title', 'artist', 'category', 'type', 'status', 'price', 'created_at')
    list_filter = ('status', 'type', 'category', 'created_at')
    search_fields = ('title', 'artist__username', 'description')
    readonly_fields = ('created_at', 'updated_at')
    inlines = [ArtworkImageInline, ArtworkTagInline]
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('artist', 'title', 'description', 'price', 'type')
        }),
        ('Classification', {
            'fields': ('category', 'stock', 'status', 'originality_confirmed')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    actions = ['publish_artworks', 'reject_artworks']
    
    def publish_artworks(self, request, queryset):
        updated = queryset.filter(status=Artwork.Status.PENDING_REVIEW).update(status=Artwork.Status.PUBLISHED)
        self.message_user(request, f'{updated} artwork(s) published.')
    publish_artworks.short_description = 'Publish selected artworks'
    
    def reject_artworks(self, request, queryset):
        updated = queryset.filter(status=Artwork.Status.PENDING_REVIEW).update(status=Artwork.Status.DRAFT)
        self.message_user(request, f'{updated} artwork(s) rejected and returned to draft.')
    reject_artworks.short_description = 'Reject selected artworks (return to draft)'


@admin.register(ArtworkImage)
class ArtworkImageAdmin(admin.ModelAdmin):
    list_display = ('artwork', 'is_primary', 'created_at')
    list_filter = ('is_primary', 'created_at')
    search_fields = ('artwork__title',)


@admin.register(ArtworkTag)
class ArtworkTagAdmin(admin.ModelAdmin):
    list_display = ('tag', 'artwork', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('tag', 'artwork__title')


@admin.register(DigitalFile)
class DigitalFileAdmin(admin.ModelAdmin):
    list_display = ('artwork', 'download_count', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('artwork__title',)
    readonly_fields = ('download_count',)
