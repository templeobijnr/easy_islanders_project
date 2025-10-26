# manage.py

#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys
from pathlib import Path

# Ensure .env is loaded as early as possible
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).resolve().parent / '.env'
    if env_path.exists():
        load_dotenv(env_path)
except Exception:
    # If python-dotenv is not installed, continue silently
    pass

def main():
    """Run administrative tasks."""
    # This now just points to the settings package.
    # The __init__.py file inside will handle the rest.
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'easy_islanders.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)

if __name__ == '__main__':
    main()