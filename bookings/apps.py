from django.apps import AppConfig


class BookingsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'bookings'
    verbose_name = 'Booking System'

    def ready(self):
        """Import signals when the app is ready"""
        import bookings.signals  # noqa
