from django.db import models
from django.conf import settings

class Payment(models.Model):
    STATUS_CHOICES = (
        ('PROCESSING', 'Processing'),
        ('SUCCESS', 'Success'),
        ('FAILED', 'Failed'),
    )
    order = models.OneToOneField('orders.Order', on_delete=models.CASCADE, related_name='payment')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PROCESSING')
    transaction_id = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class PayoutAccount(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payout_account')
    bank_account_number = models.CharField(max_length=40)

class ResourcePayout(models.Model):
    resource = models.OneToOneField('reservations.ResourceMap', on_delete=models.CASCADE, related_name='payout')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    account_number = models.CharField(max_length=45, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Payout for {self.resource.title} - ${self.amount}"