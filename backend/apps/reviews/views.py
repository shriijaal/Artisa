from django.db.models import Avg, Count
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.reviews.models import Review
from apps.reviews.serializers import ReviewCreateSerializer, ReviewSerializer


class ReviewListCreateView(APIView):
    """GET/POST /api/reviews/"""

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request):
        artwork_id = request.query_params.get('artwork_id')
        artist_id = request.query_params.get('artist_id')

        reviews = Review.objects.select_related('reviewer', 'artwork', 'artist').all()

        if artwork_id:
            reviews = reviews.filter(artwork_id=artwork_id)
        if artist_id:
            reviews = reviews.filter(artist_id=artist_id)

        reviews = reviews[:50]
        serializer = ReviewSerializer(reviews, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        serializer = ReviewCreateSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        review = Review.objects.create(
            reviewer=request.user,
            order_item=serializer.validated_data['order_item'],
            artwork=serializer.validated_data['artwork'],
            artist=serializer.validated_data['artist'],
            rating=serializer.validated_data['rating'],
            comment=serializer.validated_data['comment'],
        )
        return Response(
            ReviewSerializer(review, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class ReviewDetailView(APIView):
    """GET /api/reviews/{id}/"""

    def get_permissions(self):
        return [AllowAny()]

    def get(self, request, pk):
        try:
            review = Review.objects.select_related('reviewer', 'artwork', 'artist').get(id=pk)
        except Review.DoesNotExist:
            return Response({'error': 'Review not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = ReviewSerializer(review, context={'request': request})
        return Response(serializer.data)


class ArtworkRatingView(APIView):
    """GET /api/reviews/artwork/{artwork_id}/avg/"""

    def get_permissions(self):
        return [AllowAny()]

    def get(self, request, artwork_id):
        stats = Review.objects.filter(artwork_id=artwork_id).aggregate(
            avg_rating=Avg('rating'),
            review_count=Count('id'),
        )
        return Response({
            'avg_rating': round(stats['avg_rating'], 1) if stats['avg_rating'] else None,
            'review_count': stats['review_count'],
        })


class ArtistRatingView(APIView):
    """GET /api/reviews/artist/{user_id}/avg/"""

    def get_permissions(self):
        return [AllowAny()]

    def get(self, request, user_id):
        stats = Review.objects.filter(artist_id=user_id).aggregate(
            avg_rating=Avg('rating'),
            review_count=Count('id'),
        )
        return Response({
            'avg_rating': round(stats['avg_rating'], 1) if stats['avg_rating'] else None,
            'review_count': stats['review_count'],
        })
