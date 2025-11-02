from django.db import migrations

RUN_SQL = r"""
DO $$
BEGIN
    -- 1) Add column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='assistant_message' AND column_name='client_msg_id'
    ) THEN
        ALTER TABLE assistant_message
        ADD COLUMN client_msg_id uuid NULL;
    END IF;

    -- 2) Optional index for lookups
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename='assistant_message' AND indexname='assistant_message_client_msg_id_idx'
    ) THEN
        CREATE INDEX assistant_message_client_msg_id_idx
        ON assistant_message (client_msg_id);
    END IF;

    -- 3) Idempotency safety (per-thread uniqueness).
    -- Your table currently uses conversation_id (varchar) instead of thread_id.
    -- This matches your live schema today. Adjust if/when you migrate to a FK.
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'uniq_client_msg_per_conversation'
    ) THEN
        ALTER TABLE assistant_message
        ADD CONSTRAINT uniq_client_msg_per_conversation
        UNIQUE (conversation_id, client_msg_id);
    END IF;
END
$$;
"""


def apply_postgres_sql(apps, schema_editor):
    # Only execute on PostgreSQL. On SQLite and others, 0012 already added the field.
    if schema_editor.connection.vendor != "postgresql":
        return
    with schema_editor.connection.cursor() as cursor:
        cursor.execute(RUN_SQL)


class Migration(migrations.Migration):
    dependencies = [
        ("assistant", "0012_add_client_msg_id_for_idempotency"),
    ]
    operations = [
        migrations.RunPython(apply_postgres_sql, reverse_code=migrations.RunPython.noop),
    ]
