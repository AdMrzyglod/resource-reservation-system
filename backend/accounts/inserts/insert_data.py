from django.contrib.auth import get_user_model


def insert_admin(stdout):
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
        stdout.write(f"Created admin: {email}")
    else:
        stdout.write(f"Admin exists: {email}")