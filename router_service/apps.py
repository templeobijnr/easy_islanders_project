from django.apps import AppConfig


class RouterServiceConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'router_service'
    verbose_name = 'Intent Router Service'

    def ready(self):
        # Future: hooks for warming caches/calibration params
        pass

