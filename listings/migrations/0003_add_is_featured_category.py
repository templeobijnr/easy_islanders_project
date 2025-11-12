from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("listings", "0002_add_location_fields"),
    ]

    operations = [
        # On some long-lived DBs, the initial migration that should have added
        # is_featured_category was never applied. On fresh DBs, it's already there.
        # Use conditional SQL to add the column only if missing.
        migrations.RunSQL(
            sql=(
                """
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1
                        FROM information_schema.columns
                        WHERE table_name = 'listings_category'
                          AND column_name = 'is_featured_category'
                    ) THEN
                        ALTER TABLE listings_category
                        ADD COLUMN is_featured_category boolean NOT NULL DEFAULT false;
                    END IF;
                END
                $$;
                """
            ),
            reverse_sql=(
                """
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1
                        FROM information_schema.columns
                        WHERE table_name = 'listings_category'
                          AND column_name = 'is_featured_category'
                    ) THEN
                        ALTER TABLE listings_category
                        DROP COLUMN is_featured_category;
                    END IF;
                END
                $$;
                """
            ),
        ),
    ]
