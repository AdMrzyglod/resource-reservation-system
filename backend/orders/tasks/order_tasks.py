import logging
from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from django.db import transaction
from core.constants import PENALTY_DURATION_MINUTES
from orders.models.order_models import Order, MapPenalty
from reservations.models.resource_models import ResourceUnit
from reservations.services.ws_services import send_ws_update

logger = logging.getLogger(__name__)

def process_order_expiration(order):
    units = ResourceUnit.objects.filter(active_order=order)
    unit_ids = list(units.values_list('id', flat=True))
    map_id = units.first().resource_map_id if units.exists() else None

    order.status = 'EXPIRED'
    order.save(update_fields=['status'])
    units.update(status='AVAILABLE', active_order=None)

    logger.info(f"[CELERY] Order #{order.id} EXPIRED. Released {len(unit_ids)} units.")

    if map_id:
        MapPenalty.objects.update_or_create(
            user=order.user,
            resource_map_id=map_id,
            defaults={'penalty_until': timezone.now() + timedelta(minutes=PENALTY_DURATION_MINUTES)}
        )
        send_ws_update(map_id, unit_ids, 'AVAILABLE')()

@shared_task
def expire_order_task(order_id):
    try:
        with transaction.atomic():
            order = Order.objects.select_for_update().get(id=order_id, status='PENDING')
            process_order_expiration(order)
    except Order.DoesNotExist:
        logger.info(f"[CELERY] Order #{order_id} not found or no longer PENDING during expiration check.")

@shared_task(name='orders.tasks.cleanup_expired_orders')
def cleanup_expired_orders():
    now = timezone.now()
    expired_order_ids = Order.objects.filter(
        status='PENDING',
        expires_at__lte=now
    ).values_list('id', flat=True)

    for order_id in expired_order_ids:
        expire_order_task.delay(order_id)