from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, UserProfile, Address


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ['email', 'username', 'role', 'is_staff', 'is_active']
    list_filter = ['role', 'is_staff', 'is_active']
    search_fields = ['email', 'username']

    fieldsets = UserAdmin.fieldsets + (
        ('Fields', {'fields': ('role',)}),
    )


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'account_type', 'first_name', 'last_name', 'company_name', 'tax_id']
    list_filter = ['account_type']
    search_fields = ['user__email', 'user__username', 'first_name', 'last_name', 'company_name', 'tax_id']
    autocomplete_fields = ['user']


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ['id', 'profile', 'city', 'street', 'postal_code', 'country']
    list_filter = ['country', 'city']
    search_fields = ['profile__user__email', 'city', 'street', 'postal_code']
    autocomplete_fields = ['profile']