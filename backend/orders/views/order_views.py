import logging
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from django.db.models import Q
from django.shortcuts import get_object_or_404

from core.pagination import StandardResultsSetPagination
from orders.models.order_models import Order
from reservations.models.resource_models import ResourceMap
from reservations.serializers.resource_serializers import GroupedMapSerializer
from orders.serializers.order_serializers import (
    MyOrderListSerializer, OrderDetailFullSerializer, CreatorOrderSerializer
)
from orders.services.order_services import create_order_service, cancel_order_service

logger = logging.getLogger(__name__)


class CreateOrderView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        map_id = request.data.get('map_id')
        unit_ids = request.data.get('unit_ids', [])
        status_code, response_data = create_order_service(request.user, map_id, unit_ids)
        return Response(response_data, status=status_code)


class CancelOrderView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        status_code, response_data = cancel_order_service(request.user, pk)
        return Response(response_data, status=status_code)


class MyOrdersView(generics.ListAPIView):
    serializer_class = MyOrderListSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = Order.objects.filter(user=self.request.user)
        map_id = self.request.query_params.get('map_id')
        if map_id:
            queryset = queryset.filter(items__resource_unit__resource_map_id=map_id).distinct()

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(id__icontains=search) | Q(items__resource_unit__resource_map__title__icontains=search)
            ).distinct()

        statuses = self.request.query_params.get('statuses')
        if statuses:
            queryset = queryset.filter(status__in=statuses.split(','))

        sort_by = self.request.query_params.get('sort_by', '-created_at')
        if sort_by in ['created_at', '-created_at', 'total_price', '-total_price']:
            queryset = queryset.order_by(sort_by)
        else:
            queryset = queryset.order_by('-created_at')
        return queryset


class MyGroupedOrdersView(generics.ListAPIView):
    serializer_class = GroupedMapSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = ResourceMap.objects.filter(units__orderitem__order__user=self.request.user).distinct()
        search = self.request.query_params.get('search')
        if search: queryset = queryset.filter(title__icontains=search)

        sort_by = self.request.query_params.get('sort_by', 'title')
        if sort_by in ['title', '-title']:
            queryset = queryset.order_by(sort_by)

        return queryset


class OrderDetailAPIView(generics.RetrieveAPIView):
    serializer_class = OrderDetailFullSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        order = get_object_or_404(Order, id=self.kwargs['pk'])
        map_owner_id = None
        first_item = order.items.first()

        if first_item:
            map_owner_id = first_item.resource_unit.resource_map.owner_id

        if order.user != self.request.user and self.request.user.id != map_owner_id:
            logger.warning(f"User {self.request.user.id} unauthorized access attempt to order {order.id}")
            raise PermissionDenied("You do not have permission to view this order.")

        return order


class CreatorMapOrdersView(generics.ListAPIView):
    serializer_class = CreatorOrderSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        resource_map = get_object_or_404(ResourceMap, id=self.kwargs['map_id'])
        if resource_map.owner_id != self.request.user.id:
            raise PermissionDenied("Not the owner.")

        queryset = Order.objects.filter(items__resource_unit__resource_map=resource_map).distinct()
        statuses = self.request.query_params.get('statuses')
        if statuses:
            queryset = queryset.filter(status__in=statuses.split(','))

        sort_by = self.request.query_params.get('sort_by', '-created_at')
        if sort_by in ['created_at', '-created_at', 'total_price', '-total_price']:
            queryset = queryset.order_by(sort_by)
        else:
            queryset = queryset.order_by('-created_at')

        return queryset