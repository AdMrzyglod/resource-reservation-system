from django.core.management.base import BaseCommand
from reservations.inserts.insert_data import insert_categories
from accounts.inserts.insert_data import insert_admin

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
        insert_categories(self.stdout)
        insert_admin(self.stdout)

        if sample:
            pass

        self.stdout.write("Data insert completed.")