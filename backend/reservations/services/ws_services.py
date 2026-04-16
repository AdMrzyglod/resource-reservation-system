from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import logging

logger = logging.getLogger(__name__)

def send_ws_update(map_id, unit_ids, new_status):
    def _send():
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"map_{map_id}",
            {
                "type": "map_update",
                "updates": [
                    {"id": uid, "status": "RESERVED" if new_status == 'PENDING' else new_status}
                    for uid in unit_ids
                ]
            }
        )
        logger.info(f"Sent WebSocket update for map {map_id}. Units: {unit_ids}, Status: {new_status}")
    return _send