web: python manage.py migrate && python manage.py collectstatic --noinput && gunicorn easy_islanders.wsgi:application --bind 0.0.0.0:$PORT
worker: celery -A easy_islanders worker --loglevel=info
beat: celery -A easy_islanders beat --loglevel=info









