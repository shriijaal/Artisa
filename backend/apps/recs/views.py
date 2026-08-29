import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from django.db import models
from django.db.models import Count
from django.utils import timezone
from apps.artworks.models import Artwork, Category, ArtworkTag
from apps.users.models import User
from apps.recs.models import UserInteraction, RecommendationCache
from apps.recs.serializers import InteractionSerializer
from apps.recs.utils import log_interaction
from apps.recs.engine import get_recommendation_engine
from apps.artworks.serializers import ArtworkSerializer, CategorySerializer
from apps.users.serializers import UserSerializer

logger = logging.getLogger(__name__)


class InteractionCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = InteractionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        interaction = log_interaction(
            user=request.user,
            target_type=serializer.validated_data['target_type'],
            target_id=serializer.validated_data['target_id'],
            interaction_type=serializer.validated_data['interaction_type'],
        )

        if interaction is None:
            return Response({'detail': 'Interaction deduplicated'}, status=status.HTTP_204_NO_CONTENT)

        return Response(InteractionSerializer(interaction).data, status=status.HTTP_201_CREATED)


class RecommendationArtworksView(APIView):
    """GET /api/recs/artworks/ — personalized artwork recommendations."""
    permission_classes = [AllowAny]

    def get(self, request):
        k = min(int(request.query_params.get('k', 8)), 20)
        user_id = request.user.id if request.user.is_authenticated else None

        # Try cache first
        if user_id:
            cache = RecommendationCache.objects.filter(
                user_id=user_id, target_type='artwork'
            ).first()
            if cache and cache.target_ids:
                artwork_ids = cache.target_ids[:k]
                artworks = Artwork.objects.filter(id__in=artwork_ids, status=Artwork.Status.PUBLISHED)
                # Preserve ordering
                id_order = {aid: i for i, aid in enumerate(artwork_ids)}
                artworks = sorted(artworks, key=lambda a: id_order.get(a.id, 999))
                return Response(ArtworkSerializer(artworks, many=True, context={'request': request}).data)

        # Compute fresh
        try:
            engine = get_recommendation_engine()
            artwork_ids = engine.get_artwork_recommendations(user_id=user_id, k=k)
            artworks = Artwork.objects.filter(id__in=artwork_ids, status=Artwork.Status.PUBLISHED)
            id_order = {aid: i for i, aid in enumerate(artwork_ids)}
            artworks = sorted(artworks, key=lambda a: id_order.get(a.id, 999))

            # Write back to cache for authenticated users
            if user_id and artwork_ids:
                RecommendationCache.objects.update_or_create(
                    user_id=user_id,
                    target_type='artwork',
                    defaults={
                        'target_ids': [str(aid) for aid in artwork_ids],
                        'computed_at': timezone.now(),
                    },
                )

            return Response(ArtworkSerializer(artworks, many=True, context={'request': request}).data)
        except Exception as e:
            logger.error('Recommendation engine error: %s', e)
            # Fallback to trending
            artworks = Artwork.objects.filter(
                status=Artwork.Status.PUBLISHED
            ).order_by('-created_at')[:k]
            return Response(ArtworkSerializer(artworks, many=True, context={'request': request}).data)


class RecommendationArtistsView(APIView):
    """GET /api/recs/artists/ — recommended artists."""
    permission_classes = [AllowAny]

    def get(self, request):
        k = min(int(request.query_params.get('k', 4)), 10)
        user_id = request.user.id if request.user.is_authenticated else None

        try:
            engine = get_recommendation_engine()
            artist_ids = engine.get_artist_recommendations(user_id=user_id, k=k)
            artists = User.objects.filter(id__in=artist_ids, artist_profile__status='approved')
            return Response(UserSerializer(artists, many=True, context={'request': request}).data)
        except Exception as e:
            logger.error('Artist recommendation error: %s', e)
            artists = User.objects.filter(
                artist_profile__status='approved'
            ).order_by('-date_joined')[:k]
            return Response(UserSerializer(artists, many=True, context={'request': request}).data)


class SimilarArtworksView(APIView):
    """GET /api/recs/similar/<artwork_id>/ — similar artworks."""
    permission_classes = [AllowAny]

    def get(self, request, artwork_id):
        k = min(int(request.query_params.get('k', 4)), 10)

        try:
            engine = get_recommendation_engine()
            similar_ids = engine.get_similar_artworks(artwork_id, k=k)
            artworks = Artwork.objects.filter(id__in=similar_ids, status=Artwork.Status.PUBLISHED)
            id_order = {aid: i for i, aid in enumerate(similar_ids)}
            artworks = sorted(artworks, key=lambda a: id_order.get(a.id, 999))

            # Fallback: backfill from same category if < k results
            if len(artworks) < k:
                try:
                    target = Artwork.objects.get(id=artwork_id)
                    existing_ids = set(similar_ids) | {artwork_id}
                    fallback = Artwork.objects.filter(
                        category=target.category,
                        status=Artwork.Status.PUBLISHED,
                    ).exclude(id__in=existing_ids)[:k - len(artworks)]
                    artworks = list(artworks) + list(fallback)
                except Artwork.DoesNotExist:
                    pass

            return Response(ArtworkSerializer(artworks, many=True, context={'request': request}).data)
        except Exception as e:
            logger.error('Similar artworks error: %s', e)
            return Response([])


class HomepageView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        # 1. Hero Featured — top 3 most recent published
        hero_artworks = Artwork.objects.filter(
            status=Artwork.Status.PUBLISHED
        ).order_by('-created_at')[:3]

        # 2. Hybrid Recommendations via engine
        recommendation_type = "trending"
        recommended_artworks = []

        try:
            engine = get_recommendation_engine()
            user_id = request.user.id if request.user.is_authenticated else None
            artwork_ids = engine.get_artwork_recommendations(user_id=user_id, k=8)
            if artwork_ids and user_id:
                recommendation_type = "personalized"
            recommended_artworks = Artwork.objects.filter(
                id__in=artwork_ids, status=Artwork.Status.PUBLISHED
            )
            # Preserve engine ordering
            id_order = {aid: i for i, aid in enumerate(artwork_ids)}
            recommended_artworks = sorted(recommended_artworks, key=lambda a: id_order.get(a.id, 999))
        except Exception as e:
            logger.error('Homepage recommendation engine error: %s', e)

        # Fallback if engine returned nothing
        if not recommended_artworks:
            recommended_artworks = Artwork.objects.filter(
                status=Artwork.Status.PUBLISHED
            ).order_by('-created_at')[:8]

        # 3. Categories
        categories = Category.objects.all()[:6]

        # 4. Featured Artists
        featured_artists = User.objects.filter(
            artist_profile__status='approved'
        ).order_by('-date_joined')[:4]

        return Response({
            'hero_featured': ArtworkSerializer(hero_artworks, many=True, context={'request': request}).data,
            'recommendation_type': recommendation_type,
            'recommended_artworks': ArtworkSerializer(recommended_artworks, many=True, context={'request': request}).data,
            'categories': CategorySerializer(categories, many=True, context={'request': request}).data,
            'featured_artists': UserSerializer(featured_artists, many=True, context={'request': request}).data,
        })


class TrendingView(APIView):
    """GET /api/recs/trending/ — trending artworks and artists for search dropdown."""
    permission_classes = [AllowAny]

    def get(self, request):
        artworks = Artwork.objects.filter(
            status=Artwork.Status.PUBLISHED
        ).order_by('-created_at')[:12]

        artists = User.objects.filter(
            artist_profile__status='approved'
        ).order_by('-date_joined')[:8]

        categories = Category.objects.all()[:10]

        return Response({
            'artworks': ArtworkSerializer(artworks, many=True, context={'request': request}).data,
            'artists': UserSerializer(artists, many=True, context={'request': request}).data,
            'categories': CategorySerializer(categories, many=True).data,
        })


class GlobalSearchView(APIView):
    """GET /api/recs/search/?q=query — search artworks, artists, tags, categories."""
    permission_classes = [AllowAny]

    def get(self, request):
        q = request.query_params.get('q', '').strip()
        if not q:
            return Response({'artworks': [], 'artists': [], 'categories': []})

        artworks = Artwork.objects.filter(
            status=Artwork.Status.PUBLISHED
        ).filter(
            models.Q(title__icontains=q) |
            models.Q(artist__username__icontains=q) |
            models.Q(category__name__icontains=q) |
            models.Q(tags__tag__icontains=q) |
            models.Q(description__icontains=q)
        ).distinct()[:8]

        artists = User.objects.filter(
            artist_profile__status='approved'
        ).filter(
            models.Q(username__icontains=q) |
            models.Q(first_name__icontains=q) |
            models.Q(last_name__icontains=q)
        ).distinct()[:5]

        categories = Category.objects.filter(
            models.Q(name__icontains=q)
        )[:5]

        return Response({
            'artworks': ArtworkSerializer(artworks, many=True, context={'request': request}).data,
            'artists': UserSerializer(artists, many=True, context={'request': request}).data,
            'categories': CategorySerializer(categories, many=True).data,
        })
