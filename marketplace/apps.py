from django.apps import AppConfig


class MarketplaceConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'marketplace'
    verbose_name = 'Marketplace'

    def ready(self):
        """Import signals when app is ready"""
        try:
            import marketplace.signals  # noqa: F401
        except ImportError:
            pass
