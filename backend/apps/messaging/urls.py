from django.urls import path

from apps.messaging.views import MessageListCreateView, UnreadCountView

urlpatterns = [
    path('', MessageListCreateView.as_view(), name='messages'),
    path('unread/', UnreadCountView.as_view(), name='messages_unread'),
]
