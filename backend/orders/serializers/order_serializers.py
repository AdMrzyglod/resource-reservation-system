from rest_framework import serializers
from orders.models.order_models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['resource_unit_id', 'price_at_purchase']


class OrderItemDetailSerializer(serializers.ModelSerializer):
    resource_unit_id = serializers.IntegerField(source='resource_unit.id', read_only=True)

    class Meta:
        model = OrderItem
        fields = ['resource_unit_id', 'price_at_purchase']


class OrderHistorySerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'status', 'total_price', 'created_at', 'expires_at', 'items']


class MyOrderListSerializer(serializers.ModelSerializer):
    items = OrderItemDetailSerializer(many=True, read_only=True)
    map_id = serializers.SerializerMethodField()
    map_title = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = ['id', 'status', 'total_price', 'created_at', 'expires_at', 'items', 'map_id', 'map_title',
                  'user_snapshot']

    def get_map_id(self, obj):
        first_item = obj.items.first()
        return first_item.resource_unit.resource_map.id if first_item else None

    def get_map_title(self, obj):
        first_item = obj.items.first()
        return first_item.resource_unit.resource_map.title if first_item else None


class CreatorOrderSerializer(serializers.ModelSerializer):
    items = OrderItemDetailSerializer(many=True, read_only=True)
    buyer_name = serializers.SerializerMethodField()
    buyer_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'status', 'total_price', 'created_at', 'items', 'buyer_name', 'buyer_email']

    def get_buyer_name(self, obj):
        if obj.user_snapshot and 'first_name' in obj.user_snapshot:
            return f"{obj.user_snapshot.get('first_name', '')} {obj.user_snapshot.get('last_name', '')}".strip()
        profile = getattr(obj.user, 'profile', None)
        if profile and profile.first_name:
            return f"{profile.first_name} {profile.last_name}"
        return obj.user.username


class OrderDetailFullSerializer(serializers.ModelSerializer):
    items = OrderItemDetailSerializer(many=True, read_only=True)
    map_details = serializers.SerializerMethodField()
    buyer_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'status', 'total_price', 'created_at', 'expires_at', 'items', 'map_details', 'user_snapshot',
                  'buyer_email']

    def get_map_details(self, obj):
        first_item = obj.items.first()
        if not first_item: return None
        rmap = first_item.resource_unit.resource_map

        from reservations.serializers.resource_serializers import ResourceUnitSerializer
        return {
            'id': rmap.id,
            'title': rmap.title,
            'image_url': f"/api/reservations/maps/{rmap.id}/image/",
            'dot_size': rmap.dot_size,
            'all_units': ResourceUnitSerializer(rmap.units.all(), many=True).data
        }