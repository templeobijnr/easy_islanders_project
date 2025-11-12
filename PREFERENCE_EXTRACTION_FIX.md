# Fix: Preference Extraction Service - FieldError "Cannot resolve keyword 'category'"

## Problem

The preference extraction task (`extract_preferences_async`) was failing with:

```
django.core.exceptions.FieldError: Cannot resolve keyword 'category' into field. 
Choices are: confidence, created_at, id, last_used_at, metadata, preference_type, 
raw_value, source, updated_at, use_count, user, user_id, value
```

## Root Cause

The `UserPreference` model does not have a `category` field. The code was attempting to use `category` as a filter/lookup parameter in `get_or_create()`, which failed.

The actual unique constraint on the model is: `['user', 'preference_type']` - not including category.

## Solution

### 1. Refactored PreferenceService (assistant/services/preferences.py)

- Store `category` in the `metadata` JSONField instead of as a model field
- Update `get_or_create()` to filter only by `user_id` and `preference_type` (actual unique constraint)
- Modified `get_active_preferences()` to retrieve category from metadata with fallback to "general"
- Removed references to non-existent `embedding` field

### 2. Updated Task Handler (assistant/tasks.py)

- Fixed preference object access to retrieve category from metadata instead of `.category`
- Changed: `inc_prefs_saved(obj.category, ...)` → `inc_prefs_saved(category, ...)`

### 3. Fixed API Endpoint (assistant/views/preferences.py)

- Updated response serialization to get category from metadata
- Changed: `"category": obj.category` → `"category": category_from_metadata`

### 4. Fixed Database Migrations (listings/migrations/)

- Created migration `0002_add_location_fields.py` to add missing `latitude`, `longitude`, and `views` columns
- Faked existing columns and applied migration to sync database state

## Changes Summary

**Files Modified:**
- `/assistant/services/preferences.py` - PreferenceService refactored
- `/assistant/tasks.py` - Fixed preference access
- `/assistant/views/preferences.py` - Fixed API response
- `/listings/migrations/0002_add_location_fields.py` - Added missing columns
- `/listings/models.py` - No changes needed (already correct)

**Database Changes:**
```sql
ALTER TABLE listings_listing ADD COLUMN views integer DEFAULT 0;
ALTER TABLE listings_listing ADD COLUMN latitude double precision;
ALTER TABLE listings_listing ADD COLUMN longitude double precision;
```

## Testing

Verified with test flow:
```python
✓ Created preference successfully
✓ Category stored in metadata: real_estate
✓ Retrieved preferences grouped by category
✓ Service works end-to-end
```

## Migration State

Confirmed with `python manage.py fix_migration_state --check`:
```
Found 63 tables in database
Found 70 recorded migrations
No issues found. Migration state looks good!
```

## API Contracts

### Preference Storage
- Categories are stored in `metadata` field
- Preference uniqueness: `(user_id, preference_type)`
- Category serves as grouping/organization, not a unique key

### Response Format
```json
{
  "ok": true,
  "preference": {
    "id": "uuid",
    "category": "real_estate",
    "preference_type": "location",
    "value": {"type": "single", "value": "Miami"},
    "confidence": 0.8,
    "source": "explicit"
  }
}
```

### Get Active Preferences
Returns preferences grouped by category from metadata:
```json
{
  "preferences": {
    "real_estate": [...],
    "services": [...],
    "general": [...]
  }
}
```

## Future Considerations

- If category becomes a first-class concept with business logic, consider adding a `category` field to UserPreference
- Monitor preference grouping to ensure category in metadata is consistently used
- Consider adding category validation against Category model
