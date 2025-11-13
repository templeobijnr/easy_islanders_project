from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("listings", "0003_add_is_featured_category"),
    ]

    operations = [
        migrations.RunSQL(
            sql=(
                """
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1
                        FROM information_schema.columns
                        WHERE table_name = 'listings_category'
                          AND column_name = 'display_order'
                    ) THEN
                        ALTER TABLE listings_category
                        ADD COLUMN display_order integer NOT NULL DEFAULT 0;
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
                          AND column_name = 'display_order'
                    ) THEN
                        ALTER TABLE listings_category
                        DROP COLUMN display_order;
                    END IF;
                END
                $$;
                """
            ),
        ),
    ]
