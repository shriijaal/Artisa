from django.urls import path
from apps.recs.views import (
    HomepageView,
    InteractionCreateView,
    RecommendationArtworksView,
    RecommendationArtistsView,
    SimilarArtworksView,
    TrendingView,
    GlobalSearchView,
)

urlpatterns = [
    path('homepage/', HomepageView.as_view(), name='homepage'),
    path('interactions/', InteractionCreateView.as_view(), name='interaction-create'),
    path('artworks/', RecommendationArtworksView.as_view(), name='recommendation-artworks'),
    path('artists/', RecommendationArtistsView.as_view(), name='recommendation-artists'),
    path('similar/<uuid:artwork_id>/', SimilarArtworksView.as_view(), name='similar-artworks'),
    path('trending/', TrendingView.as_view(), name='trending'),
    path('search/', GlobalSearchView.as_view(), name='global-search'),
]
