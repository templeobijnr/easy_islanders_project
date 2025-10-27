from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model


class Command(BaseCommand):
    help = "Create a default development user if it doesn't exist"

    def add_arguments(self, parser):
        parser.add_argument('--email', default='dev@example.com')
        parser.add_argument('--username', default='devuser')
        parser.add_argument('--password', default='devpass123')
        parser.add_argument('--user_type', default='consumer')

    def handle(self, *args, **options):
        User = get_user_model()
        email = options['email']
        username = options['username']
        password = options['password']
        user_type = options['user_type']

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': username,
                'user_type': user_type,
            }
        )
        if created:
            user.set_password(password)
            user.save()
            self.stdout.write(self.style.SUCCESS(
                f"Created dev user: {email} / {password} (type={user_type})"
            ))
        else:
            self.stdout.write(
                self.style.WARNING(f"Dev user already exists: {email}")
            )
