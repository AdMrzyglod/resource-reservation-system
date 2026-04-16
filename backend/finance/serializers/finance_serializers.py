from rest_framework import serializers
from finance.models.finance_models import ResourcePayout

class ResourcePayoutSerializer(serializers.ModelSerializer):
    resource_title = serializers.CharField(source='resource.title', read_only=True)
    resource_id = serializers.IntegerField(source='resource.id', read_only=True)

    class Meta:
        model = ResourcePayout
        fields = ['id', 'resource_id', 'resource_title', 'amount', 'created_at', 'account_number']