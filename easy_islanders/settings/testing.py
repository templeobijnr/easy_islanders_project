# easy_islanders/settings/testing.py
DEBUG = True
DATABASES = {
  'default': {
    'ENGINE': 'django.db.backends.sqlite3',
    'NAME' : BASE_DIR / 'test_db.sqlite3', # Use a separate test database
  }
}

print('Running with testing settings')