import os
import json
from django.contrib.auth import get_user_model
from accounts.models import UserProfile, Address
from finance.models import PayoutAccount


BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
USERS_JSON_PATH = os.path.join(BASE_DIR, "data", "accounts", "users", "users.json")

def insert_admin():
    User = get_user_model()
    email = 'admin@example.com'
    username = 'admin'
    password = 'adminpassword123'

    if not User.objects.filter(email=email).exists():
        user = User.objects.create_superuser(
            email=email,
            username=username,
            password=password
        )
        user.role = 'ADMIN'
        user.save()
        print(f"Created admin: {email}")
    else:
        print(f"Admin exists: {email}")

def insert_users():
    if not os.path.exists(USERS_JSON_PATH):
        print("Users JSON file not found!")
        return

    User = get_user_model()

    with open(USERS_JSON_PATH, "r") as f:
        users = json.load(f)

    for u in users:
        email = u["email"]

        if User.objects.filter(email=email).exists():
            print(f"User exists: {email}")
            continue

        user = User.objects.create_user(
            username=u["username"],
            email=email,
            password=u.get("password", "123456")
        )
        user.role = u.get("role", "USER")
        user.save()

        profile_data = u.get("profile", {})
        profile = UserProfile.objects.create(
            user=user,
            account_type=profile_data.get("account_type", "individual"),
            first_name=profile_data.get("first_name", ""),
            last_name=profile_data.get("last_name", ""),
            company_name=profile_data.get("company_name", ""),
            tax_id=profile_data.get("tax_id", ""),
        )

        addr = profile_data.get("address")
        if addr:
            Address.objects.create(
                profile=profile,
                street=addr.get("street", ""),
                city=addr.get("city", ""),
                postal_code=addr.get("postal_code", ""),
                country=addr.get("country", "Poland"),
            )

        payout = profile_data.get("payout_account")
        if payout:
            PayoutAccount.objects.create(
                user=user,
                bank_account_number=payout.get("bank_account_number", "")
            )

        print(f"Created user with profile: {email}")