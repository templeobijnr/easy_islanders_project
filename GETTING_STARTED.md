# 🚀 Getting Started – Phase 0 & 1 Implementation

## Start Here

You're about to implement **Authentication + Create Listing** for Easy Islanders marketplace using Test-Driven Development.

**Time to complete:** 1-2 weeks
**Tests to write:** 55+
**Zero breaking changes:** ✅ Guaranteed by RED GATE

---

## Step 1: Review the Plan (30 minutes)

Read these sections from **AUTH_AND_LISTING_TDD_PLAN.md**:

```
1. Overview (what you're building)
2. Architecture Summary (how it fits together)
3. Phase Structure (what phases 0 & 1 include)
```

**Why?** Understand the big picture before coding.

---

## Step 2: Setup Test Environment (30 minutes)

### Install Test Dependencies

```bash
cd /Users/apple_trnc/Desktop/work/easy_islanders_project

# Install testing tools
pip install pytest pytest-django pytest-cov

# Verify installation
pytest --version
```

### Create Test Directory Structure

```bash
# Create tests directory if it doesn't exist
mkdir -p tests
touch tests/__init__.py

# Create test files (empty for now)
touch tests/test_authentication.py
touch tests/test_create_listing.py
```

### Configure pytest.ini (Already exists)

Verify `pytest.ini` exists in project root:

```bash
cat pytest.ini
```

---

## Step 3: Write Phase 0 Tests (Authentication)

### Read the Plan

Open **AUTH_AND_LISTING_TDD_PLAN.md** and go to:
- **Section 0.2: Tests for Authentication**

### Copy Test Code

The plan provides complete test code. Copy from:

**File:** `tests/test_authentication.py`

Content includes:
- `TestUserModel` (8 tests)
- `TestAuthenticationAPI` (10 tests)
- `TestRBACEnforcement` (7 tests)

### Run Tests (They Will Fail - Expected!)

```bash
# Run all auth tests
pytest tests/test_authentication.py -v

# Expected output:
# FAILED test_authentication.py::TestUserModel::test_create_consumer_user
# ModuleNotFoundError: No module named 'assistant.models.User'
```

**This is correct!** Tests fail because code doesn't exist yet. This is TDD.

---

## Step 4: Implement Authentication Backend

### Read the Plan

Go to **AUTH_AND_LISTING_TDD_PLAN.md**:
- **Section 0.1: User Model with RBAC**
- **Section 0.3: Authentication Implementation**
- **Section 0.4: RBAC Middleware**

### Create Files

Create these files:

**1. Update assistant/models.py**
- Add `User` model (extend AbstractUser)
- Add `BusinessProfile` model

**2. Create assistant/views/auth.py**
- Add `SignupView`
- Add `LoginView`
- Add `LogoutView`

**3. Create assistant/middleware/rbac.py**
- Add `@require_user_type` decorator
- Add `@require_verified_business` decorator

### Run Tests Again

```bash
pytest tests/test_authentication.py -v

# Should see more tests passing
```

### Run RED GATE Tests (Critical!)

```bash
# Verify existing property search still works
pytest tests/test_existing_property_search_unchanged.py -v

# MUST see 8/8 passing
```

---

## Step 5: Write Phase 1 Tests (Create Listing)

### Read the Plan

Go to **AUTH_AND_LISTING_TDD_PLAN.md**:
- **Section 1.3: Tests for Create Listing**

### Copy Test Code

Copy all test code into `tests/test_create_listing.py`:
- `TestCreateListingForm` (18 tests)
- `TestImageUpload` (2 tests)

### Run Tests

```bash
pytest tests/test_create_listing.py -v

# Expected: Many failures (code not written yet)
```

---

## Step 6: Implement Create Listing Backend

### Read the Plan

Go to **AUTH_AND_LISTING_TDD_PLAN.md**:
- **Section 1.1: Category & Subcategory Models**
- **Section 1.2: Dynamic Field Schema**

### Create Files

**1. Create assistant/models/listing_schema.py**
- Add `ListingFieldSchema` model
- Add `ListingFieldValues` model

**2. Update assistant/models.py**
- Import new models
- Ensure Category/Subcategory exist

**3. Create assistant/views/listing.py** (or extend existing)
- Add listing creation endpoint
- Add category retrieval endpoint
- Add image upload handler

### Run Tests

```bash
pytest tests/test_create_listing.py -v

# Tests should pass as you implement
```

---

## Step 7: Implement Frontend (React)

### Read the Plan

Go to **AUTH_AND_LISTING_TDD_PLAN.md**:
- **Section 1.4: Frontend: Create Listing Component**

### Create Files

**Create frontend/src/pages/CreateListing.jsx**

Copy the React component code from the plan:
- State management (form data, images, categories)
- Category/subcategory selection
- Dynamic fields rendering
- Image upload with preview
- Form submission to API

### Update Routes

Add route to your React router:

```jsx
import CreateListing from './pages/CreateListing';

<Route path="/create-listing" element={<CreateListing />} />
```

---

## Step 8: Create Database Migrations

### Create Migration Files

```bash
# Create migration for auth models
python manage.py makemigrations assistant --name auth_and_listing

# Review migration
cat assistant/migrations/0003_auth_and_listing.py
```

### Run Migration

```bash
python manage.py migrate
```

### Verify Database

```bash
# Check that new tables exist
python manage.py shell
>>> from django.contrib.auth import get_user_model
>>> User = get_user_model()
>>> User.objects.count()
0
```

---

## Step 9: Validate Everything

### Run All Phase 0 & 1 Tests

```bash
# Run all new tests
pytest tests/test_authentication.py tests/test_create_listing.py -v

# Expected: 55+ tests passing
```

### Run RED GATE (Most Important)

```bash
# Verify existing property search never broke
pytest tests/test_existing_property_search_unchanged.py -v

# MUST see 8/8 passing
```

### Check Code Coverage

```bash
# Generate coverage report
pytest tests/ --cov=assistant --cov-report=html

# Open htmlcov/index.html to see coverage
# Target: ≥80%
```

---

## Step 10: Integrate with Existing Code

### Update Django URLs

In `assistant/urls.py`, add:

```python
from assistant.views.auth import SignupView, LoginView, LogoutView

urlpatterns = [
    # ... existing paths ...
    path('auth/signup/', SignupView.as_view()),
    path('auth/login/', LoginView.as_view()),
    path('auth/logout/', LogoutView.as_view()),
    # Create Listing endpoints
    path('listings/', ListingView.as_view()),
    path('categories/', CategoriesView.as_view()),
]
```

### Update Django Settings

In `easy_islanders/settings/base.py`:

```python
# Add to INSTALLED_APPS if not present
INSTALLED_APPS = [
    # ...
    'rest_framework',
    'rest_framework_simplejwt',
]

# Add JWT settings
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
}

# Custom user model
AUTH_USER_MODEL = 'assistant.User'
```

### Update Frontend Config

In `frontend/src/config.js`:

```javascript
export const API_BASE_URL = 'http://localhost:8000/api';

export const ENDPOINTS = {
  SIGNUP: '/auth/signup/',
  LOGIN: '/auth/login/',
  LOGOUT: '/auth/logout/',
  CATEGORIES: '/categories/',
  LISTINGS: '/listings/',
  // ... existing endpoints ...
};
```

---

## Checklist: Phase 0 & 1 Complete

- [ ] **Tests Written** (55+)
  - [ ] test_authentication.py (25 tests)
  - [ ] test_create_listing.py (30 tests)

- [ ] **Backend Implemented**
  - [ ] User model with user_type
  - [ ] BusinessProfile model
  - [ ] SignupView, LoginView, LogoutView
  - [ ] RBAC middleware
  - [ ] ListingFieldSchema models
  - [ ] Listing CRUD endpoints
  - [ ] Image upload handler

- [ ] **Frontend Implemented**
  - [ ] CreateListing.jsx component
  - [ ] Auth modal components
  - [ ] Category selection
  - [ ] Dynamic fields
  - [ ] Image upload

- [ ] **Database**
  - [ ] Migrations created
  - [ ] Database tables exist
  - [ ] Can create users

- [ ] **Testing**
  - [ ] 55+ tests passing
  - [ ] RED GATE: 8/8 tests passing
  - [ ] Coverage ≥80%

- [ ] **Integration**
  - [ ] URLs configured
  - [ ] Settings updated
  - [ ] Frontend config updated
  - [ ] Can signup/login from frontend
  - [ ] Can create listing from frontend

---

## Quick Command Reference

```bash
# Install dependencies
pip install pytest pytest-django pytest-cov

# Run tests
pytest tests/test_authentication.py -v
pytest tests/test_create_listing.py -v

# Run RED GATE (CRITICAL)
pytest tests/test_existing_property_search_unchanged.py -v

# Run all tests
pytest tests/ -v

# Coverage report
pytest tests/ --cov=assistant --cov-report=html

# Create migrations
python manage.py makemigrations

# Run migrations
python manage.py migrate

# Create superuser (for admin)
python manage.py createsuperuser

# Run development server
python manage.py runserver
```

---

## Troubleshooting

### Tests Import Fails
```
Error: ModuleNotFoundError: No module named 'assistant.models'
```
**Solution:** Ensure you've created all model classes before running tests.

### Migration Errors
```
Error: RuntimeError: Model 'assistant.User' conflicts with built-in User model
```
**Solution:** Add `AUTH_USER_MODEL = 'assistant.User'` to settings.

### RED GATE Tests Fail
```
FAILED test_existing_property_search_unchanged.py::...
```
**Solution:** This is CRITICAL. Don't commit. Check what changed in property search code.

### API Endpoints Return 404
```
Error: 404 Not Found
```
**Solution:** Check `assistant/urls.py` has new endpoints registered.

---

## Next Steps After Phase 0 & 1

Once complete with 55+ tests passing:

1. **Begin Phase 2:** Multi-category AI agent
   - Read: `AGENT_TDD_IMPLEMENTATION_PLAN.md`
   - Tests for classification engine
   - Tool registry implementation

2. **Enable Feature Flags:**
   - Turn on `multi_category_search` (5% of users)
   - Monitor for issues
   - Expand canary rollout

3. **Test with Real Users:**
   - Get feedback on Create Listing UX
   - Monitor auth flows
   - Track registration/login metrics

---

## Documentation Reference

| Document | Purpose |
|----------|---------|
| **AUTH_AND_LISTING_TDD_PLAN.md** | Complete implementation guide (this is your main reference) |
| **AGENT_TDD_IMPLEMENTATION_PLAN.md** | Phase 2-6 (after Phase 0 & 1 complete) |
| **AGENT_TDD_QUICK_START.md** | Quick reference |
| **GETTING_STARTED.md** | This file |

---

## You're Ready! 🚀

You have:
✅ Complete test code (copy/paste ready)
✅ Complete implementation code (copy/paste ready)
✅ Clear step-by-step guide
✅ RED GATE protection
✅ Success criteria

**Start with Step 1: Review the Plan**

Good luck! You've got this. 💪
