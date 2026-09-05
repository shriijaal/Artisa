from django.urls import path

from apps.messaging.views import MessageListCreateView, UnreadCountView, InquiryListView

urlpatterns = [
    path('', MessageListCreateView.as_view(), name='messages'),
    path('unread/', UnreadCountView.as_view(), name='messages_unread'),
    path('inquiries/', InquiryListView.as_view(), name='messages_inquiries'),
]
