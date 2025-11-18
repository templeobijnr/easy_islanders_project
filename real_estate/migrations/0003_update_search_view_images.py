# Generated manually for search views

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("real_estate", "0002_create_search_views"),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                DROP VIEW IF EXISTS vw_listings_search;
                CREATE VIEW vw_listings_search AS
                SELECT
                    -- Listing fields
                    l.id AS listing_id,
                    l.reference_code AS listing_reference_code,
                    lt.code AS listing_type_code,
                    l.status,
                    l.title,
                    l.description,
                    l.base_price,
                    l.currency,
                    l.price_period,
                    l.available_from,
                    l.available_to,
                    l.created_at,
                    l.updated_at,

                    -- Cover Image (Subquery)
                    (
                        SELECT img.image
                        FROM real_estate_propertyimage img
                        WHERE img.listing_id = l.id
                        ORDER BY img.display_order ASC, img.uploaded_at ASC
                        LIMIT 1
                    ) AS cover_image,

                    -- Property fields
                    p.id AS property_id,
                    p.reference_code AS property_reference_code,
                    p.bedrooms,
                    p.living_rooms,
                    p.bathrooms,
                    p.room_configuration_label,
                    p.total_area_sqm,
                    p.net_area_sqm,
                    p.furnished_status,
                    p.floor_number,
                    p.total_floors,
                    p.year_built,
                    p.is_gated_community,

                    -- Project fields
                    proj.id AS project_id,
                    proj.name AS project_name,

                    -- Location fields
                    loc.id AS location_id,
                    loc.city,
                    loc.area,
                    loc.country,
                    loc.region,
                    loc.latitude,
                    loc.longitude,

                    -- Property type fields
                    pt.code AS property_type_code,
                    pt.label AS property_type_label,
                    pt.category AS property_category,

                    -- Feature flags
                    EXISTS (
                        SELECT 1 FROM real_estate_propertyfeature pf
                        JOIN real_estate_feature f ON f.id = pf.feature_id
                        WHERE pf.property_id = p.id AND f.code = 'WIFI'
                    ) AS has_wifi,
                    EXISTS (
                        SELECT 1 FROM real_estate_propertyfeature pf
                        JOIN real_estate_feature f ON f.id = pf.feature_id
                        WHERE pf.property_id = p.id AND f.code = 'KITCHEN'
                    ) AS has_kitchen,
                    EXISTS (
                        SELECT 1 FROM real_estate_propertyfeature pf
                        JOIN real_estate_feature f ON f.id = pf.feature_id
                        WHERE pf.property_id = p.id AND f.code = 'PRIVATE_POOL'
                    ) AS has_private_pool,
                    EXISTS (
                        SELECT 1 FROM real_estate_propertyfeature pf
                        JOIN real_estate_feature f ON f.id = pf.feature_id
                        WHERE pf.property_id = p.id AND f.code = 'SHARED_POOL'
                    ) AS has_shared_pool,
                    EXISTS (
                        SELECT 1 FROM real_estate_propertyfeature pf
                        JOIN real_estate_feature f ON f.id = pf.feature_id
                        WHERE pf.property_id = p.id AND f.code = 'PARKING'
                    ) AS has_parking,
                    EXISTS (
                        SELECT 1 FROM real_estate_propertyfeature pf
                        JOIN real_estate_feature f ON f.id = pf.feature_id
                        WHERE pf.property_id = p.id AND f.code = 'AC'
                    ) AS has_air_conditioning,
                    EXISTS (
                        SELECT 1 FROM real_estate_propertyfeature pf
                        JOIN real_estate_feature f ON f.id = pf.feature_id
                        WHERE pf.property_id = p.id AND f.code = 'CENTRAL_HEATING'
                    ) AS has_central_heating,
                    EXISTS (
                        SELECT 1 FROM real_estate_propertyfeature pf
                        JOIN real_estate_feature f ON f.id = pf.feature_id
                        WHERE pf.property_id = p.id AND f.code = 'SEA_VIEW'
                    ) AS view_sea,
                    EXISTS (
                        SELECT 1 FROM real_estate_propertyfeature pf
                        JOIN real_estate_feature f ON f.id = pf.feature_id
                        WHERE pf.property_id = p.id AND f.code = 'MOUNTAIN_VIEW'
                    ) AS view_mountain,
                    EXISTS (
                        SELECT 1 FROM real_estate_propertyfeature pf
                        JOIN real_estate_feature f ON f.id = pf.feature_id
                        WHERE pf.property_id = p.id AND f.code = 'BALCONY'
                    ) AS has_balcony,
                    EXISTS (
                        SELECT 1 FROM real_estate_propertyfeature pf
                        JOIN real_estate_feature f ON f.id = pf.feature_id
                        WHERE pf.property_id = p.id AND f.code = 'TERRACE'
                    ) AS has_terrace,
                    EXISTS (
                        SELECT 1 FROM real_estate_propertyfeature pf
                        JOIN real_estate_feature f ON f.id = pf.feature_id
                        WHERE pf.property_id = p.id AND f.code = 'GARDEN'
                    ) AS has_garden
                FROM real_estate_listing l
                JOIN real_estate_listingtype lt ON lt.id = l.listing_type_id
                LEFT JOIN real_estate_property p ON p.id = l.property_id
                LEFT JOIN real_estate_project proj ON proj.id = l.project_id
                LEFT JOIN real_estate_location loc ON loc.id = p.location_id
                LEFT JOIN real_estate_propertytype pt ON pt.id = p.property_type_id;
            """,
            reverse_sql="DROP VIEW IF EXISTS vw_listings_search;",
        ),
    ]
