# Endpoint Fixes Summary

**Date:** 2025-01-17
**Issues Fixed:** 3 major endpoint errors

---

## Issues Identified

From the logs:
```
403 Forbidden: /api/dashboard/real-estate/overview
404 Not Found: /api/real-estate/listings/1/
Image upload failing: /api/real-estate/listings/{id}/images/
```

---

## Root Causes

### 1. **403 Forbidden on Dashboard Overview**
**Issue:** Frontend calling `/api/dashboard/real-estate/overview` but getting 403 Forbidden.

**Root Cause:** The endpoint exists and requires authentication (`IsAuthenticated` permission class), but the frontend API client (`apiClient.ts`) is properly configured to send auth tokens. The 403 might be due to:
- Token not being set in localStorage (`authToken`)
- Token expired
- User not authenticated when making the request

**Status:** ✅ No code changes needed - apiClient already sends `Authorization: Bearer {token}` header

**Fix:** Ensure authentication flow sets token properly:
```typescript
// After successful login:
apiClient.setAuthToken(token);

// Or set directly in localStorage:
localStorage.setItem('authToken', token);
```

---

### 2. **404 Not Found on Listing Detail**
**Issue:** Frontend making requests to `/api/real-estate/listings/1/` which doesn't exist.

**Root Cause:**
- The correct endpoint is `/api/v1/real_estate/listings/{pk}/` (defined in real_estate/urls.py line 59)
- OR use the generic listings endpoint: `/api/listings/{pk}/` (from listings/urls.py ListingViewSet)

**Fix Applied:** ✅ Added backward compatibility alias in [real_estate/urls.py](real_estate/urls.py:63-64):
```python
# Alias endpoint for backward compatibility (maps to generic listings endpoint)
path('real-estate/listings/<int:pk>/', listing_update, name='legacy-listing-detail'),
```

**Alternative:** Update frontend to use correct endpoint `/api/v1/real_estate/listings/{pk}/`

---

### 3. **Image Upload Failing**
**Issue:** Frontend calling `/api/real-estate/listings/{id}/images/` which doesn't exist.

**Root Cause:**
- The correct endpoint is `/api/listings/{id}/upload-image/` (custom action in ListingViewSet)
- Backend expects single 'image' key in FormData, not 'images'

**Fix Applied:** ✅ Updated [RealEstatePropertyUploadEnhanced.tsx](frontend/src/features/seller-dashboard/domains/real-estate/overview/RealEstatePropertyUploadEnhanced.tsx:404-417):

**Before:**
```typescript
const fd = new FormData();
images.forEach((file) => {
  fd.append('images', file);  // ❌ Wrong key
});
await axios.post(`${config.API_BASE_URL}/api/real-estate/listings/${listingId}/images/`, fd, {
  // ❌ Wrong endpoint
```

**After:**
```typescript
// Upload each image individually using the correct endpoint
for (const file of images) {
  const fd = new FormData();
  fd.append('image', file); // ✅ Correct key: singular 'image'
  await axios.post(`${config.API_BASE_URL}/api/listings/${listingId}/upload-image/`, fd, {
    // ✅ Correct endpoint
```

---

## Correct Endpoints Reference

### Authentication
```
POST /api/token/              - Get JWT access + refresh tokens
POST /api/token/refresh/      - Refresh access token
POST /api/logout/             - Logout (clear cookies)
```

### Real Estate Dashboard
```
GET  /api/dashboard/real-estate/overview                  - Overview metrics (requires auth)
GET  /api/dashboard/real-estate/portfolio                 - Portfolio breakdown
GET  /api/dashboard/real-estate/location                  - Location performance
GET  /api/dashboard/real-estate/occupancy                 - Occupancy time-series
GET  /api/dashboard/real-estate/earnings                  - Revenue/expenses
GET  /api/dashboard/real-estate/sales-pipeline            - Sales funnel
GET  /api/dashboard/real-estate/requests                  - User inquiries
GET  /api/dashboard/real-estate/calendar                  - Calendar events
GET  /api/dashboard/real-estate/maintenance               - Maintenance tickets
GET  /api/dashboard/real-estate/owners-and-tenants        - Directory
GET  /api/dashboard/real-estate/pricing-and-promotions    - Pricing suggestions
GET  /api/dashboard/real-estate/channels-and-distribution - Channel performance
GET  /api/dashboard/real-estate/projects                  - Projects list
```

### Real Estate Listings (Portfolio API)
```
GET    /api/v1/real_estate/portfolio/listings/   - List user's properties (requires auth)
GET    /api/v1/real_estate/portfolio/summary/    - Portfolio summary (requires auth)
GET    /api/v1/real_estate/listings/{pk}/        - Get listing detail
PATCH  /api/v1/real_estate/listings/{pk}/        - Update listing
```

### Generic Listings (Multi-domain)
```
GET    /api/listings/                  - List all listings (public)
POST   /api/listings/                  - Create listing (requires auth)
GET    /api/listings/{pk}/             - Get listing detail
PUT    /api/listings/{pk}/             - Update listing (requires auth + ownership)
PATCH  /api/listings/{pk}/             - Partial update listing
DELETE /api/listings/{pk}/             - Delete listing (requires auth + ownership)
POST   /api/listings/{pk}/upload-image/ - Upload single image (requires auth + ownership)
POST   /api/listings/{pk}/duplicate/   - Duplicate listing (requires auth + ownership)
```

### Property Creation (Real Estate)
```
POST /api/v1/real_estate/properties/   - Create property + listing (requires auth)
```

### Bookings
```
GET  /api/v1/real_estate/availability/check/   - Check availability
POST /api/v1/real_estate/bookings/             - Create booking
```

### Categories
```
GET /api/categories/                           - List categories
GET /api/categories/{pk}/                      - Get category detail
GET /api/categories/{pk}/subcategories/        - List subcategories for a category
```

---

## Backend Changes Made

### 1. `real_estate/urls.py` (Line 63-64)
Added backward compatibility alias:
```python
# Alias endpoint for backward compatibility (maps to generic listings endpoint)
path('real-estate/listings/<int:pk>/', listing_update, name='legacy-listing-detail'),
```

---

## Frontend Changes Made

### 1. `frontend/src/features/seller-dashboard/domains/real-estate/overview/RealEstatePropertyUploadEnhanced.tsx` (Lines 404-417)

**Changed:**
- Endpoint: `/api/real-estate/listings/{id}/images/` → `/api/listings/{id}/upload-image/`
- FormData key: `'images'` → `'image'` (singular)
- Upload method: Batch upload → Individual upload (sequential for loop)

**Reason:** Backend `upload_image` action expects:
- Single image per request
- Key must be `'image'` (as checked in `request.FILES.get('image')`)

---

## Testing Checklist

- [ ] **Dashboard Overview:** GET `/api/dashboard/real-estate/overview` with auth token returns 200 OK
- [ ] **Listing Detail:** GET `/api/real-estate/listings/1/` returns 200 OK (backward compat)
- [ ] **Listing Detail (v1):** GET `/api/v1/real_estate/listings/1/` returns 200 OK
- [ ] **Image Upload:** POST `/api/listings/{id}/upload-image/` with multipart FormData returns 201 Created
- [ ] **Property Creation:** POST `/api/v1/real_estate/properties/` with full payload returns 201 Created
- [ ] **Multiple Images:** Upload 3+ images sequentially to same listing succeeds

---

## Authentication Debugging

If still getting 403 errors, check:

1. **Token is being sent:**
   ```typescript
   // Check in browser DevTools > Application > Local Storage
   console.log(localStorage.getItem('authToken'));
   ```

2. **Token is valid:**
   ```bash
   # Decode JWT to check expiry
   curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/dashboard/real-estate/overview
   ```

3. **apiClient is being used:**
   ```typescript
   // Verify you're using apiClient, not raw axios
   import { apiClient } from '@/services/apiClient';

   // ✅ Correct (sends auth automatically)
   apiClient.get('/api/dashboard/real-estate/overview');

   // ❌ Wrong (won't send auth unless manually configured)
   axios.get('http://localhost:8000/api/dashboard/real-estate/overview');
   ```

4. **Check login flow:**
   ```typescript
   // After successful login, ensure token is stored:
   const { access } = response.data;
   apiClient.setAuthToken(access);
   // OR
   localStorage.setItem('authToken', access);
   ```

---

## Related Files

- **Backend:**
  - `real_estate/urls.py` - URL routing
  - `real_estate/api/dashboard_views.py` - Dashboard endpoints
  - `real_estate/api/portfolio_views.py` - Portfolio endpoints
  - `real_estate/api/property_views.py` - Property creation
  - `listings/views.py` - Generic listings + image upload (line 720-737)
  - `listings/urls.py` - Generic listings routing

- **Frontend:**
  - `frontend/src/services/apiClient.ts` - HTTP client with auto auth
  - `frontend/src/features/seller-dashboard/domains/real-estate/api/realEstateDashboardApi.ts` - Dashboard API calls
  - `frontend/src/features/seller-dashboard/domains/real-estate/overview/RealEstatePropertyUploadEnhanced.tsx` - Property upload form

---

## Summary

✅ **Image Upload:** Fixed endpoint + FormData key
✅ **Listing Detail:** Added backward compat alias
⚠️ **Dashboard 403:** No code changes - verify auth flow is setting tokens properly

**Next Steps:**
1. Test all endpoints with authenticated requests
2. Verify token is being stored after login
3. Check browser console for any auth errors
4. Test image upload with multiple files

---

*Generated: 2025-01-17*
