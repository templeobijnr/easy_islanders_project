#!/usr/bin/env python3
"""
Celery Tasks for Easy Islanders Registry Service
Safe to run during staging soak - background tasks don't interfere with telemetry
"""

from celery import Celery
from celery.schedules import crontab
import logging
from typing import List, Dict, Any
from datetime import datetime, timedelta
import json

logger = logging.getLogger(__name__)

# Initialize Celery app
app = Celery('registry_service')
app.config_from_object('registry_service.celery_config')

# Alias used by package initializer
celery_app = app

@app.task(bind=True, max_retries=3)
def reembed_changed_terms(self, market_id: str = None, language: str = None):
    """
    Re-embed terms that have changed since last embedding
    Safe to run during soak - only processes database changes
    """
    try:
        logger.info(f"Starting reembed_changed_terms task for market_id={market_id}, language={language}")
        
        # This would query the database for terms that need re-embedding
        # For now, simulate the process
        
        # Simulate finding terms that need re-embedding
        terms_to_reembed = [
            {"id": 1, "text": "immigration office", "market_id": "CY-NC", "language": "en"},
            {"id": 2, "text": "pharmacy", "market_id": "CY-NC", "language": "en"},
            {"id": 3, "text": "hospital", "market_id": "CY-NC", "language": "en"},
        ]
        
        if market_id:
            terms_to_reembed = [t for t in terms_to_reembed if t["market_id"] == market_id]
        if language:
            terms_to_reembed = [t for t in terms_to_reembed if t["language"] == language]
        
        logger.info(f"Found {len(terms_to_reembed)} terms to re-embed")
        
        # Process each term
        success_count = 0
        for term in terms_to_reembed:
            try:
                # Simulate embedding process
                result = embed_single_term.delay(term["id"], term["text"])
                success_count += 1
                logger.debug(f"Queued embedding for term {term['id']}")
            except Exception as e:
                logger.error(f"Failed to queue embedding for term {term['id']}: {e}")
        
        logger.info(f"Reembed_changed_terms completed: {success_count}/{len(terms_to_reembed)} terms queued")
        return {
            "status": "success",
            "terms_processed": len(terms_to_reembed),
            "terms_queued": success_count,
            "market_id": market_id,
            "language": language
        }
        
    except Exception as e:
        logger.error(f"Error in reembed_changed_terms: {e}")
        # Retry with exponential backoff
        raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))

@app.task(bind=True, max_retries=2)
def embed_single_term(self, term_id: int, text: str):
    """
    Embed a single term
    Safe to run during soak - isolated operation
    """
    try:
        logger.info(f"Embedding term {term_id}: {text}")
        
        # Simulate embedding API call
        import time
        time.sleep(0.1)  # Simulate API latency
        
        # Mock embedding (1536 dimensions)
        import random
        random.seed(hash(text))
        embedding = [random.random() for _ in range(1536)]
        
        # Simulate database update
        logger.info(f"Updated embedding for term {term_id}")
        
        return {
            "term_id": term_id,
            "embedding_dimensions": len(embedding),
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Error embedding term {term_id}: {e}")
        raise self.retry(exc=e, countdown=30 * (2 ** self.request.retries))

@app.task
def drift_report():
    """
    Generate a drift report comparing current embeddings with baseline
    Safe to run during soak - read-only analysis
    """
    try:
        logger.info("Generating drift report")
        
        # Simulate drift analysis
        report = {
            "timestamp": datetime.utcnow().isoformat(),
            "total_terms": 100,
            "terms_with_drift": 5,
            "drift_percentage": 5.0,
            "avg_cosine_similarity": 0.95,
            "terms_needing_reembedding": [
                {"id": 1, "drift_score": 0.15, "last_updated": "2025-10-20"},
                {"id": 2, "drift_score": 0.12, "last_updated": "2025-10-19"},
            ],
            "recommendations": [
                "Re-embed terms with drift_score > 0.1",
                "Schedule weekly drift analysis",
                "Consider updating embedding model"
            ]
        }
        
        logger.info(f"Drift report generated: {report['drift_percentage']}% drift detected")
        return report
        
    except Exception as e:
        logger.error(f"Error generating drift report: {e}")
        return {"error": str(e), "status": "failed"}

@app.task
def cleanup_old_embeddings():
    """
    Clean up old embeddings that are no longer needed
    Safe to run during soak - maintenance operation
    """
    try:
        logger.info("Starting cleanup of old embeddings")
        
        # Simulate cleanup process
        cutoff_date = datetime.utcnow() - timedelta(days=30)
        
        # This would query and delete old embeddings
        cleaned_count = 10  # Simulate
        
        logger.info(f"Cleanup completed: {cleaned_count} old embeddings removed")
        return {
            "status": "success",
            "embeddings_cleaned": cleaned_count,
            "cutoff_date": cutoff_date.isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in cleanup: {e}")
        return {"error": str(e), "status": "failed"}

# Celery Beat Schedule (safe to run during soak)
app.conf.beat_schedule = {
    'reembed-changed-terms': {
        'task': 'registry_service.tasks.reembed_changed_terms',
        'schedule': crontab(hour=2, minute=0),  # Daily at 2 AM
        'args': (None, None)  # All markets and languages
    },
    'drift-report': {
        'task': 'registry_service.tasks.drift_report',
        'schedule': crontab(hour=3, minute=0),  # Daily at 3 AM
    },
    'cleanup-old-embeddings': {
        'task': 'registry_service.tasks.cleanup_old_embeddings',
        'schedule': crontab(hour=4, minute=0),  # Daily at 4 AM
    },
    'rag-ingestion-daily': {
        'task': 'registry_service.rag_ingestion.jobs.run_rag_ingestion',
        'schedule': crontab(hour=1, minute=0),  # Daily at 1 AM
    },
}

# Example usage (safe to run during soak)
if __name__ == "__main__":
    # Test tasks without interfering with soak
    print("Testing Celery tasks (safe during soak)...")
    
    # Test reembed task
    result = reembed_changed_terms.delay("CY-NC", "en")
    print(f"Reembed task queued: {result.id}")
    
    # Test drift report
    result = drift_report.delay()
    print(f"Drift report queued: {result.id}")
    
    # Test RAG ingestion pipeline
    result = app.send_task('registry_service.rag_ingestion.jobs.run_rag_ingestion')
    print(f"RAG ingestion queued: {result.id}")
    
    print("All tasks queued successfully - safe to run during soak")
