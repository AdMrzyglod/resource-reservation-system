from django.urls import path
from finance.views import payment_views

urlpatterns = [
    path('orders/<int:order_id>/pay/', payment_views.FakePaymentView.as_view(), name='fake-payment'),
    path('creator/payouts/', payment_views.CreatorPayoutListView.as_view(), name='creator-payouts'),
]