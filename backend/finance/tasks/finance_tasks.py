import logging
from celery import shared_task
from django.utils import timezone
from django.db import transaction
from django.db.models import Sum

from reservations.models.resource_models import ResourceMap
from orders.models.order_models import Order
from finance.models.finance_models import ResourcePayout

logger = logging.getLogger(__name__)


@shared_task(name='finance.tasks.process_daily_payouts')
def process_daily_payouts():
    logger.info("Starting daily payout processing.")

    map_ids = ResourceMap.objects.filter(
        purchase_deadline__lt=timezone.now(),
        payout_status='PENDING'
    ).values_list('id', flat=True)

    logger.info(f"Found {len(map_ids)} maps ready for payout dispatch.")

    for map_id in map_ids:
        process_single_payout.delay(map_id)

    logger.info("Finished dispatching payout tasks.")


@shared_task
def process_single_payout(map_id):
    logger.info(f"Processing payout for ResourceMap ID: {map_id}")

    try:
        with transaction.atomic():
            locked_map = ResourceMap.objects.select_for_update().get(id=map_id)

            if locked_map.payout_status != 'PENDING':
                logger.warning(f"Map {map_id} already processed or in progress.")
                return

            locked_map.payout_status = 'PROCESSING'
            locked_map.save(update_fields=['payout_status'])

            total_amount = Order.objects.filter(
                items__resource_unit__resource_map=locked_map,
                status='PAID'
            ).distinct().aggregate(
                total=Sum('total_price')
            )['total'] or 0.00

            bank_acc = getattr(
                getattr(locked_map.owner, "payout_account", None),
                "bank_account_number",
                None
            )

            if not bank_acc:
                logger.warning(
                    f"Skipping payout for ResourceMap {map_id} - no payout account."
                )

                locked_map.payout_status = 'PENDING'
                locked_map.save(update_fields=['payout_status'])
                return

            ResourcePayout.objects.create(
                resource=locked_map,
                amount=total_amount,
                account_number=bank_acc
            )

            locked_map.payout_status = 'PAID'
            locked_map.save(update_fields=['payout_status'])

            logger.info(
                f"Payout SUCCESS for map {map_id}, amount={total_amount}"
            )

    except Exception as e:
        logger.error(f"Error processing payout for map {map_id}: {str(e)}")
        try:
            locked_map.payout_status = 'PENDING'
            locked_map.save(update_fields=['payout_status'])
        except Exception:
            pass