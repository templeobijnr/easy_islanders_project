"""
Router calibration module for Sprint 5.

Provides supervised classification and probability calibration for domain routing.
Uses scikit-learn for logistic regression classifier and Platt/Isotonic scaling.
"""

from __future__ import annotations

import json
import logging
from typing import Dict, List, Optional, Tuple, Any
import numpy as np

try:
    from sklearn.linear_model import LogisticRegression
    from sklearn.isotonic import IsotonicRegression
    from sklearn.metrics import brier_score_loss
    _SKLEARN_AVAILABLE = True
except ImportError:
    _SKLEARN_AVAILABLE = False
    LogisticRegression = None
    IsotonicRegression = None

from django.core.cache import cache
from django.conf import settings

from .models import CalibrationParams, RouterEvent

logger = logging.getLogger(__name__)

# Default domains for routing
DOMAINS = ['real_estate', 'marketplace', 'local_info', 'general_conversation']

# Cache key for calibration models
CALIBRATION_CACHE_KEY = "router_calibration_models"
CALIBRATION_CACHE_TIMEOUT = 3600  # 1 hour


def _compute_ece(y_true: np.ndarray, y_prob: np.ndarray, n_bins: int = 10) -> float:
    """Compute Expected Calibration Error (ECE)."""
    if not _SKLEARN_AVAILABLE:
        return 0.0

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


class DomainClassifier:
    """Supervised classifier for domain routing with calibration."""

    def __init__(self, domain: str):
        self.domain = domain
        self.classifier = None
        self.calibrator = None
        self.method = "platt"
        self.ece = 0.0
        self.support_n = 0

    def fit(self, X: np.ndarray, y: np.ndarray) -> None:
        """Fit classifier and calibrator on training data."""
        if not _SKLEARN_AVAILABLE:
            logger.warning("scikit-learn not available, skipping classifier training")
            return

        # Fit logistic regression classifier
        self.classifier = LogisticRegression(random_state=42, max_iter=1000)
        self.classifier.fit(X, y)

        # Get raw probabilities for calibration
        raw_probs = self.classifier.predict_proba(X)[:, 1]

        # Fit Platt scaling (logistic calibration)
        self.calibrator = LogisticRegression(random_state=42, max_iter=1000)
        self.calibrator.fit(raw_probs.reshape(-1, 1), y)

        # Compute ECE
        calibrated_probs = self.calibrator.predict_proba(raw_probs.reshape(-1, 1))[:, 1]
        self.ece = _compute_ece(y, calibrated_probs)
        self.support_n = len(y)

    def predict_proba(self, X: np.ndarray) -> float:
        """Predict calibrated probability for domain membership."""
        if not self.classifier or not self.calibrator:
            return 0.5  # Default neutral probability

        # Get raw classifier probability
        raw_prob = self.classifier.predict_proba(X.reshape(1, -1))[0, 1]

        # Apply calibration
        calibrated_prob = self.calibrator.predict_proba(np.array([[raw_prob]]))[0, 1]

        return float(calibrated_prob)

    def to_dict(self) -> Dict[str, Any]:
        """Serialize model to dictionary."""
        if not self.classifier or not self.calibrator:
            return {}

        return {
            'domain': self.domain,
            'method': self.method,
            'classifier_coef': self.classifier.coef_.tolist(),
            'classifier_intercept': self.classifier.intercept_.tolist(),
            'calibrator_coef': self.calibrator.coef_.tolist(),
            'calibrator_intercept': self.calibrator.intercept_.tolist(),
            'ece': self.ece,
            'support_n': self.support_n,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'DomainClassifier':
        """Deserialize model from dictionary."""
        if not _SKLEARN_AVAILABLE or not data:
            return cls(data.get('domain', 'unknown'))

        instance = cls(data['domain'])
        instance.method = data.get('method', 'platt')
        instance.ece = data.get('ece', 0.0)
        instance.support_n = data.get('support_n', 0)

        # Reconstruct classifier
        instance.classifier = LogisticRegression(random_state=42)
        instance.classifier.coef_ = np.array(data['classifier_coef'])
        instance.classifier.intercept_ = np.array(data['classifier_intercept'])

        # Reconstruct calibrator
        instance.calibrator = LogisticRegression(random_state=42)
        instance.calibrator.coef_ = np.array(data['calibrator_coef'])
        instance.calibrator.intercept_ = np.array(data['calibrator_intercept'])

        return instance


def _extract_features(text: str, geo_region: str = '', language: str = 'en', user_role: str = '') -> np.ndarray:
    """Extract features from text and context for classification."""
    # Simple bag-of-words style features
    features = []

    # Rule-based features (same as current router)
    t = text.lower()
    features.extend([
        int(any(k in t for k in ['apartment', 'villa', 'rent', 'property'])),  # real_estate
        int(any(k in t for k in ['car', 'vehicle', 'auto', 'electronics'])),  # marketplace
        int(any(k in t for k in ['pharmacy', 'hospital', 'doctor'])),  # local_info
    ])

    # Length-based features
    features.extend([
        len(text.split()),  # word count
        len(text),  # character count
        text.count('?'),  # question marks
    ])

    # Geographic features (one-hot encoded)
    geo_features = [
        int(geo_region.lower() in ['cy', 'cyprus', 'nicosia', 'kyrenia', 'famagusta']),
        int(geo_region.lower() in ['tr', 'turkey', 'istanbul', 'ankara']),
        int(geo_region.lower() in ['gb', 'uk', 'london', 'manchester']),
    ]
    features.extend(geo_features)

    # Language features (one-hot encoded)
    lang_features = [
        int(language.lower() in ['en', 'english']),
        int(language.lower() in ['tr', 'turkish']),
        int(language.lower() in ['ru', 'russian']),
    ]
    features.extend(lang_features)

    # User role features (one-hot encoded)
    role_features = [
        int(user_role.lower() in ['buyer', 'renter', 'customer']),
        int(user_role.lower() in ['seller', 'owner', 'agent']),
        int(user_role.lower() in ['admin', 'moderator']),
    ]
    features.extend(role_features)

    return np.array(features)


def load_calibration_models() -> Dict[str, DomainClassifier]:
    """Load calibrated models from cache or database."""
    # Try cache first
    cached = cache.get(CALIBRATION_CACHE_KEY)
    if cached:
        models = {}
        for domain, data in cached.items():
            models[domain] = DomainClassifier.from_dict(data)
        return models

    # Load from database
    models = {}
    for params in CalibrationParams.objects.all():
        models[params.model_name] = DomainClassifier.from_dict({
            'domain': params.model_name,
            'method': params.method,
            **params.params
        })

    # Cache the models
    cache_data = {domain: model.to_dict() for domain, model in models.items()}
    cache.set(CALIBRATION_CACHE_KEY, cache_data, CALIBRATION_CACHE_TIMEOUT)

    return models


def get_calibrated_probabilities(text: str, geo_region: str = '', language: str = 'en', user_role: str = '') -> Dict[str, float]:
    """Get calibrated probabilities for all domains."""
    models = load_calibration_models()
    features = _extract_features(text, geo_region, language, user_role)

    probs = {}
    for domain in DOMAINS:
        model = models.get(domain)
        if model:
            probs[domain] = model.predict_proba(features)
        else:
            probs[domain] = 0.5  # Default neutral

    return probs


def retrain_calibration_models() -> Dict[str, Dict[str, Any]]:
    """Retrain calibration models using recent router events."""
    if not _SKLEARN_AVAILABLE:
        logger.warning("scikit-learn not available, skipping retraining")
        return {}

    # Get recent router events for training
    recent_events = RouterEvent.objects.filter(
        domain_pred__in=DOMAINS
    ).order_by('-created_at')[:1000]  # Last 1000 events

    if len(recent_events) < 50:
        logger.info("Insufficient training data (%d events), skipping retraining", len(recent_events))
        return {}

    training_data = {}
    for domain in DOMAINS:
        domain_events = [e for e in recent_events if e.domain_pred == domain]
        if len(domain_events) < 10:
            continue

        X = []
        y = []
        for event in domain_events:
            # Extract context features
            geo_region = event.context_hint.get('geo_region', '') if event.context_hint else ''
            language = event.context_hint.get('language', 'en') if event.context_hint else 'en'
            user_role = event.context_hint.get('user_role', '') if event.context_hint else ''

            features = _extract_features(event.utterance, geo_region, language, user_role)
            X.append(features)
            # Use confidence as proxy for correctness (simplified)
            y.append(1 if event.domain_conf > 0.7 else 0)

        X = np.array(X)
        y = np.array(y)

        classifier = DomainClassifier(domain)
        classifier.fit(X, y)

        training_data[domain] = classifier.to_dict()

        # Save to database
        CalibrationParams.objects.update_or_create(
            model_name=domain,
            defaults={
                'method': classifier.method,
                'params': classifier.to_dict(),
            }
        )

    # Clear cache to force reload
    cache.delete(CALIBRATION_CACHE_KEY)

    logger.info("Retrained calibration models for %d domains", len(training_data))
    return training_data


def get_calibration_metrics() -> Dict[str, Any]:
    """Get current calibration metrics for monitoring."""
    models = load_calibration_models()
    metrics = {}

    for domain, model in models.items():
        metrics[f"{domain}_ece"] = model.ece
        metrics[f"{domain}_support_n"] = model.support_n

    # Overall metrics
    if models:
        metrics["overall_avg_ece"] = np.mean([m.ece for m in models.values()])
        metrics["overall_total_support"] = sum(m.support_n for m in models.values())

    return metrics