from django.urls import path
from apps.commissions import views

urlpatterns = [
    path('', views.CommissionCreateView.as_view(), name='commission_create'),
    path('mine/', views.MyCommissionsView.as_view(), name='my_commissions'),
    path('inbox/', views.CommissionInboxView.as_view(), name='commission_inbox'),
    path('upload-ref/', views.CommissionReferenceUploadView.as_view(), name='commission_upload_ref'),
    path('<uuid:commission_id>/', views.CommissionDetailView.as_view(), name='commission_detail'),
    path('<uuid:commission_id>/accept/', views.CommissionAcceptView.as_view(), name='commission_accept'),
    path('<uuid:commission_id>/start/', views.CommissionStartView.as_view(), name='commission_start'),
    path('<uuid:commission_id>/decline/', views.CommissionDeclineView.as_view(), name='commission_decline'),
    path('<uuid:commission_id>/deliver/', views.CommissionDeliverView.as_view(), name='commission_deliver'),
    path('<uuid:commission_id>/approve/', views.CommissionApproveView.as_view(), name='commission_approve'),
    path('<uuid:commission_id>/revision/', views.CommissionRevisionView.as_view(), name='commission_revision'),
    path('<uuid:commission_id>/cancel/', views.CommissionCancelView.as_view(), name='commission_cancel'),
]
