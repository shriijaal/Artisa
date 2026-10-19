from django.urls import path

from apps.notifications.views import (
    NotificationListView,
    NotificationMarkAllReadView,
    NotificationMarkReadView,
    NotificationUnreadView,
)

urlpatterns = [
    path('', NotificationListView.as_view(), name='notifications'),
    path('unread/', NotificationUnreadView.as_view(), name='notifications_unread'),
    path('mark-all-read/', NotificationMarkAllReadView.as_view(), name='notifications_mark_all_read'),
    path('<uuid:pk>/read/', NotificationMarkReadView.as_view(), name='notifications_mark_read'),
]
