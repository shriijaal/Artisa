from django.urls import path
from . import views

urlpatterns = [
    path('stats/', views.admin_stats, name='admin_stats'),
    path('applications/', views.admin_applications_list, name='admin_applications_list'),
    path('applications/<uuid:application_id>/', views.admin_application_action, name='admin_application_action'),
    path('artworks/', views.admin_artworks_list, name='admin_artworks_list'),
    path('artworks/<uuid:artwork_id>/publish/', views.admin_artwork_publish, name='admin_artwork_publish'),
    path('artworks/<uuid:artwork_id>/reject/', views.admin_artwork_reject, name='admin_artwork_reject'),
    path('artworks/<uuid:artwork_id>/remove/', views.admin_artwork_remove, name='admin_artwork_remove'),
    path('artworks/<uuid:artwork_id>/restore/', views.admin_artwork_restore, name='admin_artwork_restore'),
    path('categories/', views.admin_categories_list, name='admin_categories_list'),
    path('categories/<uuid:category_id>/', views.admin_category_detail, name='admin_category_detail'),
    path('users/', views.admin_users_list, name='admin_users_list'),
    path('users/<uuid:user_id>/deactivate/', views.admin_user_deactivate, name='admin_user_deactivate'),
    path('orders/', views.admin_orders_list, name='admin_orders_list'),
]
