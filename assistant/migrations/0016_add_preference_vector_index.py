# Generated manually for pgvector IVFFlat index
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("assistant", "0015_add_user_preferences_v1"),
    ]

    operations = [
        # Create IVFFlat index for vector similarity search
        # Using 100 lists for ~10k-100k rows (rule of thumb: rows / 1000)
        migrations.RunSQL(
            sql="""
                CREATE INDEX IF NOT EXISTS user_preferences_embedding_idx
                ON user_preferences
                USING ivfflat (embedding vector_cosine_ops)
                WITH (lists = 100);
            """,
            reverse_sql="""
                DROP INDEX IF EXISTS user_preferences_embedding_idx;
            """,
        ),
    ]
