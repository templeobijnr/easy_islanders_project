# Seller Dashboard - Quick Start Guide

Get the multi-domain seller dashboard running in 30 minutes.

---

## 5-Minute Setup

### 1. Create Django App

```bash
cd easy_islanders_project
python manage.py startapp seller_portal
```

### 2. Add to INSTALLED_APPS

**File:** `easy_islanders/settings/base.py`

```python
INSTALLED_APPS = [
    # ...existing apps...
    'seller_portal',
]
```

### 3. Copy Backend Code

Copy the three files from `SELLER_DASHBOARD_CODE_TEMPLATES.md`:

1. `seller_portal/views.py` - Aggregator endpoints
2. `seller_portal/urls.py` - Route registration
3. Create `listings/base_domain_service.py` - Base class
4. Create `real_estate/services.py` - Reference implementation

### 4. Register URLs

**File:** `easy_islanders/urls.py`

```python
from django.urls import path, include

urlpatterns = [
    # ...existing patterns...
    path('api/seller/', include('seller_portal.urls')),
]
```

### 5. Run Migrations (if needed)

```bash
python manage.py migrate
```

### 6. Test Backend Endpoint

```bash
# Start dev server
python manage.py runserver

# In another terminal, test the endpoint
curl http://localhost:8000/api/seller/overview/ \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

You should see JSON response with `business_name`, `total_listings`, etc.

---

## Create React Components (10 minutes)

### 1. Create Directory Structure

```bash
mkdir -p frontend/src/features/seller-dashboard/{components,hooks,types}
touch frontend/src/features/seller-dashboard/index.ts
```

### 2. Copy Hook File

Copy `useDomainServices.ts` from templates → `frontend/src/features/seller-dashboard/hooks/`

### 3. Copy Components

Copy these from templates to `frontend/src/features/seller-dashboard/components/`:
- `SellerDashboard.tsx`
- `DomainMetricsCard.tsx`
- `UnifiedListingsTable.tsx`

### 4. Export from Index

**File:** `frontend/src/features/seller-dashboard/index.ts`

```typescript
export { SellerDashboard } from './components/SellerDashboard';
export { DomainMetricsCard } from './components/DomainMetricsCard';
export { UnifiedListingsTable } from './components/UnifiedListingsTable';
```

### 5. Add Route to App

**File:** `frontend/src/App.tsx` (or routing file)

```typescript
import { SellerDashboard } from '@/features/seller-dashboard';

// Add to routes
<Route path="/seller-dashboard" element={<SellerDashboard />} />
```

### 6. Test in Browser

```bash
cd frontend
npm start

# Visit http://localhost:3000/seller-dashboard
```

---

## Verify Everything Works

### Backend Checks

```bash
# 1. Check service loads
python manage.py shell
>>> from real_estate.services import RealEstateDomainService
>>> service = RealEstateDomainService()
>>> print(service.domain_slug)
real_estate

# 2. Test endpoint
curl http://localhost:8000/api/seller/overview/ \
  -H "Authorization: Bearer <token>"
```

### Frontend Checks

- [ ] Dashboard loads without errors
- [ ] KPI cards show numbers
- [ ] Listings table renders
- [ ] Filtering works
- [ ] Pagination works

---

## Common Issues & Fixes

### Issue: "ModuleNotFoundError: No module named 'seller_portal'"

**Solution:** Ensure `seller_portal` is in `INSTALLED_APPS` and you ran `migrate`

```bash
python manage.py migrate seller_portal
```

### Issue: "API returns 403 Forbidden"

**Solution:** Make sure you're using authenticated request with valid JWT

```bash
# Get JWT token
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "user", "password": "pass"}'

# Use token in requests
curl http://localhost:8000/api/seller/overview/ \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

### Issue: "Dashboard shows 'Not a business user'"

**Solution:** Create a BusinessProfile for your test user

```bash
python manage.py shell
>>> from users.models import User, BusinessProfile
>>> user = User.objects.first()
>>> BusinessProfile.objects.create(user=user, business_name="Test")
```

### Issue: "No data shows in dashboard"

**Solution:** Create some test listings

```bash
python manage.py shell
>>> from real_estate.models import Listing
>>> from users.models import User
>>> user = User.objects.first()
>>> Listing.objects.create(
...     owner=user,
...     title="Test Property",
...     price_amount=100,
...     status='active',
... )
```

---

## Next Steps

### Week 1 Checklist
- [ ] Backend scaffold complete
- [ ] Frontend shell working
- [ ] Real Estate service implemented
- [ ] `/api/seller/overview/` tested and working

### Week 2 Checklist
- [ ] Dashboard component fully functional
- [ ] Listings table working
- [ ] Bookings table working
- [ ] Status filtering works

### Week 3 Checklist
- [ ] Events domain service implemented
- [ ] Activities domain service implemented
- [ ] Appointments domain service implemented
- [ ] All 4 domains aggregating correctly

### Week 4 Checklist
- [ ] Analytics endpoint working
- [ ] Revenue chart rendering
- [ ] Booking trends visible
- [ ] Performance optimized (< 1s load time)

---

## File Checklist

### Backend Files to Create/Edit

```
✅ seller_portal/
  ├── __init__.py
  ├── apps.py
  ├── views.py          ← Copy from SELLER_DASHBOARD_CODE_TEMPLATES.md
  ├── urls.py           ← Copy from SELLER_DASHBOARD_CODE_TEMPLATES.md
  ├── models.py         ← Leave empty (aggregator only)
  └── tests.py
  
✅ listings/
  └── base_domain_service.py  ← Copy from templates
  
✅ real_estate/
  └── services.py       ← Copy from templates

✅ easy_islanders/
  └── urls.py           ← Add: path('api/seller/', include('seller_portal.urls'))
  └── settings/base.py  ← Add: 'seller_portal' to INSTALLED_APPS
```

### Frontend Files to Create/Edit

```
✅ frontend/src/features/seller-dashboard/
  ├── index.ts
  ├── components/
  │   ├── SellerDashboard.tsx       ← Copy from templates
  │   ├── DomainMetricsCard.tsx     ← Copy from templates
  │   └── UnifiedListingsTable.tsx  ← Copy from templates
  ├── hooks/
  │   └── useDomainServices.ts      ← Copy from templates
  └── types/
      └── dashboard.ts              ← (Optional) TypeScript types

✅ frontend/src/
  └── App.tsx           ← Add route to SellerDashboard
```

---

## Commands Reference

### Development

```bash
# Backend dev server
python manage.py runserver

# Frontend dev server
cd frontend && npm start

# Run backend tests
pytest

# Run frontend tests
cd frontend && npm test

# View seller dashboard in browser
http://localhost:3000/seller-dashboard
```

### Debugging

```bash
# Test service directly
python manage.py shell
from real_estate.services import RealEstateDomainService
from users.models import User
user = User.objects.first()
service = RealEstateDomainService()
print(service.get_metrics(user))

# View API response
curl http://localhost:8000/api/seller/overview/ -H "Authorization: Bearer <token>" | python -m json.tool

# Database queries
# Set DEBUG=True in settings and use django-debug-toolbar
```

---

## Performance Tips

### Backend Optimization

```python
# Use select_related and prefetch_related to reduce queries
listings = Listing.objects.filter(owner=user).select_related('category').prefetch_related('images')

# Cache domain service results
from django.core.cache import cache
cache_key = f"seller_overview_{user.id}"
cached_data = cache.get(cache_key)
if not cached_data:
    # Compute and cache for 5 minutes
    cached_data = compute_metrics()
    cache.set(cache_key, cached_data, 300)
```

### Frontend Optimization

```typescript
// Use React Query's staleTime to reduce unnecessary refetches
useQuery({
  queryKey: ['seller-overview'],
  queryFn: fetchOverview,
  staleTime: 5 * 60 * 1000,  // 5 minutes
});

// Memoize expensive components
const MemoizedTable = React.memo(UnifiedListingsTable);

// Virtualize large lists
import { FixedSizeList } from 'react-window';
```

---

## Architecture Review

Before moving to Week 2, verify:

1. **Service Pattern Correct**
   - [ ] Each domain service has the same interface
   - [ ] Services return consistent data structure
   - [ ] Factory pattern works for dynamic loading

2. **API Contracts**
   - [ ] `/api/seller/overview/` returns aggregated metrics
   - [ ] Includes: business_id, total_listings, total_bookings, total_revenue, domains[]
   - [ ] Each domain in response includes: domain, total_listings, total_bookings, revenue

3. **Frontend Wiring**
   - [ ] Component reads from correct hooks
   - [ ] Hooks call correct endpoints
   - [ ] Data flows: API → Hook → Component → UI

4. **Error Handling**
   - [ ] API returns 403 if not a business user
   - [ ] Components handle loading/error states
   - [ ] No crashes on missing data

---

## Support & Help

### Documentation
- [MULTI_DOMAIN_DASHBOARD_ARCHITECTURE.md](./MULTI_DOMAIN_DASHBOARD_ARCHITECTURE.md) - Full architecture
- [SELLER_DASHBOARD_IMPLEMENTATION_PLAN.md](./SELLER_DASHBOARD_IMPLEMENTATION_PLAN.md) - Week-by-week plan
- [SELLER_DASHBOARD_CODE_TEMPLATES.md](./SELLER_DASHBOARD_CODE_TEMPLATES.md) - All code templates
- [API_CONTRACTS.md](./API_CONTRACTS.md) - API specs

### Debugging
- Check browser console for React errors
- Check terminal for Django errors
- Use `python manage.py shell` to test services directly
- Use network tab in DevTools to inspect API responses

### Getting Unstuck
1. Check if error is in the "Common Issues" section above
2. Review the relevant code template
3. Add `print()` statements or Django debugger to trace issue
4. Check Django/React logs for stack traces

---

**Happy coding! 🚀**

You should have a working seller dashboard in 30 minutes. Then build on it week by week.
