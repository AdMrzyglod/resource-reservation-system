from django.contrib import admin
from .models.order_models import Order, OrderItem, MapPenalty

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    can_delete = False
    extra = 0
    readonly_fields = ('resource_unit', 'price_at_purchase')

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'status', 'total_price', 'created_at', 'expires_at')
    list_filter = ('status', 'created_at')
    search_fields = ('user__email', 'id')
    inlines = [OrderItemInline]

@admin.register(MapPenalty)
class MapPenaltyAdmin(admin.ModelAdmin):
    list_display = ('user', 'resource_map', 'penalty_until')
    search_fields = ('user__email', 'resource_map__title')