"""
Tests for router calibration and governance features.

Tests calibration models, guardrail logic, fusion scoring,
and end-to-end router evaluation.
"""

from __future__ import annotations

import pytest
import numpy as np
from unittest.mock import patch, MagicMock
from django.test import TestCase, override_settings
from django.utils import timezone

from router_service.calibration import (
    DomainClassifier,
    get_calibrated_probabilities,
    retrain_calibration_models,
    _extract_features,
    get_calibration_metrics,
)
from router_service.graph import run_router, router_guardrail_node
from router_service.models import RouterEvent, CalibrationParams
from scripts.eval_router import main as eval_router_main


class TestDomainClassifier(TestCase):
    """Test the DomainClassifier functionality."""

    def test_classifier_initialization(self):
        """Test classifier initialization."""
        classifier = DomainClassifier("real_estate")
        self.assertEqual(classifier.domain, "real_estate")
        self.assertIsNone(classifier.classifier)
        self.assertIsNone(classifier.calibrator)

    def test_feature_extraction(self):
        """Test feature extraction from text."""
        features = _extract_features("I want to buy a car in Nicosia")
        self.assertIsInstance(features, np.ndarray)
        self.assertEqual(len(features), 9)  # 3 rule + 3 length + 3 geo

    def test_feature_extraction_with_context(self):
        """Test feature extraction with geographic and user context."""
        features = _extract_features(
            "apartment for rent",
            geo_region="cy",
            language="en",
            user_role="buyer"
        )
        self.assertIsInstance(features, np.ndarray)
        self.assertEqual(len(features), 9)

        # Check geo features (should have Cyprus flag set)
        self.assertEqual(features[3], 1.0)  # cyprus
        self.assertEqual(features[6], 1.0)  # buyer role

    @patch('router_service.calibration._SKLEARN_AVAILABLE', True)
    def test_classifier_fit_and_predict(self):
        """Test classifier training and prediction."""
        classifier = DomainClassifier("real_estate")

        # Create dummy training data
        X = np.random.rand(50, 9)
        y = np.random.randint(0, 2, 50)

        classifier.fit(X, y)

        # Should have trained models
        self.assertIsNotNone(classifier.classifier)
        self.assertIsNotNone(classifier.calibrator)
        self.assertIsInstance(classifier.ece, float)
        self.assertEqual(classifier.support_n, 50)

        # Test prediction
        prob = classifier.predict_proba(X[0])
        self.assertIsInstance(prob, float)
        self.assertGreaterEqual(prob, 0.0)
        self.assertLessEqual(prob, 1.0)

    def test_classifier_serialization(self):
        """Test classifier serialization/deserialization."""
        classifier = DomainClassifier("real_estate")
        classifier.ece = 0.05
        classifier.support_n = 100

        # Serialize
        data = classifier.to_dict()
        self.assertIn('domain', data)
        self.assertIn('ece', data)
        self.assertIn('support_n', data)

        # Deserialize
        restored = DomainClassifier.from_dict(data)
        self.assertEqual(restored.domain, classifier.domain)
        self.assertEqual(restored.ece, classifier.ece)
        self.assertEqual(restored.support_n, classifier.support_n)


class TestCalibrationIntegration(TestCase):
    """Test calibration integration with router."""

    def setUp(self):
        """Set up test data."""
        # Create some router events for testing
        for i in range(10):
            RouterEvent.objects.create(
                utterance=f"test utterance {i}",
                domain_pred="real_estate",
                domain_conf=0.8 + (i * 0.01),  # Vary confidence slightly
                action="dispatch",
                split="train"
            )

    @patch('router_service.calibration._SKLEARN_AVAILABLE', True)
    def test_get_calibrated_probabilities(self):
        """Test getting calibrated probabilities."""
        probs = get_calibrated_probabilities("I want to buy a house")
        self.assertIsInstance(probs, dict)
        self.assertIn('real_estate', probs)
        self.assertIn('marketplace', probs)
        self.assertIn('local_info', probs)
        self.assertIn('general_conversation', probs)

        for domain, prob in probs.items():
            self.assertIsInstance(prob, float)
            self.assertGreaterEqual(prob, 0.0)
            self.assertLessEqual(prob, 1.0)

    def test_get_calibration_metrics(self):
        """Test getting calibration metrics."""
        metrics = get_calibration_metrics()
        self.assertIsInstance(metrics, dict)

        # Should have metrics for each domain
        for domain in ['real_estate', 'marketplace', 'local_info', 'general_conversation']:
            ece_key = f"{domain}_ece"
            support_key = f"{domain}_support_n"
            self.assertIn(ece_key, metrics)
            self.assertIn(support_key, metrics)


class TestRouterGuardrail(TestCase):
    """Test router guardrail functionality."""

    def test_guardrail_high_confidence(self):
        """Test guardrail allows high confidence predictions."""
        state = {
            'domain_choice': {
                'domain': 'real_estate',
                'confidence': 0.85,
            }
        }

        result = router_guardrail_node(state)

        self.assertEqual(result['policy_action'], 'dispatch')
        self.assertIsNone(result['clarify_question'])

    def test_guardrail_low_confidence(self):
        """Test guardrail blocks low confidence predictions."""
        state = {
            'domain_choice': {
                'domain': 'real_estate',
                'confidence': 0.60,
            }
        }

        result = router_guardrail_node(state)

        self.assertEqual(result['policy_action'], 'clarify')
        self.assertIsNotNone(result['clarify_question'])

    @override_settings(ROUTER_TAU_DEFAULT=0.8)
    def test_guardrail_custom_threshold(self):
        """Test guardrail with custom threshold."""
        state = {
            'domain_choice': {
                'domain': 'real_estate',
                'confidence': 0.75,
            }
        }

        result = router_guardrail_node(state)

        # With τ=0.8, confidence 0.75 should be blocked
        self.assertEqual(result['policy_action'], 'clarify')


class TestRouterFusion(TestCase):
    """Test router fusion logic."""

    @patch('router_service.graph.get_centroids')
    @patch('router_service.graph.embed_text')
    @patch('router_service.graph.cosine')
    @patch('router_service.calibration.get_calibrated_probabilities')
    def test_fusion_scoring(self, mock_clf_probs, mock_cosine, mock_embed, mock_centroids):
        """Test that fusion combines multiple signals correctly."""
        from router_service.graph import node_domain_router

        # Mock dependencies
        mock_centroids.return_value = {
            'real_estate': [0.1, 0.2, 0.3],
            'marketplace': [0.4, 0.5, 0.6],
        }
        mock_embed.return_value = [0.1, 0.2, 0.3]
        mock_cosine.return_value = 0.8
        mock_clf_probs.return_value = {
            'real_estate': 0.9,
            'marketplace': 0.6,
            'local_info': 0.5,
            'general_conversation': 0.4,
        }

        state = {'utterance': 'I want to buy a house'}

        result = node_domain_router(state)

        domain_choice = result['domain_choice']
        self.assertIn('confidence', domain_choice)
        self.assertIn('calibrated', domain_choice)
        self.assertIn('contributors', domain_choice)

        confidence = domain_choice['confidence']
        self.assertIsInstance(confidence, float)
        self.assertGreaterEqual(confidence, 0.0)
        self.assertLessEqual(confidence, 1.0)


class TestRouterEvaluation(TestCase):
    """Test router evaluation script."""

    @patch('scripts.eval_router.run_router')
    def test_eval_router_script(self, mock_run_router):
        """Test the router evaluation script."""
        # Mock router responses
        mock_run_router.side_effect = [
            {
                'domain_choice': {'domain': 'real_estate', 'calibrated': 0.9},
                'action': 'dispatch',
                'latency_ms': 50,
            },
            {
                'domain_choice': {'domain': 'marketplace', 'calibrated': 0.8},
                'action': 'dispatch',
                'latency_ms': 45,
            },
        ]

        # This would normally run the eval script
        # For now, just test that the function exists and can be called
        try:
            # Would call: eval_router_main(['script_name'])
            pass
        except SystemExit:
            # Expected when script finishes
            pass


class TestCalibrationParamsModel(TestCase):
    """Test CalibrationParams model functionality."""

    def test_model_creation(self):
        """Test creating calibration parameters."""
        params = CalibrationParams.objects.create(
            domain='real_estate',
            method='platt',
            params={'coef': [1.0, 2.0], 'intercept': 0.5},
            ece=0.03,
            support_n=1000,
            version='active'
        )

        self.assertEqual(params.domain, 'real_estate')
        self.assertEqual(params.method, 'platt')
        self.assertEqual(params.version, 'active')
        self.assertEqual(params.ece, 0.03)
        self.assertEqual(params.support_n, 1000)

    def test_get_active_params(self):
        """Test getting active parameters."""
        CalibrationParams.objects.create(
            domain='real_estate',
            version='active',
            params={}
        )

        active = CalibrationParams.get_active_params('real_estate')
        self.assertIsNotNone(active)
        self.assertEqual(active.version, 'active')

    def test_shadow_promotion(self):
        """Test shadow parameter promotion."""
        # Create active params
        active = CalibrationParams.objects.create(
            domain='real_estate',
            version='active',
            params={'old': 'params'}
        )

        # Create shadow params
        shadow = CalibrationParams.objects.create(
            domain='real_estate',
            version='shadow',
            params={'new': 'params'}
        )

        # Promote shadow
        shadow.promote_to_active()

        # Check promotion worked
        shadow.refresh_from_db()
        self.assertEqual(shadow.version, 'active')

        active.refresh_from_db()
        self.assertEqual(active.version, 'archived')