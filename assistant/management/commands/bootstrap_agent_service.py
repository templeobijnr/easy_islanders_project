from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.db import transaction

from rest_framework.authtoken.models import Token


class Command(BaseCommand):
    help = "Create/ensure the agent service account and DRF token with broadcast permission"

    def handle(self, *args, **options):
        User = get_user_model()
        username = 'agent_service'
        email = 'agent@easy-islanders.local'

        with transaction.atomic():
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': email,
                    'is_active': True,
                    'is_staff': True,
                    'is_superuser': False,
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created service user: {username}"))
            else:
                self.stdout.write(f"Service user exists: {username}")

            # Ensure permission
            try:
                perm = Permission.objects.get(codename='can_broadcast_to_all_sellers')
                user.user_permissions.add(perm)
                self.stdout.write(self.style.SUCCESS("Assigned permission: can_broadcast_to_all_sellers"))
            except Permission.DoesNotExist:
                self.stdout.write(self.style.WARNING("Permission not found yet; run migrations first."))

            # Ensure token
            token, _ = Token.objects.get_or_create(user=user)
            self.stdout.write(self.style.SUCCESS(f"Token: {token.key}"))
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.db import transaction

from rest_framework.authtoken.models import Token


class Command(BaseCommand):
    help = "Create/ensure the agent service account and DRF token with broadcast permission"

    def handle(self, *args, **options):
        User = get_user_model()
        username = 'agent_service'
        email = 'agent@easy-islanders.local'

        with transaction.atomic():
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': email,
                    'is_active': True,
                    'is_staff': True,
                    'is_superuser': False,
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created service user: {username}"))
            else:
                self.stdout.write(f"Service user exists: {username}")

            # Ensure permission
            try:
                perm = Permission.objects.get(codename='can_broadcast_to_all_sellers')
                user.user_permissions.add(perm)
                self.stdout.write(self.style.SUCCESS("Assigned permission: can_broadcast_to_all_sellers"))
            except Permission.DoesNotExist:
                self.stdout.write(self.style.WARNING("Permission not found yet; run migrations first."))

            # Ensure token
            token, _ = Token.objects.get_or_create(user=user)
            self.stdout.write(self.style.SUCCESS(f"Token: {token.key}"))
