from django.urls import path

from apps.messaging.views import MessageListCreateView, UnreadCountView, MarkAllReadView, MessageReactionView, InquiryListView

urlpatterns = [
    path('', MessageListCreateView.as_view(), name='messages'),
    path('unread/', UnreadCountView.as_view(), name='messages_unread'),
    path('mark-all-read/', MarkAllReadView.as_view(), name='messages_mark_all_read'),
    path('<uuid:message_id>/react/', MessageReactionView.as_view(), name='message_react'),
    path('inquiries/', InquiryListView.as_view(), name='messages_inquiries'),
]
