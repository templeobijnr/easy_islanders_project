"""
Django management command to export RouterEvents for training data.

Exports anonymized router events to Parquet format for ML training.
Includes PII scrubbing and optional synthetic data generation.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta, timezone

from django.core.management.base import BaseCommand
from django.db.models import Q
from django.conf import settings

try:
    import pandas as pd
    import pyarrow as pa
    import pyarrow.parquet as pq
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False

from router_service.models import RouterEvent


class Command(BaseCommand):
    help = 'Export RouterEvents to Parquet for ML training'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='Number of days of historical data to export',
        )
        parser.add_argument(
            '--out',
            type=str,
            required=True,
            help='Output Parquet file path',
        )
        parser.add_argument(
            '--min-samples',
            type=int,
            default=1000,
            help='Minimum samples per domain (pad with synthetic if needed)',
        )
        parser.add_argument(
            '--synthetic-ratio',
            type=float,
            default=0.3,
            help='Ratio of synthetic to real data (0.0 to 1.0)',
        )
        parser.add_argument(
            '--locales',
            nargs='+',
            default=['en', 'tr', 'ru'],
            help='Locales to include in synthetic data',
        )

    def handle(self, *args, **options):
        if not PANDAS_AVAILABLE:
            self.stdout.write(
                self.style.ERROR('pandas and pyarrow required: pip install pandas pyarrow')
            )
            return

        days = options['days']
        output_path = Path(options['out'])
        min_samples = options['min_samples']
        synthetic_ratio = options['synthetic_ratio']
        locales = options['locales']

        self.stdout.write(f'Exporting RouterEvents for last {days} days...')

        # Calculate date range
        end_date = datetime.now(timezone.utc)
        start_date = end_date - timedelta(days=days)

        # Query real events
        real_events = RouterEvent.objects.filter(
            created_at__gte=start_date,
            created_at__lte=end_date
        ).order_by('created_at')

        self.stdout.write(f'Found {real_events.count()} real events')

        # Convert to DataFrame
        real_data = []
        for event in real_events.iterator():
            real_data.append({
                'ts': event.created_at.isoformat(),
                'text': self._scrub_pii(event.utterance),
                'domain_label': event.domain_pred or '',
                'predicted_domain': event.domain_pred or '',
                'proba_json': json.dumps({}),  # Empty for real events
                'locale': 'en',  # Default, could be inferred
                'geo_region': 'cy',  # Cyprus default
                'user_role': 'user',
                'tenant_hash': self._hash_tenant('default'),
                'is_synthetic': False,
            })

        real_df = pd.DataFrame(real_data)

        # Generate synthetic data if needed
        synthetic_df = self._generate_synthetic_data(
            real_df, min_samples, synthetic_ratio, locales
        )

        # Combine datasets
        combined_df = pd.concat([real_df, synthetic_df], ignore_index=True)

        # Balance classes
        balanced_df = self._balance_classes(combined_df, min_samples)

        # Write to Parquet
        output_path.parent.mkdir(parents=True, exist_ok=True)

        table = pa.Table.from_pandas(balanced_df)
        pq.write_table(table, output_path)

        self.stdout.write(
            self.style.SUCCESS(
                f'Exported {len(balanced_df)} events to {output_path}'
            )
        )

        # Print statistics
        self._print_stats(balanced_df)

    def _scrub_pii(self, text: str) -> str:
        """Remove or hash PII from text."""
        # Simple PII scrubbing - in production, use more sophisticated rules
        import re

        # Remove email-like patterns
        text = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[EMAIL]', text)

        # Remove phone-like patterns
        text = re.sub(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', '[PHONE]', text)

        # Hash potential names (simple heuristic)
        words = text.split()
        scrubbed_words = []
        for word in words:
            if len(word) > 2 and word[0].isupper() and word.isalpha():
                # Potential name - hash it
                scrubbed_words.append(f'[NAME_{hash(word) % 1000}]')
            else:
                scrubbed_words.append(word)

        return ' '.join(scrubbed_words)

    def _hash_tenant(self, tenant: str) -> str:
        """Hash tenant identifier for privacy."""
        import hashlib
        return hashlib.sha256(tenant.encode()).hexdigest()[:16]

    def _generate_synthetic_data(
        self,
        real_df: pd.DataFrame,
        min_samples: int,
        synthetic_ratio: float,
        locales: List[str]
    ) -> pd.DataFrame:
        """Generate synthetic training data."""
        synthetic_data = []

        # Domain-specific templates
        templates = {
            'real_estate': [
                '2 bed apartment in {city}',
                'looking for villa to rent in {area}',
                'house for sale {price} euros',
                'find property in {location}',
                '{bedrooms} bedroom apartment',
                'real estate in {city}',
            ],
            'marketplace': [
                'used {item} for sale',
                'buy {brand} {product}',
                'selling my {item} {price}',
                '{item} second hand',
                'looking for {product}',
                'marketplace {category}',
            ],
            'local_info': [
                '{service} near me',
                'find {place} in {city}',
                '{medical} appointment',
                'emergency {service}',
                '{business} in {area}',
                'local {service} number',
            ],
            'general_conversation': [
                'hello',
                'hi there',
                'good morning',
                'how are you',
                'what can you help me with',
                'thank you',
            ],
        }

        # Fill values for templates
        cities = ['nicosia', 'kyrenia', 'famagusta', 'limassol', 'larnaca', 'paphos']
        areas = ['north', 'south', 'center', 'coast', 'mountains']
        items = ['car', 'phone', 'laptop', 'furniture', 'clothes']
        brands = ['apple', 'samsung', 'bmw', 'toyota']
        products = ['phone', 'car', 'laptop', 'watch']
        services = ['pharmacy', 'hospital', 'doctor', 'restaurant', 'bank']
        places = ['pharmacy', 'hospital', 'restaurant', 'bank', 'school']
        medical = ['doctor', 'dentist', 'clinic']
        businesses = ['restaurant', 'cafe', 'shop', 'office']
        categories = ['electronics', 'vehicles', 'furniture', 'clothes']

        # Generate synthetic samples
        target_synthetic = int(len(real_df) * synthetic_ratio)

        for domain, domain_templates in templates.items():
            domain_real_count = len(real_df[real_df['domain_label'] == domain])
            domain_target = max(min_samples, int(domain_real_count * (1 + synthetic_ratio)))

            synthetic_needed = max(0, domain_target - domain_real_count)

            for i in range(synthetic_needed):
                template = domain_templates[i % len(domain_templates)]

                # Fill template
                filled = template.format(
                    city=cities[i % len(cities)],
                    area=areas[i % len(areas)],
                    price=f'{100000 + (i * 50000) % 500000}',
                    bedrooms=str(1 + (i % 4)),
                    location=cities[i % len(cities)],
                    item=items[i % len(items)],
                    brand=brands[i % len(brands)],
                    product=products[i % len(products)],
                    service=services[i % len(services)],
                    place=places[i % len(places)],
                    medical=medical[i % len(medical)],
                    business=businesses[i % len(businesses)],
                    category=categories[i % len(categories)],
                )

                synthetic_data.append({
                    'ts': (datetime.now(timezone.utc) - timedelta(seconds=i)).isoformat(),
                    'text': filled,
                    'domain_label': domain,
                    'predicted_domain': domain,
                    'proba_json': json.dumps({domain: 0.9}),
                    'locale': locales[i % len(locales)],
                    'geo_region': 'cy',
                    'user_role': 'user',
                    'tenant_hash': self._hash_tenant('synthetic'),
                    'is_synthetic': True,
                })

        return pd.DataFrame(synthetic_data)

    def _balance_classes(self, df: pd.DataFrame, min_samples: int) -> pd.DataFrame:
        """Balance classes by oversampling minority classes."""
        balanced_dfs = []

        for domain in df['domain_label'].unique():
            domain_df = df[df['domain_label'] == domain].copy()

            if len(domain_df) < min_samples:
                # Oversample by duplicating
                oversample_count = min_samples - len(domain_df)
                oversample_df = domain_df.sample(
                    n=oversample_count,
                    replace=True,
                    random_state=42
                )
                domain_df = pd.concat([domain_df, oversample_df])

            balanced_dfs.append(domain_df)

        return pd.concat(balanced_dfs, ignore_index=True)

    def _print_stats(self, df: pd.DataFrame) -> None:
        """Print dataset statistics."""
        self.stdout.write('\nDataset Statistics:')
        self.stdout.write(f'Total samples: {len(df)}')
        self.stdout.write(f'Synthetic ratio: {df["is_synthetic"].mean():.2%}')

        self.stdout.write('\nDomain distribution:')
        domain_counts = df['domain_label'].value_counts()
        for domain, count in domain_counts.items():
            pct = count / len(df) * 100
            self.stdout.write(f'  {domain}: {count} ({pct:.1f}%)')

        self.stdout.write('\nLocale distribution:')
        locale_counts = df['locale'].value_counts()
        for locale, count in locale_counts.items():
            pct = count / len(df) * 100
            self.stdout.write(f'  {locale}: {count} ({pct:.1f}%)')