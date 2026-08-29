from django.urls import path
from apps.payments.views import KhaltiInitiateView, KhaltiVerifyView

urlpatterns = [
    path('khalti/initiate/', KhaltiInitiateView.as_view(), name='khalti-initiate'),
    path('khalti/verify/', KhaltiVerifyView.as_view(), name='khalti-verify'),
]
