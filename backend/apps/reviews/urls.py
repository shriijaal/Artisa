from django.urls import path

from apps.reviews.views import (
    ArtworkRatingView,
    ArtistRatingView,
    ReviewDetailView,
    ReviewListCreateView,
)

urlpatterns = [
    path('', ReviewListCreateView.as_view(), name='reviews'),
    path('<uuid:pk>/', ReviewDetailView.as_view(), name='review_detail'),
    path('artwork/<uuid:artwork_id>/avg/', ArtworkRatingView.as_view(), name='artwork_rating'),
    path('artist/<uuid:user_id>/avg/', ArtistRatingView.as_view(), name='artist_rating'),
]
