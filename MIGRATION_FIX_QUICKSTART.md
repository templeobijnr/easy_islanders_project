# Quick Fix: "relation already exists" Migration Error

## The Problem

```
django.db.utils.ProgrammingError: relation "django_content_type" already exists
```

This means your database has tables but Django doesn't know they exist.

## The Solution (Choose One)

### Option A: Automatic Fix (Recommended)

```bash
# Run our custom fix command
docker compose exec web python3 manage.py fix_migration_state --fake-all

# Then run migrations normally
docker compose exec web python3 manage.py migrate
```

### Option B: Manual Fix

```bash
# Fake initial migrations for all Django built-in apps
docker compose exec web python3 manage.py migrate contenttypes --fake-initial
docker compose exec web python3 manage.py migrate auth --fake-initial
docker compose exec web python3 manage.py migrate admin --fake-initial
docker compose exec web python3 manage.py migrate sessions --fake-initial

# Fake initial migrations for custom apps
docker compose exec web python3 manage.py migrate users --fake-initial
docker compose exec web python3 manage.py migrate listings --fake-initial
docker compose exec web python3 manage.py migrate assistant --fake-initial
docker compose exec web python3 manage.py migrate router_service --fake-initial
docker compose exec web python3 manage.py migrate real_estate --fake-initial

# Run migrations
docker compose exec web python3 manage.py migrate
```

## What Does This Do?

`--fake-initial` tells Django:
> "Hey, if these tables already exist, just mark the migration as done without actually creating them."

This syncs Django's records with your database reality.

## Need More Help?

See the complete guide: [`docs/MIGRATION_TROUBLESHOOTING.md`](docs/MIGRATION_TROUBLESHOOTING.md)

## Quick Diagnosis

Check migration state before fixing:
```bash
docker compose exec web python3 manage.py fix_migration_state --check
```

See what would be fixed (dry run):
```bash
docker compose exec web python3 manage.py fix_migration_state --fake-all --dry-run
```

## Success Looks Like

After fixing, you should see:
```
Running migrations:
  No migrations to apply.
```

Or if there are new migrations:
```
Running migrations:
  Applying listings.0007_auto_20251111_1753... OK
```

## Still Broken?

1. Check which migration is failing:
   ```bash
   docker compose exec web python3 manage.py migrate --verbosity 2
   ```

2. Fake that specific migration:
   ```bash
   docker compose exec web python3 manage.py migrate <app> <migration> --fake
   ```

3. If all else fails, see the full troubleshooting guide in `docs/MIGRATION_TROUBLESHOOTING.md`
