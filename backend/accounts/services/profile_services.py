import logging
from accounts.models.user_models import UserProfile

logger = logging.getLogger(__name__)

def get_or_create_user_profile(user):
    profile, created = UserProfile.objects.get_or_create(user=user)
    if created:
        logger.info(f"Successfully created a new user profile for: {user.email}")
    return profile