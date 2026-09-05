from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from apps.users.views import (
    admin_approve_application,
    admin_applications,
    artist_application,
    artist_profile,
    artists_list,
    change_password,
    CustomTokenObtainPairView,
    favorites,
    logout,
    me,
    password_reset_confirm,
    password_reset_request,
    public_artist_profile,
    register,
    remove_favorite,
    remove_favorite_by_artwork,
    update_avatar,
)

urlpatterns = [
    path('register/', register, name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('logout/', logout, name='logout'),
    path('refresh/', TokenRefreshView.as_view(), name='refresh'),
    path('me/', me, name='me'),
    path('change-password/', change_password, name='change_password'),
    path('password-reset/', password_reset_request, name='password_reset_request'),
    path('password-reset-confirm/', password_reset_confirm, name='password_reset_confirm'),
    path('artist/application/', artist_application, name='artist_application'),
    path('artist/profile/', artist_profile, name='artist_profile'),
    path('artist/avatar/', update_avatar, name='update_avatar'),
    path('artists/list/', artists_list, name='artists_list'),
    path('artists/<str:username>/', public_artist_profile, name='public_artist_profile'),
    path('favorites/', favorites, name='favorites'),
    path('favorites/<uuid:favorite_id>/', remove_favorite, name='remove_favorite'),
    path('favorites/artwork/<uuid:artwork_id>/', remove_favorite_by_artwork, name='remove_favorite_by_artwork'),
    path('admin/applications/', admin_applications, name='admin_applications'),
    path('admin/applications/<uuid:application_id>/approve/', admin_approve_application, name='admin_approve_application'),
]
