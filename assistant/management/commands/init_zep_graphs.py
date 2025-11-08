"""
Django Management Command: Initialize Zep Graph Memory

Creates and populates the system graph with:
- Location entities (cities, districts)
- Amenity entities (features, facilities)
- Existing listings from Django database
- Location hierarchies and relationships

Usage:
    python3 manage.py init_zep_graphs
    python3 manage.py init_zep_graphs --reset  # Clear and rebuild
    python3 manage.py init_zep_graphs --skip-listings  # Only seed reference data
"""

import os
import yaml
import logging
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime

from django.core.management.base import BaseCommand, CommandError
from django.db import connection

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Initialize Zep Graph memory with system graph and seed data"

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete existing system graph and recreate from scratch",
        )
        parser.add_argument(
            "--skip-listings",
            action="store_true",
            help="Skip ingesting Django listings (only seed reference data)",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=None,
            help="Limit number of listings to ingest (for testing)",
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING("🌍 Initializing Zep Graph Memory"))

        # Import GraphManager
        try:
            from assistant.memory.graph_manager import GraphManager
        except ImportError as e:
            raise CommandError(f"Failed to import GraphManager: {e}")

        # Load schema definitions
        schema_path = Path(__file__).parent.parent.parent / "memory" / "graph_schemas.yaml"
        if not schema_path.exists():
            raise CommandError(f"Schema file not found: {schema_path}")

        with open(schema_path, "r") as f:
            schemas = yaml.safe_load(f)

        # Initialize GraphManager
        try:
            graph_mgr = GraphManager()
            self.stdout.write(self.style.SUCCESS("✓ GraphManager initialized"))
        except Exception as e:
            raise CommandError(f"Failed to initialize GraphManager: {e}")

        # Step 1: Create system graph
        self._create_system_graph(graph_mgr, schemas, reset=options["reset"])

        # Step 2: Ingest seed data (locations, amenities)
        self._ingest_seed_data(graph_mgr, schemas)

        # Step 3: Ingest existing listings (optional)
        if not options["skip_listings"]:
            self._ingest_listings(graph_mgr, limit=options["limit"])

        self.stdout.write(
            self.style.SUCCESS("\n🎉 Zep Graph initialization complete!")
        )

    # ========================================================================
    # Graph Creation
    # ========================================================================

    def _create_system_graph(
        self,
        graph_mgr: "GraphManager",
        schemas: Dict[str, Any],
        reset: bool = False
    ):
        """Create the system graph (real_estate_system)."""
        system_schema = schemas.get("system_graph", {})
        graph_id = system_schema.get("graph_id", "real_estate_system")
        name = system_schema.get("name", "Real Estate System Graph")
        description = system_schema.get("description", "")

        self.stdout.write(f"\n📊 System Graph: {graph_id}")

        if reset:
            self.stdout.write(self.style.WARNING("  ⚠️  Reset mode - would delete existing graph"))
            self.stdout.write(self.style.WARNING("  (Deletion not implemented - manually clear via Zep UI if needed)"))

        try:
            # Attempt to create graph (will fail if exists)
            graph_mgr.create_graph(
                graph_id=graph_id,
                name=name,
                description=description
            )
            self.stdout.write(self.style.SUCCESS(f"  ✓ Created system graph '{graph_id}'"))
        except Exception as e:
            if "already exists" in str(e).lower() or "duplicate" in str(e).lower():
                self.stdout.write(self.style.WARNING(f"  ⚠️  Graph '{graph_id}' already exists (continuing)"))
            else:
                self.stdout.write(self.style.ERROR(f"  ✗ Failed to create graph: {e}"))
                raise

    # ========================================================================
    # Seed Data Ingestion
    # ========================================================================

    def _ingest_seed_data(
        self,
        graph_mgr: "GraphManager",
        schemas: Dict[str, Any]
    ):
        """Ingest seed data from schemas (locations, amenities)."""
        seed_data = schemas.get("seed_data", {})
        graph_id = schemas["system_graph"]["graph_id"]

        self.stdout.write("\n🌱 Ingesting Seed Data")

        # Ingest locations
        locations = seed_data.get("locations", [])
        self.stdout.write(f"  📍 Locations: {len(locations)}")

        for loc in locations:
            try:
                # Create location node
                graph_mgr.add_episode(
                    graph_id=graph_id,
                    type="json",
                    data={
                        "type": "Location",
                        "name": loc["name"],
                        "location_type": loc["type"],
                        "description": loc.get("description", ""),
                        "synonyms": loc.get("synonyms", [])
                    },
                    source_description=f"Seed location: {loc['name']}"
                )

                # Create synonym mappings as facts
                for synonym in loc.get("synonyms", []):
                    graph_mgr.add_fact_triplet(
                        graph_id=graph_id,
                        source_node_name=synonym,
                        target_node_name=loc["name"],
                        fact="is_synonym_of",
                        fact_name=f"{synonym} is synonym of {loc['name']}"
                    )

                self.stdout.write(f"    ✓ {loc['name']} ({loc['type']})")
            except Exception as e:
                self.stdout.write(
                    self.style.WARNING(f"    ⚠️  Failed to add {loc['name']}: {e}")
                )

        # Ingest amenities
        amenities = seed_data.get("amenities", {})
        total_amenities = sum(len(v) for v in amenities.values())
        self.stdout.write(f"  🏠 Amenities: {total_amenities}")

        for category, amenity_list in amenities.items():
            for amenity in amenity_list:
                try:
                    graph_mgr.add_episode(
                        graph_id=graph_id,
                        type="json",
                        data={
                            "type": "Amenity",
                            "name": amenity,
                            "category": category
                        },
                        source_description=f"Seed amenity: {amenity}"
                    )
                except Exception as e:
                    self.stdout.write(
                        self.style.WARNING(f"    ⚠️  Failed to add {amenity}: {e}")
                    )

        self.stdout.write(self.style.SUCCESS(f"  ✓ Seed data ingestion complete"))

    # ========================================================================
    # Listing Ingestion
    # ========================================================================

    def _ingest_listings(
        self,
        graph_mgr: "GraphManager",
        limit: Optional[int] = None
    ):
        """Ingest active listings from Django database."""
        self.stdout.write("\n🏘️  Ingesting Listings from Django Database")

        # Import Listing model (lazy import to avoid circular dependencies)
        try:
            from listings.models import Listing
        except ImportError:
            self.stdout.write(
                self.style.WARNING("  ⚠️  Listing model not found - skipping")
            )
            return

        # Query active listings
        queryset = Listing.objects.filter(is_active=True)
        if limit:
            queryset = queryset[:limit]

        total = queryset.count()
        self.stdout.write(f"  Found {total} active listings")

        if total == 0:
            self.stdout.write(self.style.WARNING("  ⚠️  No listings to ingest"))
            return

        graph_id = "real_estate_system"
        success_count = 0
        error_count = 0

        for listing in queryset.iterator():
            try:
                # Add listing as episode
                graph_mgr.add_episode(
                    graph_id=graph_id,
                    type="json",
                    data={
                        "type": "Listing",
                        "listing_id": listing.id,
                        "title": listing.title,
                        "listing_type": listing.listing_type,
                        "rental_type": getattr(listing, "rental_type", None),
                        "price": float(listing.price) if listing.price else None,
                        "currency": getattr(listing, "currency", "GBP"),
                        "bedrooms": listing.bedrooms,
                        "bathrooms": getattr(listing, "bathrooms", None),
                        "property_type": getattr(listing, "property_type", None),
                        "is_active": listing.is_active,
                        "created_at": listing.created_at.isoformat() if hasattr(listing, "created_at") else None,
                    },
                    source_description=f"Listing {listing.id}: {listing.title}"
                )

                # Add location relationship if available
                location = getattr(listing, "location", None) or getattr(listing, "city", None)
                if location:
                    graph_mgr.add_fact_triplet(
                        graph_id=graph_id,
                        source_node_name=f"Listing_{listing.id}",
                        target_node_name=str(location),
                        fact="located_in",
                        fact_name=f"Listing {listing.id} located in {location}"
                    )

                success_count += 1

                # Progress indicator
                if success_count % 50 == 0:
                    self.stdout.write(f"    ... {success_count}/{total} ingested")

            except Exception as e:
                error_count += 1
                logger.warning(f"Failed to ingest listing {listing.id}: {e}")

        self.stdout.write(
            self.style.SUCCESS(
                f"  ✓ Ingested {success_count} listings ({error_count} errors)"
            )
        )

    # ========================================================================
    # Helper Methods
    # ========================================================================

    def _check_zep_connection(self, graph_mgr: "GraphManager") -> bool:
        """Test connection to Zep API."""
        try:
            # Simple test - attempt to search system graph
            graph_mgr.search_graph(
                graph_id="real_estate_system",
                query="test",
                limit=1
            )
            return True
        except Exception as e:
            logger.error(f"Zep connection check failed: {e}")
            return False
