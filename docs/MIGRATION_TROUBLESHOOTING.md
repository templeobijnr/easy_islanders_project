# Migration Troubleshooting Guide

## Problem: "relation already exists" Error

### Symptom
When running `python3 manage.py migrate`, you encounter an error like:
```
django.db.utils.ProgrammingError: relation "django_content_type" already exists
```

### Root Cause
This error occurs when:
1. **Database has existing tables** from previous migrations
2. **Django's migration records are missing or incomplete** in the `django_migrations` table
3. Django tries to create tables that already exist because it doesn't know they've been created

### Quick Fix

#### Option 1: Use the Fix Command (Recommended)

We've created a management command to automatically fix this issue:

```bash
# Step 1: Check current migration state
docker compose exec web python3 manage.py fix_migration_state --check

# Step 2: See what would be fixed (dry run)
docker compose exec web python3 manage.py fix_migration_state --fake-all --dry-run

# Step 3: Fix the migration state
docker compose exec web python3 manage.py fix_migration_state --fake-all

# Step 4: Run migrations normally
docker compose exec web python3 manage.py migrate
```

#### Option 2: Manual Fix

If you need more control, you can manually fake specific migrations:

```bash
# Fake initial migrations for Django built-in apps
docker compose exec web python3 manage.py migrate contenttypes --fake-initial
docker compose exec web python3 manage.py migrate auth --fake-initial
docker compose exec web python3 manage.py migrate admin --fake-initial
docker compose exec web python3 manage.py migrate sessions --fake-initial

# Fake initial migrations for your custom apps
docker compose exec web python3 manage.py migrate users --fake-initial
docker compose exec web python3 manage.py migrate listings --fake-initial
docker compose exec web python3 manage.py migrate assistant --fake-initial
docker compose exec web python3 manage.py migrate router_service --fake-initial
docker compose exec web python3 manage.py migrate real_estate --fake-initial

# Now run migrations to apply any new changes
docker compose exec web python3 manage.py migrate
```

### Understanding the Solution

#### What is `--fake-initial`?

The `--fake-initial` flag tells Django:
> "If the tables for this migration already exist in the database, mark the migration as applied without actually running it."

This is safe to use when:
- ✅ You know the tables already exist
- ✅ The table structure matches the migration
- ✅ You want Django to "catch up" its records to match reality

This is **NOT** safe when:
- ❌ You're not sure if tables exist
- ❌ The table structure might be different from the migration
- ❌ You want to actually create new tables

#### What Does the Fix Command Do?

The `fix_migration_state` command:
1. **Analyzes** the current database state
2. **Compares** it with Django's migration records
3. **Identifies** migrations that need to be faked
4. **Applies** fake migrations to bring records in sync
5. **Reports** what it did

### Prevention

To avoid this issue in the future:

1. **Always use migrations** for database changes
2. **Never manually create tables** that Django should manage
3. **Keep migration records** when copying databases
4. **Document database setup** in your README

### Advanced: Verify Migration State

#### Check what migrations Django thinks are applied:
```bash
docker compose exec web python3 manage.py showmigrations
```

Expected output format:
```
listings
 [X] 0001_initial
 [X] 0002_initial
 [X] 0003_booking
 [ ] 0004_sellerprofile_add_seller_fk
```

Where:
- `[X]` = Applied
- `[ ]` = Not applied

#### Check what tables actually exist in the database:
```bash
docker compose exec web python3 manage.py dbshell
```

Then in PostgreSQL:
```sql
-- List all tables
\dt

-- Show specific table structure
\d listings_listing

-- Check django_migrations table
SELECT app, name, applied
FROM django_migrations
ORDER BY app, name;

-- Exit
\q
```

### Common Scenarios

#### Scenario 1: Fresh Development Setup
**Problem**: Cloned repo, database has tables but no migration records

**Solution**:
```bash
docker compose exec web python3 manage.py fix_migration_state --fake-all
docker compose exec web python3 manage.py migrate
```

#### Scenario 2: After Database Import/Restore
**Problem**: Imported database dump without `django_migrations` table

**Solution**:
```bash
# Restore just the django_migrations table from a backup, or:
docker compose exec web python3 manage.py fix_migration_state --fake-all
```

#### Scenario 3: Specific App Has Issues
**Problem**: Only `listings` app has migration state issues

**Solution**:
```bash
docker compose exec web python3 manage.py fix_migration_state --app listings
docker compose exec web python3 manage.py migrate listings
```

#### Scenario 4: Migration State Is Completely Broken
**Problem**: Migration records are corrupted or inconsistent

**Nuclear Option** (⚠️ **Use with caution**):
```bash
# Clear all migration records (doesn't touch actual tables)
docker compose exec web python3 manage.py dbshell

# In PostgreSQL:
TRUNCATE django_migrations;
\q

# Rebuild migration records
docker compose exec web python3 manage.py fix_migration_state --fake-all
docker compose exec web python3 manage.py migrate
```

### Troubleshooting the Fix

#### Fix Command Fails
```bash
# Check if database is accessible
docker compose exec web python3 manage.py dbshell

# Check if tables actually exist
# (in dbshell)
\dt
```

#### Migrations Still Fail After Fix
```bash
# Check which specific migration is failing
docker compose exec web python3 manage.py migrate --verbosity 2

# Fake that specific migration
docker compose exec web python3 manage.py migrate <app_name> <migration_name> --fake

# Example:
docker compose exec web python3 manage.py migrate listings 0001_initial --fake
```

#### Still Getting "relation already exists"
This means `--fake-initial` didn't catch it. Try:
```bash
# Fake the specific migration that's failing
docker compose exec web python3 manage.py migrate <app> --fake
```

### When to Reset Migrations (⚠️ Dangerous)

**Only do this in development!** Never in production!

If migrations are completely broken and you want to start fresh:
```bash
# 1. Backup your data first!
docker compose exec web python3 manage.py dumpdata > backup.json

# 2. Drop and recreate database
docker compose down
docker volume rm easy_islanders_project_postgres_data
docker compose up -d

# 3. Run migrations from scratch
docker compose exec web python3 manage.py migrate

# 4. Restore data
docker compose exec web python3 manage.py loaddata backup.json
```

### Getting Help

If you're still stuck:
1. Check the Django docs: https://docs.djangoproject.com/en/stable/topics/migrations/
2. Review our `CLAUDE.md` for database setup instructions
3. Check the error message carefully - it usually tells you which table/migration is the problem
4. Use `--verbosity 2` or `--verbosity 3` for more detailed output

### Reference Commands

```bash
# Show migration plan without applying
python3 manage.py migrate --plan

# Show migrations status
python3 manage.py showmigrations

# Show SQL for a migration (without running it)
python3 manage.py sqlmigrate <app> <migration_number>

# Fake a specific migration
python3 manage.py migrate <app> <migration_number> --fake

# Fake all initial migrations
python3 manage.py migrate --fake-initial

# Run migrations with detailed output
python3 manage.py migrate --verbosity 3

# Rollback to a specific migration
python3 manage.py migrate <app> <migration_number>

# Check for migration conflicts
python3 manage.py makemigrations --check --dry-run
```

### Understanding Migration State

Django tracks migrations in the `django_migrations` table with this structure:
```sql
CREATE TABLE django_migrations (
    id integer PRIMARY KEY,
    app varchar(255),
    name varchar(255),
    applied timestamp with time zone
);
```

Each row represents a migration that has been applied. When you run `migrate`, Django:
1. Checks this table to see what's been applied
2. Compares with migration files on disk
3. Applies any migrations not in the table
4. Records newly applied migrations

When the table is out of sync with reality, you get "relation already exists" errors.

---

**Last Updated**: 2025-11-12
**Related Files**:
- `listings/management/commands/fix_migration_state.py` - Automatic fix command
- `easy_islanders/settings/base.py` - Database configuration
- `CLAUDE.md` - General database troubleshooting
