from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("listings", "0005_reconcile_all_missing_columns"),
    ]

    operations = [
        migrations.RunSQL(
            sql=(
                """
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name = 'listings_subcategory' AND column_name = 'display_order'
                    ) THEN
                        ALTER TABLE listings_subcategory
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
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name = 'listings_subcategory' AND column_name = 'display_order'
                    ) THEN
                        ALTER TABLE listings_subcategory
                        DROP COLUMN display_order;
                    END IF;
                END
                $$;
                """
            ),
        ),
    ]
