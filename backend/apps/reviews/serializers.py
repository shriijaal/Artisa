from rest_framework import serializers

from apps.reviews.models import Review
from apps.users.serializers import UserSerializer


class ReviewSerializer(serializers.ModelSerializer):
    reviewer = UserSerializer(read_only=True)
    artwork_title = serializers.CharField(source='artwork.title', read_only=True)
    artist_username = serializers.CharField(source='artist.username', read_only=True)

    class Meta:
        model = Review
        fields = (
            'id', 'reviewer', 'artwork', 'artwork_title', 'artist',
            'artist_username', 'rating', 'comment', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'reviewer', 'artwork', 'artist', 'created_at', 'updated_at')


class ReviewCreateSerializer(serializers.Serializer):
    order_item_id = serializers.UUIDField()
    rating = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField(max_length=2000, trim_whitespace=True)

    def validate_comment(self, value):
        if not value.strip():
            raise serializers.ValidationError('Review comment cannot be empty.')
        return value.strip()

    def validate(self, data):
        from apps.orders.models import OrderItem

        try:
            order_item = OrderItem.objects.select_related('order', 'artwork', 'artist').get(
                id=data['order_item_id']
            )
        except OrderItem.DoesNotExist:
            raise serializers.ValidationError({'order_item_id': 'Order item not found.'})

        request = self.context['request']

        if order_item.order.customer_id != request.user.id:
            raise serializers.ValidationError({'order_item_id': 'You can only review items you purchased.'})

        if order_item.order.status not in ('delivered', 'completed'):
            raise serializers.ValidationError(
                {'order_item_id': 'You can only review items from delivered or completed orders.'}
            )

        if Review.objects.filter(reviewer=request.user, order_item=order_item).exists():
            raise serializers.ValidationError({'order_item_id': 'You have already reviewed this item.'})

        data['order_item'] = order_item
        data['artwork'] = order_item.artwork
        data['artist'] = order_item.artist
        return data
