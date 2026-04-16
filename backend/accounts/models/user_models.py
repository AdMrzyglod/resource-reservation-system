from django.db import models
from django.contrib.auth.models import AbstractUser

class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('USER', 'User'),
        ('ADMIN', 'Admin'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='USER')
    email = models.EmailField(unique=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

class UserProfile(models.Model):
    ACCOUNT_TYPE_CHOICES = (
        ('individual', 'Individual'),
        ('company', 'Company'),
    )
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='profile')
    account_type = models.CharField(max_length=20, choices=ACCOUNT_TYPE_CHOICES, default='individual')

    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    company_name = models.CharField(max_length=200, blank=True)
    tax_id = models.CharField(max_length=50, blank=True)

    def is_complete(self):
        has_bank = hasattr(self.user, 'payout_account') and bool(self.user.payout_account.bank_account_number)

        if self.account_type == 'individual':
            has_base = bool(self.first_name and self.last_name)
        else:
            has_base = bool(self.company_name and self.tax_id)

        has_address = hasattr(self, 'address') and bool(
            self.address.street and self.address.city and self.address.postal_code and self.address.country
        )

        return has_base and has_address and has_bank

class Address(models.Model):
    profile = models.OneToOneField(UserProfile, on_delete=models.CASCADE, related_name='address')
    street = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    country = models.CharField(max_length=100, default='Poland')