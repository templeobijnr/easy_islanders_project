#!/usr/bin/env python3
"""
Train domain classifier for router.

Usage:
    python scripts/train_domain_classifier.py /path/to/router_events.parquet /path/to/output_dir/
"""

from __future__ import annotations

import json
import pickle
from pathlib import Path
from typing import Dict, Any, Tuple
import sys

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix

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


def load_data(parquet_path: str) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Load and split training data."""
    df = pd.read_parquet(parquet_path)

    # Filter to labeled data
    labeled_df = df[df['domain_label'].notna() & (df['domain_label'] != '')].copy()

    # Split into train/val/test (70/20/10)
    train_df, temp_df = train_test_split(
        labeled_df, test_size=0.3, random_state=42, stratify=labeled_df['domain_label']
    )
    val_df, test_df = train_test_split(
        temp_df, test_size=1/3, random_state=42, stratify=temp_df['domain_label']
    )

    return train_df, val_df, test_df


def extract_features(texts: pd.Series, tfidf=None, fit=True) -> Tuple[np.ndarray, TfidfVectorizer]:
    """Extract features from text using TF-IDF + custom features."""
    if fit:
        # TF-IDF features
        tfidf = TfidfVectorizer(max_features=1000, ngram_range=(1, 2), stop_words='english')
        tfidf_features = tfidf.fit_transform(texts).toarray()
    else:
        tfidf_features = tfidf.transform(texts).toarray()

    # Custom rule-based features
    custom_features = []
    for text in texts:
        custom_features.append(_extract_features(text))

    custom_features = np.array(custom_features)

    # Combine features
    combined = np.hstack([tfidf_features, custom_features])

    return combined, tfidf


def train_classifier(X_train: np.ndarray, y_train: np.ndarray) -> LogisticRegression:
    """Train logistic regression classifier."""
    clf = LogisticRegression(
        random_state=42,
        max_iter=1000,
        class_weight='balanced'
    )
    clf.fit(X_train, y_train)
    return clf


def evaluate_classifier(
    clf: LogisticRegression,
    X: np.ndarray,
    y: np.ndarray,
    dataset_name: str
) -> Dict[str, Any]:
    """Evaluate classifier performance."""
    y_pred = clf.predict(X)
    y_proba = clf.predict_proba(X)

    # Classification report
    report = classification_report(y, y_pred, output_dict=True)

    # Confusion matrix
    cm = confusion_matrix(y, y_pred)

    # ECE calculation (simplified)
    ece = 0.0
    n_bins = 10
    for i in range(len(y)):
        pred_class_idx = np.argmax(y_proba[i])
        pred_prob = y_proba[i][pred_class_idx]
        correct = (pred_class_idx == y[i])

        bin_idx = min(int(pred_prob * n_bins), n_bins - 1)
        # Simplified ECE - in practice you'd accumulate per bin
        ece += abs(pred_prob - float(correct))

    ece /= len(y)

    results = {
        'dataset': dataset_name,
        'accuracy': report['accuracy'],
        'macro_f1': report['macro avg']['f1-score'],
        'ece': ece,
        'confusion_matrix': cm.tolist(),
        'classification_report': report,
    }

    return results


def save_model(clf: LogisticRegression, tfidf: TfidfVectorizer, output_dir: Path) -> None:
    """Save trained model and vectorizer."""
    output_dir.mkdir(parents=True, exist_ok=True)

    # Save classifier
    with open(output_dir / 'domain_classifier.pkl', 'wb') as f:
        pickle.dump(clf, f)

    # Save TF-IDF vectorizer
    with open(output_dir / 'tfidf_vectorizer.pkl', 'wb') as f:
        pickle.dump(tfidf, f)

    # Save model metadata
    metadata = {
        'classes': clf.classes_.tolist(),
        'feature_names': ['tfidf'] * 1000 + ['custom'] * 8,  # Approximate
        'n_features': clf.n_features_in_,
        'training_timestamp': pd.Timestamp.now().isoformat(),
    }

    with open(output_dir / 'model_metadata.json', 'w') as f:
        json.dump(metadata, f, indent=2)


def main():
    if len(sys.argv) != 3:
        print("Usage: python scripts/train_domain_classifier.py <input.parquet> <output_dir>")
        sys.exit(1)

    input_path = sys.argv[1]
    output_dir = Path(sys.argv[2])

    print(f"Loading data from {input_path}")
    train_df, val_df, test_df = load_data(input_path)

    print(f"Train: {len(train_df)}, Val: {len(val_df)}, Test: {len(test_df)}")

    # Extract features
    print("Extracting features...")
    X_train, tfidf = extract_features(train_df['text'])
    X_val, _ = extract_features(val_df['text'], tfidf, fit=False)
    X_test, _ = extract_features(test_df['text'], tfidf, fit=False)

    # Get labels
    y_train = train_df['domain_label'].values
    y_val = val_df['domain_label'].values
    y_test = test_df['domain_label'].values

    # Train classifier
    print("Training classifier...")
    clf = train_classifier(X_train, y_train)

    # Evaluate
    print("Evaluating...")
    train_results = evaluate_classifier(clf, X_train, y_train, 'train')
    val_results = evaluate_classifier(clf, X_val, y_val, 'validation')
    test_results = evaluate_classifier(clf, X_test, y_test, 'test')

    # Print results
    print("\nResults:")
    for results in [train_results, val_results, test_results]:
        print(f"{results['dataset'].capitalize()}:")
        print(".3f")
        print(".3f")
        print(".3f")
        print()

    # Save model
    print(f"Saving model to {output_dir}")
    save_model(clf, tfidf, output_dir)

    # Save evaluation results
    eval_results = {
        'train': train_results,
        'validation': val_results,
        'test': test_results,
    }

    with open(output_dir / 'evaluation_results.json', 'w') as f:
        json.dump(eval_results, f, indent=2)

    print("Training complete!")


if __name__ == '__main__':
    main()