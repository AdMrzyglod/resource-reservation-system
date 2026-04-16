import json
from rest_framework import serializers
from django.apps import apps
from reservations.models.resource_models import ResourceMap, ResourceUnit, Category, ResourceAddress
from reservations.services.resource_services import create_resource_map_service, update_resource_map_service
from core.constants import MAX_UNITS_PER_MAP, MAX_UNITS_PER_ORDER

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']

class ResourceAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResourceAddress
        fields = ['country', 'city', 'street', 'postal_code']

class ResourceUnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResourceUnit
        fields = ['id', 'x_position', 'y_position', 'status']

class GroupedMapSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ResourceMap
        fields = ['id', 'title', 'image_url']

    def get_image_url(self, obj):
        return f"/api/reservations/maps/{obj.id}/image/"

class ResourceMapListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ResourceMap
        fields = ['id', 'title', 'category_name', 'price', 'created_at', 'image_url', 'purchase_deadline']

    def get_image_url(self, obj):
        return f"/api/reservations/maps/{obj.id}/image/"

class ResourceMapCreateSerializer(serializers.ModelSerializer):
    units_data = serializers.CharField(write_only=True)
    image_file = serializers.ImageField(write_only=True)
    address_data = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = ResourceMap
        fields = ['title', 'description', 'category', 'price', 'purchase_deadline',
                  'event_start_date', 'event_end_date', 'dot_size', 'image_file', 'units_data', 'address_data']

    def create(self, validated_data):
        return create_resource_map_service(
            user=self.context['request'].user,
            validated_data=validated_data,
            units_json=validated_data.pop('units_data'),
            image_file=validated_data.pop('image_file'),
            address_json=validated_data.pop('address_data', None)
        )

class ResourceMapUpdateSerializer(serializers.ModelSerializer):
    new_units_data = serializers.CharField(write_only=True, required=False, allow_blank=True)
    image_file = serializers.ImageField(write_only=True, required=False)
    address_data = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = ResourceMap
        fields = ['title', 'description', 'category', 'price', 'purchase_deadline', 'event_start_date',
                  'event_end_date', 'dot_size', 'new_units_data', 'image_file', 'address_data']

    def update(self, instance, validated_data):
        return update_resource_map_service(
            instance=instance,
            validated_data=validated_data,
            new_units_json=validated_data.pop('new_units_data', None),
            image_file=validated_data.pop('image_file', None),
            address_json=validated_data.pop('address_data', None)
        )

class CreatorMapUnitSerializer(serializers.ModelSerializer):
    buyer_name = serializers.SerializerMethodField()
    buyer_email = serializers.SerializerMethodField()
    order_id = serializers.SerializerMethodField()

    class Meta:
        model = ResourceUnit
        fields = ['id', 'status', 'buyer_name', 'buyer_email', 'order_id']

    def get_buyer_name(self, obj):
        if obj.active_order:
            if obj.active_order.user_snapshot and 'first_name' in obj.active_order.user_snapshot:
                return f"{obj.active_order.user_snapshot.get('first_name', '')} {obj.active_order.user_snapshot.get('last_name', '')}".strip()
            profile = getattr(obj.active_order.user, 'profile', None)
            if profile and profile.first_name:
                return f"{profile.first_name} {profile.last_name}"
            return obj.active_order.user.username
        return "-"

    def get_buyer_email(self, obj):
        if obj.active_order:
            return obj.active_order.user.email
        return "-"

    def get_order_id(self, obj):
        if obj.active_order:
            return obj.active_order.id
        return None

class ResourceMapDetailSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    image_url = serializers.SerializerMethodField()
    units = ResourceUnitSerializer(many=True, read_only=True)
    stats = serializers.SerializerMethodField()
    my_orders = serializers.SerializerMethodField()
    owner_id = serializers.IntegerField(source='owner.id', read_only=True)
    address = ResourceAddressSerializer(source='address_reverse', read_only=True)
    payout = serializers.SerializerMethodField()
    max_units_per_order = serializers.SerializerMethodField()

    class Meta:
        model = ResourceMap
        fields = ['id', 'title', 'description', 'category_name', 'price', 'purchase_deadline',
                  'event_start_date', 'event_end_date', 'dot_size', 'image_url', 'units',
                  'stats', 'my_orders', 'owner_id', 'creator_snapshot', 'address', 'payout_status',
                  'payout', 'max_units_per_order']

    def get_max_units_per_order(self, obj):
        return MAX_UNITS_PER_ORDER

    def get_image_url(self, obj):
        return f"/api/reservations/maps/{obj.id}/image/"

    def get_stats(self, obj):
        Order = apps.get_model('orders', 'Order')
        paid_orders = Order.objects.filter(items__resource_unit__resource_map=obj, status='PAID').distinct()
        revenue = sum(o.total_price for o in paid_orders)

        return {
            'total': obj.units.count(),
            'available': obj.units.filter(status='AVAILABLE').count(),
            'reserved': obj.units.filter(status='RESERVED').count(),
            'purchased': obj.units.filter(status='PURCHASED').count(),
            'revenue': float(revenue) if revenue else 0.0
        }

    def get_my_orders(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            Order = apps.get_model('orders', 'Order')
            from orders.serializers.order_serializers import OrderHistorySerializer
            orders = Order.objects.filter(user=request.user, items__resource_unit__resource_map=obj).distinct().order_by('-created_at')
            return OrderHistorySerializer(orders, many=True).data
        return []

    def get_payout(self, obj):
        if hasattr(obj, 'payout'):
            from finance.serializers.finance_serializers import ResourcePayoutSerializer
            return ResourcePayoutSerializer(obj.payout).data
        return None