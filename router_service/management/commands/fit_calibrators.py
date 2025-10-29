"""
Django management command to fit per-domain calibration parameters.

Fits temperature scalers for router domain classification and persists via ORM.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, Any
from datetime import datetime
import sys

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

try:
    import numpy as np
    import pandas as pd
    from sklearn.model_selection import train_test_split
    from sklearn.linear_model import LogisticRegression
    from sklearn.metrics import brier_score_loss

    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

from router_service.models import CalibrationParams
from router_service.calibration import _extract_features


def compute_ece(y_true: np.ndarray, y_prob: np.ndarray, n_bins: int = 10) -> float:
    """Compute Expected Calibration Error."""
    bins = np.linspace(0, 1, n_bins + 1)
    ece = 0.0

    for i in range(n_bins):
        bin_mask = (y_prob >= bins[i]) & (y_prob < bins[i + 1])
        if np.sum(bin_mask) > 0:
            bin_acc = np.mean(y_true[bin_mask])
            bin_conf = np.mean(y_prob[bin_mask])
            bin_size = np.sum(bin_mask) / len(y_true)
            ece += bin_size * abs(bin_acc - bin_conf)

    return ece


def fit_temperature_scaler(probs: np.ndarray, labels: np.ndarray, domain: str) -> Dict[str, Any]:
    """Fit temperature scaling calibrator for a single domain."""
    # Convert to binary classification for this domain
    binary_labels = (labels == domain).astype(int)
    domain_probs = probs[:, list(np.unique(labels)).index(domain)]

    # Fit logistic regression (Platt scaling)
    scaler = LogisticRegression(random_state=42)
    scaler.fit(domain_probs.reshape(-1, 1), binary_labels)

    # Apply calibration and compute ECE
    calibrated_probs = scaler.predict_proba(domain_probs.reshape(-1, 1))[:, 1]
    ece = compute_ece(binary_labels, calibrated_probs)

    return {
        't': float(scaler.coef_[0][0]),  # Temperature scaling coefficient
        'intercept': float(scaler.intercept_[0]),
        'ece': ece,
        'support_n': len(binary_labels),
    }


def load_classifier_and_fit(model_dir: Path) -> Any:
    """Load trained classifier from pickle files."""
    import pickle

    clf_path = model_dir / 'domain_classifier.pkl'
    tfidf_path = model_dir / 'tfidf_vectorizer.pkl'

    if not clf_path.exists() or not tfidf_path.exists():
        raise CommandError(f"Classifier files not found in {model_dir}")

    with open(clf_path, 'rb') as f:
        clf = pickle.load(f)

    with open(tfidf_path, 'rb') as f:
        tfidf = pickle.load(f)

    return clf, tfidf


def fit_all_domains(parquet_path: str, model_dir: Path) -> Dict[str, Dict[str, Any]]:
    """Fit calibrators for all domains."""
    if not SKLEARN_AVAILABLE:
        raise CommandError("scikit-learn required for calibration fitting")

    # Load data
    df = pd.read_parquet(parquet_path)
    labeled_df = df[df['domain_label'].notna() & (df['domain_label'] != '')].copy()

    if len(labeled_df) == 0:
        raise CommandError("No labeled data found in parquet file")

    # Load classifier
    clf, tfidf = load_classifier_and_fit(model_dir)

    # Split for calibration fitting (use validation set)
    train_df, temp_df = train_test_split(labeled_df, test_size=0.3, random_state=42, stratify=labeled_df['domain_label'])
    val_df, test_df = train_test_split(temp_df, test_size=1/3, random_state=42, stratify=temp_df['domain_label'])

    # Extract features
    X_val = []
    for text in val_df['text']:
        tfidf_features = tfidf.transform([text]).toarray()
        custom_features = [_extract_features(text)]
        combined = np.hstack([tfidf_features, custom_features])
        X_val.append(combined[0])

    X_val = np.array(X_val)
    y_val = val_df['domain_label'].values

    # Get raw probabilities
    raw_probs = clf.predict_proba(X_val)

    # Fit calibrators for each domain
    results = {}
    domains = np.unique(y_val)

    for domain in domains:
        try:
            domain_result = fit_temperature_scaler(raw_probs, y_val, domain)
            results[domain] = domain_result
        except Exception as e:
            print(f"Warning: Failed to fit calibrator for {domain}: {e}")
            continue

    return results


class Command(BaseCommand):
    help = 'Fit per-domain calibration parameters and persist via ORM'

    def add_arguments(self, parser):
        parser.add_argument(
            '--events',
            required=True,
            help='Path to RouterEvents parquet file'
        )
        parser.add_argument(
            '--clf-dir',
            required=True,
            help='Path to directory containing trained classifier (domain_classifier.pkl, tfidf_vectorizer.pkl)'
        )
        parser.add_argument(
            '--calibration-version',
            default=datetime.utcnow().strftime('%Y%m%d%H%M'),
            help='Version string for this calibration run'
        )

    def handle(self, *args, **options):
        events_path = options['events']
        clf_dir = Path(options['clf_dir'])
        version = options['calibration_version']

        self.stdout.write(f'Fitting calibrators using {events_path} and {clf_dir}')

        # Fit all domain calibrators
        try:
            results = fit_all_domains(events_path, clf_dir)
        except Exception as e:
            raise CommandError(f'Failed to fit calibrators: {e}')

        if not results:
            raise CommandError('No calibration results produced')

        # Persist to database
        with transaction.atomic():
            for domain, params in results.items():
                CalibrationParams.objects.create(
                    domain=domain,
                    method='temperature',
                    params=json.dumps({
                        't': params['t'],
                        'intercept': params['intercept']
                    }),
                    ece=params['ece'],
                    support_n=params['support_n'],
                    version=version,
                    evaluated_on=datetime.utcnow(),
                )
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Created calibrator for {domain}: T={params["t"]:.3f}, '
                        f'ECE={params["ece"]:.4f}, N={params["support_n"]}'
                    )
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully fitted and persisted calibrators for {len(results)} domains'
            )
        )