# Backend Setup & Database Initialization Guide

## 🚀 Quick Start

The backend is working but needs database initialization. Follow these steps to get everything running:

---

## ✅ Step 1: Run Migrations

The new `UserPreferences` model needs to be migrated to the database:

```bash
# If using Docker:
docker compose exec easy_islanders_web python manage.py migrate users

# If running locally:
python manage.py migrate users
```

This will create the `users_userpreferences` table.

---

## ✅ Step 2: Populate Categories

The categories table is empty, which is why the CreateListing page shows 0 categories. Run the populate command:

```bash
# If using Docker:
docker compose exec easy_islanders_web python manage.py populate_categories

# If running locally:
python manage.py populate_categories
```

This will create:
- **8 main categories**: Accommodation, Products, Vehicles, Local Businesses, Services, Experiences, Jobs, Miscellaneous
- **60+ subcategories**: Apartments, Villas, Cars, Restaurants, Cleaning, Tours, etc.

---

## ✅ Step 3: Verify Backend is Running

Check that the backend is accessible:

```bash
curl http://127.0.0.1:8000/api/categories/
```

You should see a JSON response with all categories.

---

## 🔍 Port Configuration

The frontend has been updated to automatically detect the correct backend port:
- **Tries port 8001 first** (in case of port conflicts)
- **Falls back to port 8000** (default Django port)

You can verify the current configuration in `frontend/src/config.js`.

---

## 📊 Current Database Status

Based on the logs, the backend is:
- ✅ Running and accepting connections
- ✅ Returning successful responses (200 OK)
- ⚠️ Categories table is empty (needs seeding)
- ⚠️ UserPreferences table may not exist (needs migration)

---

## 🛠️ Complete Backend Endpoints

All user page endpoints are now implemented:

### Authentication & Profile
- `GET /api/auth/profile/` - Get user profile
- `PUT /api/auth/profile/` - Update user profile
- `GET /api/auth/preferences/` - Get user preferences
- `PUT /api/auth/preferences/` - Update preferences
- `POST /api/auth/change-password/` - Change password
- `DELETE /api/auth/delete-account/` - Delete account

### Requests
- `GET /api/buyer-requests/my-requests/` - Get user's buyer requests
- `POST /api/buyer-requests/` - Create new request
- `GET /api/categories/` - Get all categories (for dropdown)

### Bookings
- `GET /api/bookings/my-bookings/` - Get user's bookings
- `PATCH /api/bookings/{id}/` - Update booking (cancel, etc.)

---

## 🧪 Testing Endpoints

After running migrations and seeding categories, test the endpoints:

### Test Categories Endpoint
```bash
curl http://127.0.0.1:8000/api/categories/
```

Expected response:
```json
{
  "categories": [
    {
      "id": 1,
      "slug": "accommodation",
      "name": "Accommodation / Real Estate",
      "subcategories": [
        {"id": 1, "slug": "apartments", "name": "Apartments"},
        ...
      ]
    },
    ...
  ],
  "count": 8
}
```

### Test Preferences Endpoint (Requires Authentication)
```bash
# Get JWT token first by logging in
curl -X POST http://127.0.0.1:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}'

# Use the token to access preferences
curl http://127.0.0.1:8000/api/auth/preferences/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🔧 Troubleshooting

### Issue: Categories still showing 0 after seeding

**Solution:**
```bash
# Check if categories were created
docker compose exec easy_islanders_db psql -U easy_user -d easy_islanders -c "SELECT COUNT(*) FROM listings_category;"

# If 0, run populate command again with verbose output
docker compose exec easy_islanders_web python manage.py populate_categories
```

### Issue: "relation 'users_userpreferences' does not exist"

**Solution:**
```bash
# Run the migration
docker compose exec easy_islanders_web python manage.py migrate users

# Verify the table was created
docker compose exec easy_islanders_db psql -U easy_user -d easy_islanders -c "\dt users_*"
```

### Issue: Settings page shows "Failed to load preferences"

**Cause:** UserPreferences table doesn't exist yet.

**Solution:** Run the migration (Step 1 above).

### Issue: Port 8000 is already in use

**Solutions:**
1. **Change Django port:**
   ```bash
   python manage.py runserver 8001
   ```

2. **Or kill the process using port 8000:**
   ```bash
   lsof -ti:8000 | xargs kill -9
   ```

---

## 📝 Summary of Changes

### Backend (Django)
✅ Added `UserPreferences` model for settings
✅ Implemented PUT endpoint for profile updates
✅ Implemented GET/PUT endpoints for preferences
✅ Implemented POST endpoint for password changes
✅ Implemented DELETE endpoint for account deletion
✅ Implemented PATCH endpoint for booking cancellation
✅ Created migration for UserPreferences

### Frontend (React)
✅ Connected Profile page to real API
✅ Connected Settings page to real API
✅ Connected Requests page to real API
✅ Connected Bookings page to real API
✅ Added auto-port detection for backend

---

## 🎯 Next Steps

After completing the above steps, you should be able to:

1. ✅ Create listings (categories will populate in dropdown)
2. ✅ View and edit your profile
3. ✅ Update preferences and notifications
4. ✅ Change your password
5. ✅ Create buyer requests
6. ✅ View and cancel bookings

All pages are now fully connected to the backend with proper authentication and error handling!

---

## 🆘 Still Having Issues?

Check the Django logs for detailed error messages:

```bash
# If using Docker:
docker compose logs easy_islanders_web -f

# Look for error messages when making requests
```

Common errors and solutions:
- **401 Unauthorized**: Token expired, log in again
- **404 Not Found**: Check the endpoint URL
- **500 Internal Server Error**: Check Django logs for Python exceptions
- **Connection Refused**: Backend not running, start it with `python manage.py runserver`
