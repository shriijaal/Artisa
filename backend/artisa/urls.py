from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import HttpResponseForbidden
from django.urls import include, path


def _block_raw_artwork_media(request, path):
    return HttpResponseForbidden('Forbidden')


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('apps.core.urls')),
    path('api/auth/', include('apps.users.urls')),
    path('api/artworks/', include('apps.artworks.urls')),
    path('api/orders/', include('apps.orders.urls')),
    path('api/payments/', include('apps.payments.urls')),
    path('api/recs/', include('apps.recs.urls')),
    path('api/commissions/', include('apps.commissions.urls')),
    path('api/messages/', include('apps.messaging.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/reviews/', include('apps.reviews.urls')),
    path('api/admin/', include('apps.admin_api.urls')),
    # Block direct access to raw artwork media — only /api/artworks/image/<id>/ is allowed
    path('media/artworks/<path:path>', _block_raw_artwork_media),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
