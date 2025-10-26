"""
Django Management Command: bootstrap_postgres_checkpoints

Initializes the PostgreSQL database schema required for LangGraph persistence.
Creates necessary tables and indices for checkpoint storage.

Usage:
    python manage.py bootstrap_postgres_checkpoints
"""

import os
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from assistant.brain.checkpointing import get_checkpoint_saver, test_connection
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Initialize PostgreSQL schema for LangGraph checkpoints"

    def add_arguments(self, parser):
        parser.add_argument(
            '--connection-string',
            type=str,
            default=None,
            help='PostgreSQL connection string (overrides settings)',
        )
        parser.add_argument(
            '--test-only',
            action='store_true',
            help='Only test connection, do not initialize schema',
        )

    def handle(self, *args, **options):
        """Execute bootstrap command."""
        
        # Get connection string
        conn_string = (
            options.get('connection_string') or
            getattr(settings, 'LANGGRAPH_CHECKPOINT_CONNECTION_STRING', None) or
            os.getenv('LANGGRAPH_CHECKPOINT_CONNECTION_STRING')
        )
        
        if not conn_string:
            raise CommandError(
                "❌ Connection string not found. Set LANGGRAPH_CHECKPOINT_CONNECTION_STRING "
                "in settings or pass --connection-string"
            )
        
        self.stdout.write(f"📍 Connection string: {conn_string[:50]}...")
        
        # Check if using PostgreSQL or SQLite
        is_postgresql = conn_string.startswith('postgresql://')
        
        # Test PostgreSQL connection if needed
        if is_postgresql:
            if not test_connection(conn_string):
                raise CommandError(
                    "❌ PostgreSQL connection failed. Check your connection string and "
                    "ensure PostgreSQL is running."
                )
        else:
            self.stdout.write(
                "ℹ️  Using SQLite for Phase A development (not PostgreSQL)"
            )
        
        # If test-only, exit here
        if options.get('test_only'):
            self.stdout.write(self.style.SUCCESS("✅ Connection test passed"))
            return
        
        # Initialize checkpoint saver
        try:
            saver = get_checkpoint_saver(conn_string)
            self.stdout.write(self.style.SUCCESS(
                "✅ Checkpoint saver initialized successfully"
            ))
            if is_postgresql:
                self.stdout.write(
                    "✅ LangGraph checkpoints table created (if not exists)"
                )
            else:
                self.stdout.write(
                    "✅ Phase A: Using in-memory checkpoint storage (SQLite fallback)"
                )
            self.stdout.write(
                "Next: Update settings and restart Django to use the checkpoint saver"
            )
        except Exception as e:
            raise CommandError(f"❌ Failed to initialize checkpoint saver: {e}")


Initializes the PostgreSQL database schema required for LangGraph persistence.
Creates necessary tables and indices for checkpoint storage.

Usage:
    python manage.py bootstrap_postgres_checkpoints
"""

import os
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from assistant.brain.checkpointing import get_checkpoint_saver, test_connection
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Initialize PostgreSQL schema for LangGraph checkpoints"

    def add_arguments(self, parser):
        parser.add_argument(
            '--connection-string',
            type=str,
            default=None,
            help='PostgreSQL connection string (overrides settings)',
        )
        parser.add_argument(
            '--test-only',
            action='store_true',
            help='Only test connection, do not initialize schema',
        )

    def handle(self, *args, **options):
        """Execute bootstrap command."""
        
        # Get connection string
        conn_string = (
            options.get('connection_string') or
            getattr(settings, 'LANGGRAPH_CHECKPOINT_CONNECTION_STRING', None) or
            os.getenv('LANGGRAPH_CHECKPOINT_CONNECTION_STRING')
        )
        
        if not conn_string:
            raise CommandError(
                "❌ Connection string not found. Set LANGGRAPH_CHECKPOINT_CONNECTION_STRING "
                "in settings or pass --connection-string"
            )
        
        self.stdout.write(f"📍 Connection string: {conn_string[:50]}...")
        
        # Check if using PostgreSQL or SQLite
        is_postgresql = conn_string.startswith('postgresql://')
        
        # Test PostgreSQL connection if needed
        if is_postgresql:
            if not test_connection(conn_string):
                raise CommandError(
                    "❌ PostgreSQL connection failed. Check your connection string and "
                    "ensure PostgreSQL is running."
                )
        else:
            self.stdout.write(
                "ℹ️  Using SQLite for Phase A development (not PostgreSQL)"
            )
        
        # If test-only, exit here
        if options.get('test_only'):
            self.stdout.write(self.style.SUCCESS("✅ Connection test passed"))
            return
        
        # Initialize checkpoint saver
        try:
            saver = get_checkpoint_saver(conn_string)
            self.stdout.write(self.style.SUCCESS(
                "✅ Checkpoint saver initialized successfully"
            ))
            if is_postgresql:
                self.stdout.write(
                    "✅ LangGraph checkpoints table created (if not exists)"
                )
            else:
                self.stdout.write(
                    "✅ Phase A: Using in-memory checkpoint storage (SQLite fallback)"
                )
            self.stdout.write(
                "Next: Update settings and restart Django to use the checkpoint saver"
            )
        except Exception as e:
            raise CommandError(f"❌ Failed to initialize checkpoint saver: {e}")
