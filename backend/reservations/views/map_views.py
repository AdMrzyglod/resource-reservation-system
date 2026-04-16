import logging
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.exceptions import PermissionDenied
from django.http import HttpResponse
from django.utils import timezone
from django.db.models import Q
from django.shortcuts import get_object_or_404

from core.pagination import StandardResultsSetPagination, LargeResultsSetPagination
from reservations.models.resource_models import ResourceMap, Category, ResourceImage, ResourceUnit
from reservations.serializers.resource_serializers import (
    CategorySerializer, ResourceMapListSerializer, ResourceMapCreateSerializer,
    ResourceMapDetailSerializer, ResourceMapUpdateSerializer, CreatorMapUnitSerializer
)

logger = logging.getLogger(__name__)


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


class ResourceMapListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticatedOrReadOnly]
    parser_classes = [MultiPartParser, FormParser]
    pagination_class = StandardResultsSetPagination

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ResourceMapCreateSerializer
        return ResourceMapListSerializer

    def create(self, request, *args, **kwargs):
        profile = getattr(request.user, 'profile', None)
        if not profile or not profile.is_complete():
            logger.warning(f"User {request.user.id} attempted to create a map without a complete profile.")
            return Response(
                {'error': 'PROFILE_INCOMPLETE', 'message': 'Complete your profile and add a payout account.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().create(request, *args, **kwargs)

    def get_queryset(self):
        now = timezone.now()
        queryset = ResourceMap.objects.filter(
            event_end_date__gt=now
        ).filter(
            Q(purchase_deadline__isnull=True) | Q(purchase_deadline__gt=now)
        )

        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(title__icontains=search)

        categories = self.request.query_params.getlist('categories')
        if categories and categories[0]:
            cat_list = categories[0].split(',') if ',' in categories[0] else categories
            queryset = queryset.filter(category_id__in=cat_list)

        sort_by = self.request.query_params.get('sort_by', '-created_at')
        if sort_by in ['price', '-price', 'title', '-title', 'created_at', '-created_at']:
            queryset = queryset.order_by(sort_by)

        return queryset


class ResourceMapImageView(generics.RetrieveAPIView):
    queryset = ResourceMap.objects.all()
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request, *args, **kwargs):
        try:
            return HttpResponse(self.get_object().image_data.blob, content_type="image/jpeg")
        except ResourceImage.DoesNotExist:
            logger.error(f"Image not found for ResourceMap ID {self.kwargs.get('pk')}")
            return HttpResponse(status=404)


class ResourceMapDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ResourceMap.objects.all()
    permission_classes = [IsAuthenticatedOrReadOnly]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return ResourceMapUpdateSerializer
        return ResourceMapDetailSerializer

    def get_object(self):
        obj = get_object_or_404(self.get_queryset(), pk=self.kwargs.get('pk'))

        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            if not self.request.user.is_authenticated:
                raise PermissionDenied("Log in to edit.")
            if obj.owner_id != self.request.user.id:
                logger.warning(f"User {self.request.user.id} unauthorized edit attempt on map {obj.id}")
                raise PermissionDenied("Not owner.")

        return obj


class MyCreatedMapsView(generics.ListAPIView):
    serializer_class = ResourceMapListSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = ResourceMap.objects.filter(owner=self.request.user)

        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(title__icontains=search)

        categories = self.request.query_params.getlist('categories')
        if categories and categories[0]:
            cat_list = categories[0].split(',') if ',' in categories[0] else categories
            queryset = queryset.filter(category_id__in=cat_list)

        sort_by = self.request.query_params.get('sort_by', '-created_at')
        if sort_by in ['price', '-price', 'title', '-title', 'created_at', '-created_at']:
            queryset = queryset.order_by(sort_by)

        return queryset


class CreatorMapUnitsView(generics.ListAPIView):
    serializer_class = CreatorMapUnitSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = LargeResultsSetPagination

    def get_queryset(self):
        map_id = self.kwargs['map_id']
        resource_map = get_object_or_404(ResourceMap, id=map_id)

        if resource_map.owner_id != self.request.user.id:
            logger.warning(f"User {self.request.user.id} unauthorized access attempt to units of map {map_id}")
            raise PermissionDenied("Not the owner.")

        return ResourceUnit.objects.filter(resource_map=resource_map).order_by('id')