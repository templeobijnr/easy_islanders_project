# Epic 0.3: Social & Advanced Authentication

## Overview

Implement Google and Facebook OAuth2 authentication to allow users to sign up and log in using their social media accounts, eliminating the need to remember credentials.

## Implementation Strategy

### Phase A: Backend Setup (TDD - Tests First)

#### Step 1: Create Social Auth Tests
**File:** `tests/test_social_auth.py`

Test cases to write FIRST (TDD):
1. ✅ User can authenticate with Google token
2. ✅ User can authenticate with Facebook token
3. ✅ Social login creates user if doesn't exist
4. ✅ Social login links to existing user if email matches
5. ✅ Social profile data is stored correctly
6. ✅ Existing email prevents duplicate registration
7. ✅ Social auth returns JWT tokens
8. ✅ Social auth determines user_type correctly

#### Step 2: Install django-allauth
```bash
pip install django-allauth
```

#### Step 3: Configure django-allauth
**File:** `easy_islanders/settings/base.py`

Add to INSTALLED_APPS:
```python
'django.contrib.sites',
'allauth',
'allauth.account',
'allauth.socialaccount',
'allauth.socialaccount.providers.google',
'allauth.socialaccount.providers.facebook',
```

Add settings:
```python
SITE_ID = 1

SOCIALACCOUNT_PROVIDERS = {
    'google': {
        'SCOPE': ['email', 'profile'],
        'AUTH_PARAMS': {'access_type': 'online'},
    },
    'facebook': {
        'METHOD': 'oauth2',
        'SCOPE': ['email'],
        'AUTH_PARAMS': {'auth_type': 'reauthenticate'},
        'INIT_PARAMS': {'cookie': True},
        'FIELDS': [
            'id',
            'first_name',
            'last_name',
            'middle_name',
            'name',
            'name_format',
            'picture',
            'email'
        ],
    }
}

SOCIALACCOUNT_AUTO_SIGNUP = True
SOCIALACCOUNT_EMAIL_VERIFICATION = 'optional'
```

#### Step 4: Create Social Auth API Views
**File:** `users/views.py` (add new views)

New views to create:
1. `GoogleAuthView` - Handle Google OAuth tokens
2. `FacebookAuthView` - Handle Facebook OAuth tokens
3. `SocialUserCreateView` - Create/link user from social data

#### Step 5: Add URL Routes
**File:** `users/urls.py`

New routes:
```python
path('auth/google/', GoogleAuthView.as_view(), name='google-auth'),
path('auth/facebook/', FacebookAuthView.as_view(), name='facebook-auth'),
```

#### Step 6: Create Social Auth Serializers
**File:** `users/serializers.py` (create if not exists)

Serializers needed:
1. `GoogleTokenSerializer` - Validate Google token
2. `FacebookTokenSerializer` - Validate Facebook token
3. `SocialUserSerializer` - Return user data after social auth

#### Step 7: Run Tests & Fix Issues
```bash
pytest tests/test_social_auth.py -v
```

### Phase B: Frontend Implementation

#### Step 1: Install OAuth Libraries
```bash
npm install @react-oauth/google
npm install react-facebook-login
```

#### Step 2: Add Google OAuth Provider Wrapper
**File:** `frontend/src/index.js` (or App.js wrapper)

Wrap app with GoogleOAuthProvider:
```jsx
import { GoogleOAuthProvider } from '@react-oauth/google';

<GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
  <App />
</GoogleOAuthProvider>
```

#### Step 3: Update AuthModal Component
**File:** `frontend/src/components/auth/AuthModal.jsx`

Add sections:
1. Google "Sign in with Google" button
2. Facebook "Sign in with Facebook" button
3. OR divider between social and email login
4. Handle token exchange with backend
5. Store JWT tokens in localStorage
6. Redirect to dashboard after login

#### Step 4: Create Social Auth Utils
**File:** `frontend/src/utils/socialAuth.js`

Helper functions:
1. `exchangeGoogleToken(credential)` - Send Google token to backend
2. `exchangeFacebookToken(token)` - Send Facebook token to backend
3. `handleSocialAuthResponse(response)` - Process auth response

#### Step 5: Update AuthContext
**File:** `frontend/src/contexts/AuthContext.jsx`

Add methods:
1. `loginWithGoogle(credential)`
2. `loginWithFacebook(accessToken)`
3. Handle both successful and error cases

### Phase C: Deployment & Configuration

#### Step 1: Get Google OAuth Credentials
1. Go to https://console.cloud.google.com/
2. Create new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials (Web Application)
5. Add authorized redirect URIs
6. Copy Client ID

#### Step 2: Get Facebook OAuth Credentials
1. Go to https://developers.facebook.com/
2. Create new app
3. Add Facebook Login product
4. Configure OAuth redirect URIs
5. Copy App ID and App Secret

#### Step 3: Set Environment Variables
**File:** `.env`

```
GOOGLE_OAUTH_CLIENT_ID=your_google_client_id
FACEBOOK_OAUTH_APP_ID=your_facebook_app_id
```

#### Step 4: Configure django-allauth in Admin
1. Go to Django admin: `/admin/sites/site/1/change/`
2. Set Domain name and Display name
3. Go to `/admin/socialaccount/socialapp/`
4. Add Google provider with Client ID and Secret
5. Add Facebook provider with App ID and Secret

## Implementation Order

1. **Write Tests First** (TDD) - `tests/test_social_auth.py`
2. **Backend Setup** - django-allauth configuration
3. **Backend Views** - Create API endpoints
4. **Run & Fix Tests**
5. **Frontend UI** - Add buttons and forms
6. **Frontend Logic** - Token exchange and storage
7. **E2E Testing** - Full flow testing
8. **Deployment** - Set credentials, test production

## Success Criteria

✅ User can sign up with Google
✅ User can sign up with Facebook
✅ User can log in with Google
✅ User can log in with Facebook
✅ Social login creates account if new
✅ Social login links to existing account if email matches
✅ JWT tokens returned after social auth
✅ User redirected to dashboard after login
✅ All 23 existing tests still pass
✅ New social auth tests pass (8 tests)
✅ No regressions

## Timeline Estimate

- Backend setup & tests: 2-3 hours
- Frontend UI: 1-2 hours
- E2E testing & fixes: 1-2 hours
- **Total: 4-7 hours**

## Files to Create

1. `tests/test_social_auth.py` - 8 tests
2. `users/serializers.py` - Social auth serializers
3. `frontend/src/utils/socialAuth.js` - Social auth utilities
4. `frontend/src/components/auth/SocialAuthButtons.jsx` (optional) - Reusable component

## Files to Modify

1. `easy_islanders/settings/base.py` - Add django-allauth config
2. `users/views.py` - Add social auth views
3. `users/urls.py` - Add social auth routes
4. `frontend/src/components/auth/AuthModal.jsx` - Add social buttons
5. `frontend/src/contexts/AuthContext.jsx` - Add social auth methods
6. `frontend/src/index.js` (or App.js) - GoogleOAuthProvider wrapper

## Error Handling

Common issues to handle:
1. Token expired - Refresh token or re-authenticate
2. Email already exists - Link to existing account or show error
3. Social provider disconnected - Clear token and ask to re-authenticate
4. Network error - Retry or fall back to email login
5. Invalid token - Show error and ask to try again

## Security Considerations

✅ Use HTTPS only
✅ Validate tokens on backend
✅ Store tokens securely (HttpOnly cookies for refresh token)
✅ Rate limit auth endpoints
✅ Log authentication attempts
✅ Implement CSRF protection
✅ Use secure random state for OAuth flow
✅ Validate redirect URIs

## Next Steps After Epic 0.3

1. ✅ Complete Epic 0.3 (this document)
2. Verify all tests passing (23 existing + 8 new = 31 tests)
3. Run full CI/CD pipeline
4. **Phase 0 Complete** ✅
5. Start Phase 1 (Booking System & Stripe)

---

Ready to start implementation? Follow the steps in order!
