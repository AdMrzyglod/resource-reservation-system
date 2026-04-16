import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer

logger = logging.getLogger(__name__)


class MapConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.map_id = self.scope['url_route']['kwargs']['map_id']
        self.room_group_name = f'map_{self.map_id}'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()
        logger.info(f"WebSocket connected to {self.room_group_name}")

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        logger.info(f"WebSocket disconnected from {self.room_group_name}")

    async def receive(self, text_data):
        pass

    async def map_update(self, event):
        updates = event['updates']

        await self.send(text_data=json.dumps({
            'type': 'map_update',
            'updates': updates
        }))