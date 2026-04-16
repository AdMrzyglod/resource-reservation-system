from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/maps/(?P<map_id>\d+)/$', consumers.MapConsumer.as_asgi()),
]