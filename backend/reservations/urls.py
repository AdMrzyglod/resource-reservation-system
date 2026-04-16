from django.urls import path
from reservations.views import map_views

urlpatterns = [
    path('categories/', map_views.CategoryListView.as_view(), name='category-list'),
    path('maps/', map_views.ResourceMapListCreateView.as_view(), name='map-list-create'),
    path('maps/<int:pk>/', map_views.ResourceMapDetailView.as_view(), name='map-detail'),
    path('maps/<int:pk>/image/', map_views.ResourceMapImageView.as_view(), name='map-image'),
    path('creator/maps/', map_views.MyCreatedMapsView.as_view(), name='creator-maps'),
    path('creator/maps/<int:map_id>/units/', map_views.CreatorMapUnitsView.as_view(), name='creator-map-units'),
]