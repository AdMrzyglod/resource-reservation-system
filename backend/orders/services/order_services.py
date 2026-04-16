import logging
from django.utils import timezone
from datetime import timedelta
from django.db import transaction
from django.shortcuts import get_object_or_404
from core.constants import MAX_UNITS_PER_ORDER, PENALTY_DURATION_MINUTES, ORDER_EXPIRATION_MINUTES
from orders.models.order_models import Order, OrderItem, MapPenalty
from reservations.models.resource_models import ResourceMap, ResourceUnit
from reservations.services.ws_services import send_ws_update

logger = logging.getLogger(__name__)


def create_order_service(user, map_id, unit_ids):
    profile = getattr(user, 'profile', None)
    if not profile or not profile.is_complete():
        logger.warning(f"User {user.id} tried to order without a complete profile.")
        return 400, {'error': 'PROFILE_INCOMPLETE', 'message': 'Complete profile and billing details before reserving.'}

    if not unit_ids or len(unit_ids) > MAX_UNITS_PER_ORDER:
        return 400, {'error': f'Max {MAX_UNITS_PER_ORDER} units allowed.'}

    resource_map = get_object_or_404(ResourceMap, id=map_id)
    if resource_map.owner_id == user.id:
        return 403, {'error': 'Cannot purchase your own resource.'}

    if Order.objects.filter(user=user, status='PENDING', items__resource_unit__resource_map=resource_map).exists():
        return 400, {'error': 'Active pending order already exists for this map.'}

    if resource_map.purchase_deadline and timezone.now() > resource_map.purchase_deadline:
        return 400, {'error': 'Purchase deadline has passed.'}

    penalty = MapPenalty.objects.filter(user=user, resource_map=resource_map).first()
    if penalty and penalty.penalty_until > timezone.now():
        logger.warning(f"User {user.id} is blocked from map {map_id} due to penalty.")
        return 403, {
            'error': 'ACCOUNT_BLOCKED',
            'blocked_until': penalty.penalty_until.isoformat()
        }

    with transaction.atomic():
        units = ResourceUnit.objects.select_for_update().filter(id__in=unit_ids, status='AVAILABLE',
                                                                resource_map=resource_map)
        if units.count() != len(unit_ids):
            logger.error(f"Concurrency issue: Not all units {unit_ids} were available for map {map_id}.")
            return 400, {'error': 'Requested units are no longer available.'}

        total_price = len(unit_ids) * resource_map.price
        expires_at = timezone.now() + timedelta(minutes=ORDER_EXPIRATION_MINUTES)
        order = Order.objects.create(user=user, status='PENDING', total_price=total_price, expires_at=expires_at)

        OrderItem.objects.bulk_create([
            OrderItem(order=order, resource_unit=unit, price_at_purchase=resource_map.price)
            for unit in units
        ])
        units.update(status='RESERVED', active_order=order)

        transaction.on_commit(send_ws_update(map_id, unit_ids, 'RESERVED'))

    logger.info(f"Order #{order.id} successfully created for user {user.id}.")

    from orders.tasks.order_tasks import expire_order_task
    expire_order_task.apply_async((order.id,), eta=expires_at)

    return 201, {'order_id': order.id, 'expires_at': expires_at}


def cancel_order_service(user, order_id):
    with transaction.atomic():
        order = get_object_or_404(Order.objects.select_for_update(), id=order_id, user=user, status='PENDING')
        units = ResourceUnit.objects.filter(active_order=order)
        unit_ids = list(units.values_list('id', flat=True))
        map_id = units.first().resource_map_id if units.exists() else None

        order.status = 'CANCELLED'
        order.save(update_fields=['status'])
        units.update(status='AVAILABLE', active_order=None)

        if map_id:
            MapPenalty.objects.update_or_create(
                user=order.user, resource_map_id=map_id,
                defaults={'penalty_until': timezone.now() + timedelta(minutes=PENALTY_DURATION_MINUTES)}
            )
            transaction.on_commit(send_ws_update(map_id, unit_ids, 'AVAILABLE'))

    logger.info(f"Order #{order_id} was successfully cancelled by user {user.id}.")
    return 200, {'status': 'CANCELLED'}