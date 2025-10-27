# easy_islanders/settings/__init__.py

import os

# Get the environment setting
# This defaults to 'development' if the DJANGO_ENV variable is not set
environment = os.environ.get('DJANGO_ENV')
if not environment:
    environment = os.environ.get('ENVIRONMENT', 'development')

print(f"--- Loading settings for environment: '{environment}' ---")

# Import the correct settings file based on the environment
if environment == 'production':
    from .production import *
elif environment == 'testing':
    from .testing import *
else:
    # Default to development settings
    from .development import *
