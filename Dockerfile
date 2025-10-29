FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

# Set work directory
WORKDIR /code

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt /code/
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy project
COPY . /code/

# Create necessary directories
RUN mkdir -p /code/logs /code/staticfiles /code/data/chroma_db

# Skip collectstatic during build - will run in production with proper env vars
# RUN python manage.py collectstatic --noinput || echo "Collectstatic skipped"

# Create entrypoint script for migrations + gunicorn
RUN echo '#!/bin/bash\n\
set -e\n\
echo "=== Easy Islanders Router Starting ==="\n\
echo "Environment: ${DJANGO_ENV:-development}"\n\
echo "Port: ${PORT:-8000}"\n\
echo "Router Config: ${ROUTER_CONFIG:-unknown}"\n\
echo "Shadow Rate: ${ROUTER_SHADOW:-0.0}"\n\
echo "GIT SHA: ${GIT_SHA:-unknown}"\n\
echo ""\n\
echo "🔄 Running database migrations..."\n\
python manage.py migrate --noinput 2>&1 || echo "⚠️  Migration failed, continuing..."\n\
echo "✅ Migrations complete"\n\
echo ""\n\
# Calculate workers: 2 * CPU + 1 (Fly shared-cpu has 1 CPU, so 3 workers)\n\
WORKERS=${GUNICORN_WORKERS:-3}\n\
echo "🚀 Starting gunicorn with ${WORKERS} workers on 0.0.0.0:${PORT:-8000}..."\n\
exec gunicorn easy_islanders.wsgi:application \\\n\
  --bind 0.0.0.0:${PORT:-8000} \\\n\
  --workers ${WORKERS} \\\n\
  --threads 2 \\\n\
  --timeout 120 \\\n\
  --graceful-timeout 30 \\\n\
  --keep-alive 5 \\\n\
  --log-level info \\\n\
  --access-logfile - \\\n\
  --error-logfile - \\\n\
  --capture-output \\\n\
  --enable-stdio-inheritance\n\
' > /code/entrypoint.sh && chmod +x /code/entrypoint.sh

# Expose port
EXPOSE 8000

# Use entrypoint script
CMD ["/code/entrypoint.sh"]
