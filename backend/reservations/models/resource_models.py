from django.db import models
from django.conf import settings

class Category(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name

class ResourceMap(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    dot_size = models.IntegerField(default=12)
    purchase_deadline = models.DateTimeField(null=True, blank=True)
    event_start_date = models.DateTimeField()
    event_end_date = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    creator_snapshot = models.JSONField(default=dict, blank=True)

    payout_status = models.CharField(
        max_length=20,
        choices=[('PENDING', 'Pending'), ('PAID', 'Paid')],
        default='PENDING'
    )

    def __str__(self):
        return self.title

class ResourceAddress(models.Model):
    resource_map = models.OneToOneField(ResourceMap, on_delete=models.CASCADE, related_name='address_reverse')
    country = models.CharField(max_length=100, default='Poland')
    city = models.CharField(max_length=100)
    street = models.CharField(max_length=255)
    postal_code = models.CharField(max_length=20)

class ResourceImage(models.Model):
    resource_map = models.OneToOneField(ResourceMap, on_delete=models.CASCADE, related_name='image_data')
    blob = models.BinaryField()

class ResourceUnit(models.Model):
    resource_map = models.ForeignKey(ResourceMap, on_delete=models.CASCADE, related_name='units')
    x_position = models.FloatField()
    y_position = models.FloatField()
    status = models.CharField(max_length=20, default='AVAILABLE')
    active_order = models.ForeignKey('orders.Order', on_delete=models.SET_NULL, null=True, blank=True)