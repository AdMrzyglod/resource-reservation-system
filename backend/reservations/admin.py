from django.contrib import admin
from .models import Category, ResourceMap, ResourceAddress, ResourceImage, ResourceUnit

class ResourceAddressInline(admin.StackedInline):
    model = ResourceAddress
    can_delete = False
    verbose_name_plural = 'Address'

class ResourceImageInline(admin.StackedInline):
    model = ResourceImage
    can_delete = False
    verbose_name_plural = 'Image'

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')

@admin.register(ResourceMap)
class ResourceMapAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'owner', 'category', 'price', 'event_start_date', 'payout_status')
    list_filter = ('category', 'payout_status')
    search_fields = ('title', 'owner__email')
    inlines = [ResourceAddressInline, ResourceImageInline]

@admin.register(ResourceUnit)
class ResourceUnitAdmin(admin.ModelAdmin):
    list_display = ('id', 'resource_map', 'status', 'x_position', 'y_position', 'active_order')
    list_filter = ('status',)