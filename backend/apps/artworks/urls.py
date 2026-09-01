from django.urls import path

from apps.artworks.views import (
    add_artwork_image,
    add_digital_file,
    artwork_detail,
    artwork_detail_public,
    cancel_submission,
    category_list,
    delete_artwork_image,
    my_artworks,
    published_artworks,
    set_primary_image,
    submit_artwork,
    download_digital_file,
)

urlpatterns = [
    path('categories/', category_list, name='category_list'),
    path('published/', published_artworks, name='published_artworks'),
    path('published/<uuid:artwork_id>/', artwork_detail_public, name='artwork_detail_public'),
    path('<uuid:artwork_id>/', artwork_detail, name='artwork-detail'),
    path('<uuid:artwork_id>/download/', download_digital_file, name='download_digital_file_public'),
    path('<uuid:artwork_id>/submit/', submit_artwork, name='submit-artwork'),
    path('my-artworks/', my_artworks, name='my_artworks'),
    path('my-artworks/<uuid:artwork_id>/', artwork_detail, name='artwork_detail'),
    path('my-artworks/<uuid:artwork_id>/submit/', submit_artwork, name='submit_artwork'),
    path('my-artworks/<uuid:artwork_id>/cancel/', cancel_submission, name='cancel_submission'),
    path('my-artworks/<uuid:artwork_id>/images/', add_artwork_image, name='add_artwork_image'),
    path('my-artworks/<uuid:artwork_id>/images/<uuid:image_id>/', delete_artwork_image, name='delete_artwork_image'),
    path('my-artworks/<uuid:artwork_id>/images/<uuid:image_id>/set-primary/', set_primary_image, name='set_primary_image'),
    path('my-artworks/<uuid:artwork_id>/digital-file/', add_digital_file, name='add_digital_file'),
    path('my-artworks/<uuid:artwork_id>/digital-file/download/', download_digital_file, name='download_digital_file'),
]
