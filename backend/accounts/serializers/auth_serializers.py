from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from accounts.models.user_models import UserProfile, Address
from finance.models import PayoutAccount

User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['user_id'] = int(user.id)
        token['username'] = user.username
        token['email'] = user.email
        token['role'] = user.role
        return token


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'password')

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            username=validated_data['username'],
            password=validated_data['password']
        )
        return user


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ('street', 'city', 'postal_code', 'country')


class UserProfileSerializer(serializers.ModelSerializer):
    address = AddressSerializer(required=False)
    is_complete = serializers.BooleanField(read_only=True)
    bank_account_number = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = UserProfile
        fields = ('account_type', 'first_name', 'last_name', 'company_name', 'tax_id', 'address', 'is_complete', 'bank_account_number')

    def validate_bank_account_number(self, value):
        if not value:
            return value

        cleaned_value = value.replace(" ", "")

        if len(cleaned_value) == 28 and cleaned_value[:2].isalpha() and cleaned_value[2:].isdigit():
            return cleaned_value.upper()

        raise serializers.ValidationError(
            "The bank account number must start with exactly 2 letters followed by exactly 26 digits."
        )

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if hasattr(instance.user, 'payout_account'):
            data['bank_account_number'] = instance.user.payout_account.bank_account_number
        else:
            data['bank_account_number'] = ''
        return data

    def update(self, instance, validated_data):
        address_data = validated_data.pop('address', None)
        bank_account_number = validated_data.pop('bank_account_number', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if address_data is not None:
            address, _ = Address.objects.get_or_create(profile=instance)
            for attr, value in address_data.items():
                setattr(address, attr, value)
            address.save()

        if bank_account_number is not None:
            PayoutAccount.objects.update_or_create(
                user=instance.user,
                defaults={'bank_account_number': bank_account_number}
            )

        return instance