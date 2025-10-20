import os
from celery import Celery

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'easy_islanders.settings.development')

app = Celery('easy_islanders')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django apps.
app.autodiscover_tasks()

app.conf.beat_schedule = {
    'monitor-outreaches-every-15-mins': {
        'task': 'assistant.tasks.monitor_pending_outreaches',
        'schedule': 900.0,  # 15 minutes in seconds
    },
    'monitor-new-media-every-5-mins': {
        'task': 'assistant.tasks.monitor_new_media_and_trigger_proactive',
        'schedule': 300.0,  # 5 minutes in seconds
    },
    'send-proactive-reminders-daily': {
        'task': 'assistant.tasks.send_proactive_reminders',
        'schedule': 86400.0,  # 24 hours in seconds
    },
    'send-market-updates-weekly': {
        'task': 'assistant.tasks.send_market_updates',
        'schedule': 604800.0,  # 7 days in seconds
    },
}
app.conf.timezone = 'UTC'

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')



