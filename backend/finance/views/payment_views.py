import logging
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from core.pagination import StandardResultsSetPagination
from finance.models.finance_models import ResourcePayout
from finance.serializers.finance_serializers import ResourcePayoutSerializer
from finance.services.payment_services import process_fake_payment_service

logger = logging.getLogger(__name__)

class FakePaymentView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id):
        status_code, response_data = process_fake_payment_service(request.user, order_id)
        return Response(response_data, status=status_code)

class CreatorPayoutListView(generics.ListAPIView):
    serializer_class = ResourcePayoutSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        return ResourcePayout.objects.filter(resource__owner=self.request.user).order_by('-created_at')