from django.urls import path
from orders.views import order_views

urlpatterns = [
    path('', order_views.CreateOrderView.as_view(), name='create-order'),
    path('me/', order_views.MyOrdersView.as_view(), name='my-orders'),
    path('grouped/', order_views.MyGroupedOrdersView.as_view(), name='my-grouped-orders'),
    path('<int:pk>/', order_views.OrderDetailAPIView.as_view(), name='order-detail'),
    path('<int:pk>/cancel/', order_views.CancelOrderView.as_view(), name='cancel-order'),
    path('creator/maps/<int:map_id>/', order_views.CreatorMapOrdersView.as_view(), name='creator-map-orders'),
]