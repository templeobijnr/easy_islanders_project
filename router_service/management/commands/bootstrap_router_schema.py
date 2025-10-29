from __future__ import annotations

from pathlib import Path
from django.core.management.base import BaseCommand
from django.db import connection, transaction


class Command(BaseCommand):
    help = "Apply pgvector intent router schema from registry_service/sql/02_intent_router.sql"

    def handle(self, *args, **options):
        vendor = connection.vendor
        if vendor != 'postgresql':
            self.stdout.write(self.style.WARNING("Skipping bootstrap: database is not PostgreSQL"))
            return
        sql_path = Path(__file__).resolve().parents[3] / 'registry_service' / 'sql' / '02_intent_router.sql'
        if not sql_path.exists():
            self.stdout.write(self.style.ERROR(f"SQL file not found: {sql_path}"))
            return

        sql = sql_path.read_text(encoding='utf-8')
        try:
            with transaction.atomic():
                with connection.cursor() as cur:
                    cur.execute(sql)
            self.stdout.write(self.style.SUCCESS("Router schema bootstrap complete"))
        except Exception as exc:
            self.stdout.write(self.style.ERROR(f"Bootstrap failed: {exc}"))

