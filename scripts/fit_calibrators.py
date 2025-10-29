#!/usr/bin/env python3
"""
Fit temperature scalers for router domain classification.

Usage:
    python scripts/fit_calibrators.py /path/to/router_events.parquet /path/to/classifier_dir/
"""

from __future__ import annotations

import json
import pickle
from pathlib import Path
from typing import Dict, Any, Tuple
import sys

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression

# Add project root to path
project_root = Path(__file__).resolve().parents[1]
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

# Configure Django settings
import os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "easy_islanders.settings.development")

import django
django.setup()

from router_service.calibration import _extract_features
from router_service.models import CalibrationParams


def load_data(parquet_path: str) -> pd.DataFrame:
    """Load training data."""
    df = pd.read_parquet(parquet_path)
    labeled_df = df[df['domain_label'].notna() & (df['domain_label'] != '')].copy()
    return labeled_df


def load_classifier(model_dir: Path) -> Tuple[LogisticRegression, Any]:
    """Load trained classifier and vectorizer."""
    with open(model_dir / 'domain_classifier.pkl', 'rb') as f:
        clf = pickle.load(f)

    with open(model_dir / 'tfidf_vectorizer.pkl', 'rb') as f:
        tfidf = pickle.load(f)

    return clf, tfidf


def extract_features(texts: pd.Series, tfidf) -> np.ndarray:
    """Extract features using pre-fitted vectorizer."""
    tfidf_features = tfidf.transform(texts).toarray()

    custom_features = []
    for text in texts:
        custom_features.append(_extract_features(text))

    custom_features = np.array(custom_features)
    combined = np.hstack([tfidf_features, custom_features])

    return combined


def fit_temperature_scaler(probs: np.ndarray, labels: np.ndarray) -> LogisticRegression:
    """Fit temperature scaling calibrator."""
    # Convert to binary classification for each domain
    domains = np.unique(labels)
    scalers = {}

    for domain in domains:
        binary_labels = (labels == domain).astype(int)
        domain_probs = probs[:, list(domains).index(domain)]

        # Fit logistic regression (Platt scaling)
        scaler = LogisticRegression(random_state=42)
        scaler.fit(domain_probs.reshape(-1, 1), binary_labels)

        scalers[domain] = scaler

    return scalers


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


def evaluate_calibrators(scalers: Dict[str, LogisticRegression], X: np.ndarray, y: np.ndarray, clf: LogisticRegression) -> Dict[str, Any]:
    """Evaluate calibration performance."""
    raw_probs = clf.predict_proba(X)

    results = {}
    for domain, scaler in scalers.items():
        domain_idx = list(clf.classes_).index(domain)
        domain_raw_probs = raw_probs[:, domain_idx]

        # Apply calibration
        calibrated_probs = scaler.predict_proba(domain_raw_probs.reshape(-1, 1))[:, 1]

        # Compute ECE
        binary_labels = (y == domain).astype(int)
        ece = compute_ece(binary_labels, calibrated_probs)

        results[domain] = {
            'ece': ece,
            'support': len(binary_labels),
            'params': {
                'coef': scaler.coef_.tolist(),
                'intercept': scaler.intercept_.tolist(),
            }
        }

    return results


def save_calibrators_to_db(calibrators: Dict[str, Any]) -> None:
    """Save calibrators to database."""
    for domain, data in calibrators.items():
        CalibrationParams.objects.update_or_create(
            domain=domain,
            defaults={
                'method': 'temperature',
                'params': data['params'],
                'ece': data['ece'],
                'support_n': data['support'],
                'version': 'v1.0',
            }
        )
        print(f"Saved calibrator for {domain}: ECE={data['ece']:.4f}, support={data['support']}")


def main():
    if len(sys.argv) != 3:
        print("Usage: python scripts/fit_calibrators.py <input.parquet> <classifier_dir>")
        sys.exit(1)

    input_path = sys.argv[1]
    classifier_dir = Path(sys.argv[2])

    print(f"Loading data from {input_path}")
    df = load_data(input_path)

    print(f"Loading classifier from {classifier_dir}")
    clf, tfidf = load_classifier(classifier_dir)

    # Split for calibration fitting (use validation set)
    train_df, temp_df = train_test_split(df, test_size=0.3, random_state=42, stratify=df['domain_label'])
    val_df, test_df = train_test_split(temp_df, test_size=1/3, random_state=42, stratify=temp_df['domain_label'])

    print(f"Using validation set: {len(val_df)} samples")

    # Extract features
    X_val = extract_features(val_df['text'], tfidf)
    y_val = val_df['domain_label'].values

    # Fit calibrators
    print("Fitting temperature scalers...")
    raw_probs = clf.predict_proba(X_val)
    scalers = fit_temperature_scaler(raw_probs, y_val)

    # Evaluate calibrators
    print("Evaluating calibrators...")
    eval_results = evaluate_calibrators(scalers, X_val, y_val, clf)

    # Save to database
    print("Saving calibrators to database...")
    save_calibrators_to_db(eval_results)

    # Print summary
    print("\nCalibration Results:")
    total_ece = 0
    total_support = 0
    for domain, results in eval_results.items():
        print(f"{domain}: ECE={results['ece']:.4f}, support={results['support']}")
        total_ece += results['ece'] * results['support']
        total_support += results['support']

    avg_ece = total_ece / total_support if total_support > 0 else 0
    print(".4f")

    print("Calibration fitting complete!")


if __name__ == '__main__':
    main()