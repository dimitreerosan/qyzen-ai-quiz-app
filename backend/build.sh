#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install dependencies
pip install -r requirements.txt

# Run migrations to ensure database is in sync
python manage.py migrate

# Collect static files for Whitenoise
python manage.py collectstatic --no-input
