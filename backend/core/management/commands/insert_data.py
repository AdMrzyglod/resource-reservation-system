from django.core.management.base import BaseCommand
from reservations.inserts.insert_data import insert_categories, insert_resourcemaps_data
from accounts.inserts.insert_data import insert_admin, insert_users

class Command(BaseCommand):
    help = "Insert initial and sample data into the database"

    def add_arguments(self, parser):
        parser.add_argument(
            '--sample',
            action='store_true',
            help='Insert sample data'
        )

    def handle(self, *args, **kwargs):
        sample = kwargs.get('sample', False)
        self.stdout.write("Starting data insert...")
        insert_categories()
        insert_admin()

        if sample:
            insert_users()
            insert_resourcemaps_data()

        self.stdout.write("Data insert completed.")