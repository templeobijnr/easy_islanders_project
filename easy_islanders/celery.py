"""
Celery configuration for Easy Islanders.

This module configures Celery for background task processing,
including router calibration updates and other periodic jobs.
"""

import os
from celery import Celery
from celery.schedules import crontab

# Set the default Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'easy_islanders.settings.development')

app = Celery('easy_islanders')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django apps.
app.autodiscover_tasks()


@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')


# Periodic tasks
app.conf.beat_schedule = {
    # Router calibration tasks
    'update-router-centroids-nightly': {
        'task': 'router_service.tasks.update_router_centroids',
        'schedule': crontab(hour=2, minute=0),  # Daily at 2 AM
    },
    'retrain-router-calibration-weekly': {
        'task': 'router_service.tasks.retrain_router_calibration',
        'schedule': crontab(day_of_week=0, hour=3, minute=0),  # Sunday at 3 AM
    },

    # Monitoring and health checks
    'cleanup-old-router-events': {
        'task': 'router_service.tasks.cleanup_old_router_events',
        'schedule': crontab(hour=4, minute=0),  # Daily at 4 AM
    },
}

app.conf.timezone = 'UTC'
