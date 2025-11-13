"""
Management command to fix migration state when database tables exist but migrations aren't recorded.

This addresses the common issue where django_content_type and other tables already exist
but Django's migration system thinks they need to be created from scratch.

Usage:
    python3 manage.py fix_migration_state --check     # Check current state
    python3 manage.py fix_migration_state --fake-all  # Fake all missing migrations
    python3 manage.py fix_migration_state --app listings  # Fix specific app
"""

from django.core.management.base import BaseCommand, CommandError
from django.db import connection
from django.db.migrations.recorder import MigrationRecorder
from django.apps import apps
import sys


class Command(BaseCommand):
    help = 'Fix migration state when database tables exist but migrations are not recorded'

    def add_arguments(self, parser):
        parser.add_argument(
            '--check',
            action='store_true',
            help='Check current migration state without making changes',
        )
        parser.add_argument(
            '--fake-all',
            action='store_true',
            help='Fake all missing migrations for all apps',
        )
        parser.add_argument(
            '--app',
            type=str,
            help='Fix migrations for a specific app only',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without actually doing it',
        )

    def handle(self, *args, **options):
        check_only = options['check']
        fake_all = options['fake_all']
        app_label = options['app']
        dry_run = options['dry_run']

        self.stdout.write(self.style.SUCCESS('\n=== Migration State Analysis ===\n'))

        # Get all existing tables in the database
        existing_tables = self.get_existing_tables()
        self.stdout.write(f"Found {len(existing_tables)} tables in database\n")

        # Get recorded migrations
        recorder = MigrationRecorder(connection)
        applied_migrations = set(recorder.applied_migrations())
        self.stdout.write(f"Found {len(applied_migrations)} recorded migrations\n")

        # Analyze each app
        issues_found = False
        app_configs = apps.get_app_configs()

        if app_label:
            try:
                app_configs = [apps.get_app_config(app_label)]
            except LookupError:
                raise CommandError(f"App '{app_label}' not found")

        for app_config in app_configs:
            if not app_config.name.startswith('django.'):
                issues = self.analyze_app(app_config, existing_tables, applied_migrations)
                if issues:
                    issues_found = True

        # Take action based on options
        if check_only:
            self.stdout.write(self.style.SUCCESS('\n=== Check Complete ==='))
            if issues_found:
                self.stdout.write(self.style.WARNING(
                    '\nIssues found! Run with --fake-all to fix migration state.'
                ))
                sys.exit(1)
            else:
                self.stdout.write(self.style.SUCCESS(
                    '\nNo issues found. Migration state looks good!'
                ))
            return

        if fake_all:
            self.stdout.write(self.style.SUCCESS('\n=== Fixing Migration State ===\n'))
            if dry_run:
                self.stdout.write(self.style.WARNING('DRY RUN MODE - No changes will be made\n'))
            self.fix_migration_state(app_label, dry_run)

        if not check_only and not fake_all:
            self.stdout.write(self.style.WARNING(
                '\nNo action specified. Use --check to analyze or --fake-all to fix.'
            ))

    def get_existing_tables(self):
        """Get list of all tables in the database."""
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT tablename
                FROM pg_tables
                WHERE schemaname = 'public'
                ORDER BY tablename
            """)
            return {row[0] for row in cursor.fetchall()}

    def analyze_app(self, app_config, existing_tables, applied_migrations):
        """Analyze migration state for a single app."""
        from django.db.migrations.loader import MigrationLoader

        loader = MigrationLoader(connection)
        app_label = app_config.label

        # Get all migrations for this app
        if app_label not in loader.migrated_apps:
            return False

        app_migrations = [
            (app_label, migration_name)
            for (app, migration_name) in loader.disk_migrations.keys()
            if app == app_label
        ]

        if not app_migrations:
            return False

        # Check which migrations are not applied
        unapplied = [
            migration for migration in app_migrations
            if migration not in applied_migrations
        ]

        # Check if app has tables in database
        app_has_tables = any(
            table.startswith(f"{app_label}_") or table.startswith(app_label)
            for table in existing_tables
        )

        if unapplied:
            self.stdout.write(f"\n{app_label}:")
            self.stdout.write(f"  - Total migrations: {len(app_migrations)}")
            self.stdout.write(f"  - Applied: {len(app_migrations) - len(unapplied)}")
            self.stdout.write(f"  - Unapplied: {len(unapplied)}")
            self.stdout.write(f"  - Has tables in DB: {app_has_tables}")

            if app_has_tables and unapplied:
                self.stdout.write(self.style.WARNING(
                    f"  ⚠️  ISSUE: Tables exist but {len(unapplied)} migrations not recorded!"
                ))
                for migration in unapplied[:5]:  # Show first 5
                    self.stdout.write(f"     - {migration[1]}")
                if len(unapplied) > 5:
                    self.stdout.write(f"     ... and {len(unapplied) - 5} more")
                return True

        return False

    def fix_migration_state(self, app_label=None, dry_run=False):
        """Fake migrations to match database state."""
        from django.core.management import call_command

        # First, ensure django_migrations table exists
        MigrationRecorder(connection).ensure_schema()

        # Fake initial migrations for contenttypes and auth (Django built-ins)
        django_apps = ['contenttypes', 'auth', 'admin', 'sessions']

        for django_app in django_apps:
            try:
                if dry_run:
                    self.stdout.write(f"Would fake initial migration for: {django_app}")
                else:
                    self.stdout.write(f"Faking initial migration for: {django_app}")
                    call_command('migrate', django_app, '--fake-initial', '--verbosity=1')
            except Exception as e:
                self.stdout.write(self.style.WARNING(f"  Skipping {django_app}: {str(e)}"))

        # Now handle the specific app or all custom apps
        if app_label:
            apps_to_fix = [app_label]
        else:
            # Get all custom apps (not Django built-ins)
            apps_to_fix = [
                app_config.label
                for app_config in apps.get_app_configs()
                if not app_config.name.startswith('django.')
            ]

        for app in apps_to_fix:
            try:
                if dry_run:
                    self.stdout.write(f"Would fake initial migration for: {app}")
                else:
                    self.stdout.write(f"Faking initial migration for: {app}")
                    call_command('migrate', app, '--fake-initial', '--verbosity=1')
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"  Error fixing {app}: {str(e)}"))

        if not dry_run:
            self.stdout.write(self.style.SUCCESS('\n=== Migration state fixed! ==='))
            self.stdout.write('You can now run: python3 manage.py migrate')
        else:
            self.stdout.write(self.style.WARNING('\nDRY RUN complete. Remove --dry-run to apply changes.'))
