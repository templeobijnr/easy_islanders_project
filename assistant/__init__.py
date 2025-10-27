default_app_config = 'assistant.apps.AssistantConfig'

def ready():
    """Register signal handlers when app is ready."""
    from . import signals  # noqa
