# easy_islanders/settings/production.py
import os
from .base import *
from decouple import config

DEBUG = False
SECRET_KEY = config('SECRET_KEY')

# Load production-specific settings
ALLOWED_HOSTS = config('ALLOWED_HOSTS').split(',')

# Configure PostgreSQL or another production database
DATABASES = {
  'default':{
    'ENGINE': 'django.db.backends.postgresql',
    'NAME': config('DB_NAME'),
    'USER': config('DB_USER'),
    'PASSWORD': config('DB_PASSWORD'),
    'HOST': config('DB_HOST'),
    'PORT': config('DB_PORT')
  }
}

# Static and media files setup for production
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

print('Running with production settings')

