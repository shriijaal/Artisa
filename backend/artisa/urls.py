from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

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
    path('api/reviews/', include('apps.reviews.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
