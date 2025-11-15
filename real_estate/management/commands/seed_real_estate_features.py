from django.core.management.base import BaseCommand

from real_estate.models import FeatureCategory, Feature, PropertyType


class Command(BaseCommand):
    help = "Seed core real estate feature categories and features for properties."

    def handle(self, *args, **options):
        """Create a baseline taxonomy of feature categories and features.

        The goal is to mirror a 101evler-style breakdown of Internal / External /
        Location features while keeping the list small and opinionated. It is
        safe to run this command multiple times; existing records are updated
        in-place and new ones are created as needed.
        """

        self.stdout.write(self.style.MIGRATE_HEADING("Seeding real estate feature taxonomy"))

        categories_spec = [
            {"code": "INTERNAL", "label": "Internal Features", "sort_order": 10},
            {"code": "EXTERNAL", "label": "External Features", "sort_order": 20},
            {"code": "LOCATION", "label": "Location Features", "sort_order": 30},
            {"code": "SAFETY", "label": "Safety & Security", "sort_order": 40},
            {"code": "BUILDING", "label": "Building Features", "sort_order": 50},
        ]

        categories_by_code = {}
        for spec in categories_spec:
            cat, created = FeatureCategory.objects.update_or_create(
                code=spec["code"],
                defaults={
                    "label": spec["label"],
                    "sort_order": spec["sort_order"],
                },
            )
            categories_by_code[spec["code"]] = cat
            action = "Created" if created else "Updated"
            self.stdout.write(f"  {action} FeatureCategory {cat.code} ({cat.label})")

        # Core property types where most features make sense; we do not try to
        # be exhaustive here. If a type is missing, features will simply apply
        # to all types.
        residential_types = list(
            PropertyType.objects.filter(category="RESIDENTIAL").values_list("id", flat=True)
        )

        features_spec = [
            # Internal
            {"code": "ac", "label": "Air Conditioning", "category": "INTERNAL", "group": "INTERNAL", "sort_order": 10},
            {"code": "built_in_kitchen", "label": "Built-in Kitchen", "category": "INTERNAL", "group": "INTERNAL", "sort_order": 20},
            {"code": "furnished", "label": "Furnished", "category": "INTERNAL", "group": "INTERNAL", "sort_order": 30},
            {"code": "fireplace", "label": "Fireplace", "category": "INTERNAL", "group": "INTERNAL", "sort_order": 40},
            # External
            {"code": "pool_shared", "label": "Shared Pool", "category": "EXTERNAL", "group": "EXTERNAL", "sort_order": 10},
            {"code": "pool_private", "label": "Private Pool", "category": "EXTERNAL", "group": "EXTERNAL", "sort_order": 20},
            {"code": "garden", "label": "Garden", "category": "EXTERNAL", "group": "EXTERNAL", "sort_order": 30},
            {"code": "barbecue_area", "label": "Barbecue Area", "category": "EXTERNAL", "group": "EXTERNAL", "sort_order": 40},
            {"code": "elevator", "label": "Elevator", "category": "EXTERNAL", "group": "EXTERNAL", "sort_order": 50},
            {"code": "open_parking", "label": "Open Parking", "category": "EXTERNAL", "group": "EXTERNAL", "sort_order": 60},
            {"code": "closed_parking", "label": "Closed Parking", "category": "EXTERNAL", "group": "EXTERNAL", "sort_order": 70},
            # Location
            {"code": "sea_view", "label": "Sea View", "category": "LOCATION", "group": "LOCATION", "sort_order": 10},
            {"code": "mountain_view", "label": "Mountain View", "category": "LOCATION", "group": "LOCATION", "sort_order": 20},
            {"code": "city_view", "label": "City View", "category": "LOCATION", "group": "LOCATION", "sort_order": 30},
            {"code": "near_sea", "label": "Near the Sea", "category": "LOCATION", "group": "LOCATION", "sort_order": 40},
            # Safety
            {"code": "security_cam", "label": "Security Cameras", "category": "SAFETY", "group": "SAFETY", "sort_order": 10},
            {"code": "site_security", "label": "Site Security", "category": "SAFETY", "group": "SAFETY", "sort_order": 20},
            # Building
            {"code": "generator", "label": "Generator", "category": "BUILDING", "group": "BUILDING", "sort_order": 10},
            {"code": "double_glazing", "label": "Double Glazing", "category": "BUILDING", "group": "BUILDING", "sort_order": 20},
        ]

        for spec in features_spec:
            category = categories_by_code[spec["category"]]
            feature, created = Feature.objects.update_or_create(
                code=spec["code"],
                defaults={
                    "label": spec["label"],
                    "category": category,
                    "group": spec["group"],
                    "is_filterable": True,
                    "sort_order": spec["sort_order"],
                },
            )

            if residential_types:
                feature.applicable_property_types.set(residential_types)

            action = "Created" if created else "Updated"
            self.stdout.write(f"  {action} Feature {feature.code} ({feature.label})")

        self.stdout.write(self.style.SUCCESS("Real estate feature taxonomy seeded."))
