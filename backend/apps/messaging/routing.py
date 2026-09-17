from django.urls import re_path

from apps.messaging import consumers

websocket_urlpatterns = [
    re_path(r'ws/messages/(?P<user_id>\w+)/$', consumers.ChatConsumer.as_asgi()),
]
