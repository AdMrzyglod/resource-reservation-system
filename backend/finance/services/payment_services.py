import random
import logging
from django.utils import timezone
from datetime import timedelta
from django.db import transaction
from django.shortcuts import get_object_or_404

from core.constants import PENALTY_DURATION_MINUTES
from orders.models.order_models import Order, MapPenalty
from reservations.models.resource_models import ResourceUnit
from reservations.services.ws_services import send_ws_update

logger = logging.getLogger(__name__)


def process_fake_payment_service(user, order_id):
    profile = getattr(user, 'profile', None)
    if not profile or not profile.is_complete():
        logger.warning(f"User {user.id} attempted payment without a complete profile.")
        return 400, {'error': 'PROFILE_INCOMPLETE', 'message': 'Complete profile before paying.'}

    snapshot = {
        'account_type': profile.account_type,
        'first_name': getattr(profile, 'first_name', ''),
        'last_name': getattr(profile, 'last_name', ''),
        'company_name': getattr(profile, 'company_name', ''),
        'tax_id': getattr(profile, 'tax_id', ''),
    }

    if hasattr(profile, 'address') and profile.address:
        snapshot['address'] = {
            'street': profile.address.street, 'city': profile.address.city,
            'postal_code': profile.address.postal_code, 'country': profile.address.country,
        }

    success = random.random() < 0.9

    with transaction.atomic():
        order = get_object_or_404(Order.objects.select_for_update(), id=order_id, user=user, status='PENDING')
        units = ResourceUnit.objects.filter(active_order=order)
        unit_ids = list(units.values_list('id', flat=True))
        map_id = units.first().resource_map_id if units.exists() else None

        order.user_snapshot = snapshot

        if success:
            order.status = 'PAID'
            order.save(update_fields=['status', 'user_snapshot'])
            units.update(status='PURCHASED')

            if map_id:
                transaction.on_commit(send_ws_update(map_id, unit_ids, 'PURCHASED'))

            logger.info(f"Payment successful for order #{order_id} by user {user.id}.")
            return 200, {'status': 'PAID'}
        else:
            order.status = 'FAILED'
            order.save(update_fields=['status', 'user_snapshot'])
            units.update(status='AVAILABLE', active_order=None)

            if map_id:
                MapPenalty.objects.update_or_create(
                    user=order.user, resource_map_id=map_id,
                    defaults={'penalty_until': timezone.now() + timedelta(minutes=PENALTY_DURATION_MINUTES)}
                )
                transaction.on_commit(send_ws_update(map_id, unit_ids, 'AVAILABLE'))

            logger.warning(f"Payment failed for order #{order_id} by user {user.id}.")
            return 400, {'error': 'Payment failed. You are blocked from this map for a few minutes.'}