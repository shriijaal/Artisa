from datetime import timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.notifications.models import Notification
from apps.notifications.serializers import NotificationSerializer

LIST_LIMIT = 50
PRUNE_AFTER_DAYS = 60


class NotificationListView(APIView):
    """GET /api/notifications/ — latest notifications for the current user."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Lazy retention: the repo has no scheduler, so prune on read
        Notification.objects.filter(
            recipient=request.user,
            read_at__isnull=False,
            read_at__lt=timezone.now() - timedelta(days=PRUNE_AFTER_DAYS),
        ).delete()
        items = Notification.objects.filter(recipient=request.user)[:LIST_LIMIT]
        return Response(NotificationSerializer(items, many=True).data)


class NotificationUnreadView(APIView):
    """GET /api/notifications/unread/ — unread notification count."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(
            recipient=request.user,
            read_at__isnull=True,
        ).count()
        return Response({'unread_count': count})


class NotificationMarkReadView(APIView):
    """POST /api/notifications/<pk>/read/ — mark one notification as read."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            notification = Notification.objects.get(pk=pk, recipient=request.user)
        except Notification.DoesNotExist:
            return Response({'error': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)
        if notification.read_at is None:
            notification.read_at = timezone.now()
            notification.save(update_fields=['read_at'])
        return Response({'message': 'Notification marked as read'})


class NotificationMarkAllReadView(APIView):
    """POST /api/notifications/mark-all-read/ — mark all unread as read."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        updated = Notification.objects.filter(
            recipient=request.user,
            read_at__isnull=True,
        ).update(read_at=timezone.now())
        return Response({'marked_read': updated})
