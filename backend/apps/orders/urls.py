from django.urls import path
from apps.orders import views

urlpatterns = [
    # Cart routes
    path('cart/', views.cart, name='cart'),
    path('cart/<uuid:item_id>/', views.cart_item_detail, name='cart_item_detail'),
    path('cart/clear/', views.clear_cart, name='clear_cart'),
    
    # Shipping address routes
    path('shipping-addresses/', views.shipping_addresses, name='shipping_addresses'),
    path('shipping-addresses/<uuid:address_id>/', views.shipping_address_detail, name='shipping_address_detail'),
    
    # Order routes
    path('', views.orders, name='orders'),
    path('<uuid:order_id>/', views.order_detail, name='order_detail'),
    path('<uuid:order_id>/pay/', views.mock_pay_order, name='mock_pay_order'),
    
    # Artist order routes
    path('artist/items/', views.artist_orders, name='artist_orders'),
    path('shipments/<uuid:shipment_id>/', views.update_shipment, name='update_shipment'),
    path('artist/earnings/', views.artist_earnings, name='artist_earnings'),
    
    # Secure digital download routes
    path('<uuid:order_id>/download-token/<uuid:item_id>/', views.generate_download_token, name='generate_download_token'),
    path('<uuid:order_id>/download/<uuid:item_id>/', views.download_digital_file_signed, name='download_digital_file_signed'),
]
