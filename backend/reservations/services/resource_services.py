import json
import logging
from django.db import transaction
from rest_framework.exceptions import ValidationError
from core.constants import MAX_UNITS_PER_MAP
from reservations.models.resource_models import ResourceMap, ResourceImage, ResourceAddress, ResourceUnit

logger = logging.getLogger(__name__)


def generate_creator_snapshot(user):
    snapshot = {}
    if hasattr(user, 'profile'):
        profile = user.profile
        snapshot = {
            'account_type': profile.account_type,
            'first_name': getattr(profile, 'first_name', ''),
            'last_name': getattr(profile, 'last_name', ''),
            'company_name': getattr(profile, 'company_name', ''),
            'tax_id': getattr(profile, 'tax_id', ''),
        }
        if hasattr(profile, 'address'):
            snapshot['address'] = {
                'street': getattr(profile.address, 'street', ''),
                'city': getattr(profile.address, 'city', ''),
                'postal_code': getattr(profile.address, 'postal_code', ''),
                'country': getattr(profile.address, 'country', ''),
            }
    return snapshot


@transaction.atomic
def create_resource_map_service(user, validated_data, units_json, image_file, address_json):
    validated_data['owner'] = user
    validated_data['creator_snapshot'] = generate_creator_snapshot(user)

    units = json.loads(units_json)
    if len(units) > MAX_UNITS_PER_MAP:
        logger.warning(f"User {user.id} tried to create a map with more than {MAX_UNITS_PER_MAP} units.")
        raise ValidationError({"units_data": f"A maximum of {MAX_UNITS_PER_MAP} units is allowed per map."})

    resource_map = ResourceMap.objects.create(**validated_data)
    ResourceImage.objects.create(resource_map=resource_map, blob=image_file.read())

    if address_json:
        try:
            addr_dict = json.loads(address_json)
            if addr_dict.get('has_address'):
                ResourceAddress.objects.create(
                    resource_map=resource_map,
                    country=addr_dict.get('country', 'Poland'),
                    city=addr_dict.get('city', ''),
                    street=addr_dict.get('street', ''),
                    postal_code=addr_dict.get('postal_code', '')
                )
        except json.JSONDecodeError:
            logger.error(f"Failed to decode address JSON during map creation for user {user.id}")

    ResourceUnit.objects.bulk_create([
        ResourceUnit(resource_map=resource_map, x_position=unit['x'], y_position=unit['y'], status='AVAILABLE')
        for unit in units
    ])

    logger.info(f"Successfully created resource map ID {resource_map.id} for user {user.id}")
    return resource_map


@transaction.atomic
def update_resource_map_service(instance, validated_data, new_units_json, image_file, address_json):
    for attr, value in validated_data.items():
        setattr(instance, attr, value)
    instance.save()

    if image_file:
        if hasattr(instance, 'image_data'):
            instance.image_data.blob = image_file.read()
            instance.image_data.save()
        else:
            ResourceImage.objects.create(resource_map=instance, blob=image_file.read())

    if address_json is not None:
        try:
            addr_dict = json.loads(address_json)
            if addr_dict.get('has_address'):
                defaults = {
                    'country': addr_dict.get('country', 'Poland'),
                    'city': addr_dict.get('city', ''),
                    'street': addr_dict.get('street', ''),
                    'postal_code': addr_dict.get('postal_code', '')
                }
                ResourceAddress.objects.update_or_create(resource_map=instance, defaults=defaults)
            else:
                if hasattr(instance, 'address'):
                    instance.address.delete()
        except json.JSONDecodeError:
            logger.error(f"Failed to decode address JSON during map update for map ID {instance.id}")

    if new_units_json:
        try:
            new_units = json.loads(new_units_json)
            if instance.units.count() + len(new_units) > MAX_UNITS_PER_MAP:
                raise ValidationError({"new_units_data": f"A maximum of {MAX_UNITS_PER_MAP} units is allowed per map."})

            if new_units:
                ResourceUnit.objects.bulk_create([
                    ResourceUnit(resource_map=instance, x_position=unit['x'], y_position=unit['y'], status='AVAILABLE')
                    for unit in new_units
                ])
        except json.JSONDecodeError:
            logger.error(f"Failed to decode new units JSON during map update for map ID {instance.id}")

    logger.info(f"Successfully updated resource map ID {instance.id}")
    return instance