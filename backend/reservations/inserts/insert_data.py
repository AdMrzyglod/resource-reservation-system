import os
import json
from django.core.files import File
from reservations.models import Category

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CATEGORIES_JSON_PATH = os.path.join(BASE_DIR, "data", "reservations", "categories", "categories.json")

def insert_categories(stdout):
    if not os.path.exists(CATEGORIES_JSON_PATH):
        stdout.write("Categories JSON file not found!")
        return
    stdout.write(CATEGORIES_JSON_PATH)
    with open(CATEGORIES_JSON_PATH, "r") as f:
        categories = json.load(f)
    stdout.write(json.dumps(categories, indent=2))
    for cat in categories:
        obj, created = Category.objects.get_or_create(name=cat["name"])
        stdout.write(f"{'Created' if created else 'Exists'} category: {cat['name']}")