from django.contrib import admin
from .models.finance_models import Payment, PayoutAccount, ResourcePayout

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('id', 'order', 'status', 'transaction_id', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('transaction_id', 'order__id')

@admin.register(PayoutAccount)
class PayoutAccountAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'bank_account_number')
    search_fields = ('user__email', 'bank_account_number')

@admin.register(ResourcePayout)
class ResourcePayoutAdmin(admin.ModelAdmin):
    list_display = ('id', 'resource', 'amount', 'account_number', 'created_at')
    search_fields = ('resource__title', 'account_number')