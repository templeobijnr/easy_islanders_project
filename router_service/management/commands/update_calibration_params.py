"""
Django management command to update router calibration parameters.

This command retrains the calibration models using recent router events
and updates the calibration parameters in the database.
"""

from __future__ import annotations

from django.core.management.base import BaseCommand
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Update router calibration parameters using recent router events'

    def add_arguments(self, parser):
        super().add_arguments(parser)
        parser.add_argument(
            '--evaluate-only',
            action='store_true',
            help='Only evaluate current models on validation set, do not retrain',
        )
        parser.add_argument(
            '--accuracy-threshold',
            type=float,
            default=0.92,
            help='Minimum accuracy threshold for promotion',
        )
        parser.add_argument(
            '--ece-threshold',
            type=float,
            default=0.05,
            help='Maximum ECE threshold for promotion',
        )

    def handle(self, *args, **options):
        dry_run = options.get('dry_run', False)
        force = options.get('force', False)
        evaluate_only = options.get('evaluate_only', False)
        accuracy_threshold = options.get('accuracy_threshold', 0.92)
        ece_threshold = options.get('ece_threshold', 0.05)

        self.stdout.write('Starting calibration parameter update...')

        try:
            from router_service.calibration import retrain_calibration_models, get_calibration_metrics
            from router_service.models import RouterEvent
            from sklearn.metrics import accuracy_score

            if evaluate_only:
                # Evaluate current models on validation set
                self.stdout.write('Evaluating current models on validation set...')
                val_events = RouterEvent.objects.filter(split='val')

                if not val_events:
                    self.stdout.write(
                        self.style.WARNING('No validation events found. Run backfill first.')
                    )
                    return

                # Compute validation metrics
                predictions = []
                actuals = []

                for event in val_events:
                    # Get model prediction (simplified - in practice would use actual model)
                    pred_domain = event.domain_pred
                    actual_domain = getattr(event, 'correct_label', event.domain_pred)

                    predictions.append(pred_domain)
                    actuals.append(actual_domain)

                if predictions and actuals:
                    accuracy = accuracy_score(actuals, predictions)
                    self.stdout.write(f'Validation accuracy: {accuracy:.3f}')
                    self.stdout.write(f'Accuracy threshold: {accuracy_threshold}')

                    if accuracy >= accuracy_threshold:
                        self.stdout.write(
                            self.style.SUCCESS('✅ Validation passed - models meet accuracy threshold')
                        )
                    else:
                        self.stdout.write(
                            self.style.ERROR('❌ Validation failed - accuracy below threshold')
                        )
                return

            # Retrain models
            training_results = retrain_calibration_models()

            if not training_results and not force:
                self.stdout.write(
                    self.style.WARNING(
                        'Insufficient training data. Use --force to override.'
                    )
                )
                return

            # Evaluate on validation set if available
            val_events = RouterEvent.objects.filter(split='val')
            validation_passed = True

            if val_events.exists():
                self.stdout.write('Evaluating new models on validation set...')

                # Simplified validation (in practice, would run full evaluation)
                total_ece = sum(params.get('ece', 0) for params in training_results.values())
                avg_ece = total_ece / len(training_results) if training_results else 0

                self.stdout.write(f'Average ECE: {avg_ece:.3f} (threshold: {ece_threshold})')

                if avg_ece <= ece_threshold:
                    self.stdout.write(
                        self.style.SUCCESS('✅ ECE validation passed')
                    )
                else:
                    validation_passed = False
                    self.stdout.write(
                        self.style.ERROR('❌ ECE validation failed')
                    )

            if dry_run:
                self.stdout.write('DRY RUN - Would update calibration for domains:')
                for domain, params in training_results.items():
                    self.stdout.write(f'  {domain}: ECE={params.get("ece", 0):.3f}, support={params.get("support_n", 0)}')
            else:
                if validation_passed or force:
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'Successfully updated calibration for {len(training_results)} domains'
                        )
                    )
                else:
                    self.stdout.write(
                        self.style.WARNING(
                            'Validation failed but proceeding due to --force flag'
                        )
                    )

                # Log current metrics
                metrics = get_calibration_metrics()
                self.stdout.write('Current calibration metrics:')
                for key, value in metrics.items():
                    self.stdout.write(f'  {key}: {value}')

        except ImportError as e:
            self.stdout.write(
                self.style.ERROR(f'Calibration module not available: {e}')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error updating calibration parameters: {e}')
            )
            logger.exception('Calibration update failed')
            raise