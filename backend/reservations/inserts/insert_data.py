import os
import json
from datetime import timedelta
from django.conf import settings
from django.core.files import File
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from django.db import transaction
from django.contrib.auth import get_user_model
from reservations.models import Category, ResourceMap, ResourceAddress, ResourceUnit, ResourceImage

def calculate_dynamic_date(date_string):
    if not date_string:
        return None

    if isinstance(date_string, str) and date_string.startswith("RELATIVE:"):
        try:
            parts = date_string.split(":")[1:]

            if len(parts) == 3:
                days_to_add = int(parts[0])
                target_hour = int(parts[1])
                target_minute = int(parts[2])

                now = timezone.now()

                target_date = now + timedelta(days=days_to_add)
                return target_date.replace(hour=target_hour, minute=target_minute, second=0, microsecond=0)
            else:
                print(f"Warning: Invalid relative date format: {date_string}. Expected RELATIVE:DD:HH:MM")
                return None

        except ValueError:
            print(f"Warning: Value error while parsing relative date: {date_string}")
            return None

    return parse_datetime(date_string)


def insert_categories():
    print("Inserting categories data...")
    data_file = os.path.join(settings.BASE_DIR, 'data', 'reservations', 'categories', 'categories.json')

    if not os.path.exists(data_file):
        print(f"File not found: {data_file}")
        return

    with open(data_file, 'r', encoding='utf-8') as f:
        categories_data = json.load(f)

    for data in categories_data:
        Category.objects.get_or_create(name=data["name"])

    print("Categories data inserted.")


def insert_resourcemaps_data():
    print("Inserting resource maps data...")
    User = get_user_model()

    data_file = os.path.join(settings.BASE_DIR, 'data', 'reservations', 'resourcemaps', 'resourcemaps.json')
    images_dir = os.path.join(settings.BASE_DIR, 'data', 'reservations', 'resourcemaps', 'images')

    if not os.path.exists(data_file):
        print(f"File not found: {data_file}")
        return

    with open(data_file, 'r', encoding='utf-8') as f:
        maps_data = json.load(f)

    with transaction.atomic():
        for map_data in maps_data:
            user_email = map_data.get("user_email")

            try:
                owner = User.objects.select_related('profile', 'profile__address').get(email=user_email)
            except User.DoesNotExist:
                print(f"Error: User email '{user_email}' does not exist. Skipping map '{map_data.get('title')}'.")
                continue

            profile = owner.profile
            address_obj = getattr(profile, 'address', None)

            creator_snapshot = {
                "tax_id": profile.tax_id or "",
                "address": {
                    "city": address_obj.city if address_obj else "",
                    "street": address_obj.street if address_obj else "",
                    "country": address_obj.country if address_obj else "",
                    "postal_code": address_obj.postal_code if address_obj else ""
                },
                "last_name": profile.last_name or "",
                "first_name": profile.first_name or "",
                "account_type": profile.account_type or "individual",
                "company_name": profile.company_name or ""
            }

            cat_name = map_data.get('category')
            category = Category.objects.filter(name=cat_name).first()
            if not category:
                category = Category.objects.first()
                print(f"Warning: Category '{cat_name}' not found. Using fallback category.")

            if ResourceMap.objects.filter(title=map_data['title'], owner=owner).exists():
                print(f"Map '{map_data['title']}' already exists for user '{user_email}'. Skipping.")
                continue

            resource_map = ResourceMap.objects.create(
                owner=owner,
                category=category,
                title=map_data['title'],
                description=map_data.get('description', ''),
                price=map_data['price'],
                dot_size=map_data.get('dot_size', 12),
                event_start_date=calculate_dynamic_date(map_data.get('event_start_date')),
                event_end_date=calculate_dynamic_date(map_data.get('event_end_date')),
                purchase_deadline=calculate_dynamic_date(map_data.get('purchase_deadline')),
                payout_status=map_data.get('payout_status', 'PENDING'),
                creator_snapshot=creator_snapshot
            )

            image_filename = map_data.get('image_filename')
            if image_filename:
                image_path = os.path.join(images_dir, image_filename)
                if os.path.exists(image_path):
                    with open(image_path, 'rb') as img_file:
                        ResourceImage.objects.create(
                            resource_map=resource_map,
                            blob=img_file.read()
                        )
                else:
                    print(f"Warning: Image file '{image_path}' not found.")

            addr_data = map_data.get('address')
            if addr_data:
                ResourceAddress.objects.create(
                    resource_map=resource_map,
                    country=addr_data.get('country', ''),
                    city=addr_data.get('city', ''),
                    street=addr_data.get('street', ''),
                    postal_code=addr_data.get('postal_code', '')
                )

            units_data = map_data.get('units', [])
            units_to_create = [
                ResourceUnit(
                    resource_map=resource_map,
                    x_position=unit['x'],
                    y_position=unit['y'],
                    status=unit.get('status', 'AVAILABLE')
                ) for unit in units_data
            ]

            if units_to_create:
                ResourceUnit.objects.bulk_create(units_to_create)

            print(f"Successfully inserted ResourceMap: '{resource_map.title}' with {len(units_to_create)} units.")