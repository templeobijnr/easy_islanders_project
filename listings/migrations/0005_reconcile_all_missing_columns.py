from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("listings", "0004_add_display_order"),
    ]

    operations = [
        # Reconcile all missing columns across listings tables
        # This uses conditional SQL to avoid conflicts on fresh DBs
        migrations.RunSQL(
            sql=(
                """
                -- Add missing columns to listings_category if they don't exist
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name = 'listings_category' AND column_name = 'icon'
                    ) THEN
                        ALTER TABLE listings_category ADD COLUMN icon varchar(100) DEFAULT '';
                    END IF;
                    
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name = 'listings_category' AND column_name = 'color'
                    ) THEN
                        ALTER TABLE listings_category ADD COLUMN color varchar(50) DEFAULT '#6CC24A';
                    END IF;
                END
                $$;
                
                -- Add missing columns to listings_listing if they don't exist
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name = 'listings_listing' AND column_name = 'latitude'
                    ) THEN
                        ALTER TABLE listings_listing ADD COLUMN latitude float8;
                    END IF;
                    
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name = 'listings_listing' AND column_name = 'longitude'
                    ) THEN
                        ALTER TABLE listings_listing ADD COLUMN longitude float8;
                    END IF;
                    
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name = 'listings_listing' AND column_name = 'views'
                    ) THEN
                        ALTER TABLE listings_listing ADD COLUMN views integer DEFAULT 0;
                    END IF;
                END
                $$;
                """
            ),
            reverse_sql=(
                """
                -- Reverse: drop columns if they exist
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name = 'listings_category' AND column_name = 'icon'
                    ) THEN
                        ALTER TABLE listings_category DROP COLUMN icon;
                    END IF;
                    
                    IF EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name = 'listings_category' AND column_name = 'color'
                    ) THEN
                        ALTER TABLE listings_category DROP COLUMN color;
                    END IF;
                    
                    IF EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name = 'listings_listing' AND column_name = 'latitude'
                    ) THEN
                        ALTER TABLE listings_listing DROP COLUMN latitude;
                    END IF;
                    
                    IF EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name = 'listings_listing' AND column_name = 'longitude'
                    ) THEN
                        ALTER TABLE listings_listing DROP COLUMN longitude;
                    END IF;
                    
                    IF EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name = 'listings_listing' AND column_name = 'views'
                    ) THEN
                        ALTER TABLE listings_listing DROP COLUMN views;
                    END IF;
                END
                $$;
                """
            ),
        ),
    ]
