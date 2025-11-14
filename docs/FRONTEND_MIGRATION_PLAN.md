# Frontend Migration Plan

## Table of Contents

1. [Overview](#overview)
2. [Migration Goals](#migration-goals)
3. [Phase 1: HTTP Client Consolidation](#phase-1-http-client-consolidation)
4. [Phase 2: UI Kit Unification](#phase-2-ui-kit-unification)
5. [Phase 3: Legacy Pages Migration](#phase-3-legacy-pages-migration)
6. [Phase 4: TypeScript Adoption](#phase-4-typescript-adoption)
7. [Phase 5: Testing & Quality](#phase-5-testing--quality)
8. [Migration Tracking](#migration-tracking)
9. [Rollback Strategy](#rollback-strategy)

---

## Overview

This document outlines the roadmap to migrate the Easy Islanders frontend from a hybrid JS/TS architecture with multiple HTTP clients and UI kits to a unified TypeScript-first, feature-sliced architecture.

### Current State

- **Mixed JS/JSX and TypeScript**
- **3 HTTP clients** (`api.js`, `apiClient.ts`, `lib/axios.ts`)
- **2 UI kits** (`components/ui/*` and `@/components/ui/*`)
- **Legacy pages** under `src/pages/*.jsx`
- **New features** under `src/features/*`

### Target State

- **100% TypeScript** (except config files)
- **Single HTTP client** (`apiClient.ts`)
- **Single UI kit** (`components/ui/*`)
- **All pages** as feature wrappers
- **Full test coverage**

### Migration Principles

1. **Incremental**: Migrate one module at a time
2. **Non-breaking**: Maintain backward compatibility during transition
3. **Tested**: Add tests before and after migration
4. **Documented**: Update docs as we go
5. **Reversible**: Easy rollback if issues arise

---

## Migration Goals

### Business Goals

- **Faster Development**: Single stack reduces context switching
- **Fewer Bugs**: TypeScript catches errors at compile time
- **Better UX**: Consistent UI components and patterns
- **Easier Onboarding**: Clear architecture for new developers
- **Scalable**: Ready for multi-domain expansion

### Technical Goals

- **Single HTTP Client**: Typed, consistent error handling
- **Single UI Kit**: No duplicate components
- **100% TypeScript**: Type safety across the board
- **Feature-Sliced**: Clear module boundaries
- **Tested**: 80%+ test coverage

---

## Phase 1: HTTP Client Consolidation

**Goal**: Migrate from 3 HTTP clients to 1 typed client.

**Duration**: 2-3 sprints

### Current HTTP Clients

| Client | Location | Used By | Issues |
|--------|----------|---------|--------|
| `http` (axios) | `src/api.js` | Legacy pages, AuthContext | JS, no types, duplicate interceptors |
| `apiClient` (fetch) | `src/services/apiClient.ts` | New features, useListings | Incomplete (missing methods) |
| `api` (axios) | `src/lib/axios.ts` | Some hooks | Duplicate of api.js |
| Global interceptor | `src/index.tsx` | All axios | Conflicts with others |

### Target Architecture

**Single Client**: `src/services/apiClient.ts` (fetch-based, typed)

### Step 1.1: Complete ApiClient Implementation

**Deliverables**:

```ts
// src/services/apiClient.ts

export class ApiClient {
  private baseURL: string;
  private getToken: () => string | null;

  constructor(baseURL: string, getToken: () => string | null) {
    this.baseURL = baseURL;
    this.getToken = getToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new ApiError(response.status, error.message, error);
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Domain-specific methods
  async getListings(filters?: ListingFilters): Promise<ListingsResponse> {
    const params = new URLSearchParams(filters as any).toString();
    return this.get(`/api/listings/${params ? `?${params}` : ''}`);
  }

  async getCategories(): Promise<CategoriesResponse> {
    return this.get('/api/categories/');
  }

  async getRealEstateMetrics(userId: string): Promise<RealEstateMetrics> {
    return this.get(`/api/real-estate/metrics/${userId}/`);
  }

  // ... more domain methods
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Instance with token getter from AuthContext
export const apiClient = new ApiClient(
  config.apiBaseUrl,
  () => localStorage.getItem('token')
);
```

**Tasks**:
- [ ] Add all HTTP methods (GET, POST, PUT, PATCH, DELETE)
- [ ] Add error handling with custom ApiError class
- [ ] Add request/response interceptors (for logging, etc.)
- [ ] Add retry logic for network failures
- [ ] Add timeout configuration
- [ ] Add unit tests for ApiClient

**Acceptance Criteria**:
- All HTTP methods implemented and tested
- Error handling with proper TypeScript types
- Token injection working
- Response types enforced

---

### Step 1.2: Migrate AuthContext to ApiClient

**Current**: Uses `http` from `api.js`

**Target**: Use `apiClient`

**File**: `src/shared/context/AuthContext.jsx` → `AuthContext.tsx`

**Changes**:

```diff
- import { http } from '../../api';
+ import { apiClient } from '../../services/apiClient';

  const login = async (credentials) => {
-   const response = await http.post('/api/auth/login/', credentials);
+   const response = await apiClient.post('/api/auth/login/', credentials);
    // ...
  };
```

**Tasks**:
- [ ] Convert `AuthContext.jsx` to `AuthContext.tsx`
- [ ] Replace `http` with `apiClient`
- [ ] Add TypeScript types for auth responses
- [ ] Add unit tests
- [ ] Test login/signup/logout flows

**Acceptance Criteria**:
- AuthContext fully typed
- Uses `apiClient` exclusively
- All auth flows working
- No regressions

---

### Step 1.3: Migrate Legacy Hooks

**Affected Hooks**:

| Hook | Current Client | Location |
|------|----------------|----------|
| `useSellerDashboard.js` | `api.js` | `src/hooks/` |
| `useMessages.js` | `api.js` | `src/hooks/` |
| `useThreadManager.js` | `api.js` | `src/hooks/` |

**Migration Pattern**:

```diff
// useSellerDashboard.js → useSellerDashboard.ts

- import { http } from '../api';
+ import { apiClient } from '../services/apiClient';
+ import type { DashboardData } from '../types/dashboard';

- export const useSellerDashboard = () => {
+ export const useSellerDashboard = (): UseDashboardResult => {
    const [data, setData] = useState(null);
+   const [isLoading, setIsLoading] = useState(false);
+   const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
+     setIsLoading(true);
-     http.get('/api/dashboard/')
-       .then(res => setData(res.data))
-       .catch(console.error);
+     apiClient.getDashboard()
+       .then(setData)
+       .catch(setError)
+       .finally(() => setIsLoading(false));
    }, []);

-   return { data };
+   return { data, isLoading, error };
  };
```

**Tasks**:
- [ ] Migrate `useSellerDashboard.js` → `.ts`
- [ ] Migrate `useMessages.js` → `.ts`
- [ ] Migrate `useThreadManager.js` → `.ts`
- [ ] Add proper TypeScript types
- [ ] Add error handling
- [ ] Add loading states
- [ ] Add unit tests

**Acceptance Criteria**:
- All hooks use `apiClient`
- Fully typed with proper error handling
- Tests pass

---

### Step 1.4: Migrate Legacy Pages

**Affected Pages**:

| Page | Current Client | Location |
|------|----------------|----------|
| `CreateListing.jsx` | `api.js` | `src/pages/` |
| `Bookings.jsx` | `api.js` | `src/pages/` |
| `Messages.jsx` | `api.js` | `src/pages/` |
| `Requests.jsx` | `api.js` | `src/pages/` |

**Migration Pattern**:

```diff
// Bookings.jsx → Bookings.tsx

- import { http } from '../api';
+ import { apiClient } from '../services/apiClient';
+ import type { Booking } from '../types/booking';

- const Bookings = () => {
+ const Bookings: React.FC = () => {
    const [bookings, setBookings] = useState([]);
+   const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
-     http.get('/api/bookings/')
-       .then(res => setBookings(res.data))
-       .catch(console.error);
+     setIsLoading(true);
+     apiClient.get<Booking[]>('/api/bookings/')
+       .then(setBookings)
+       .finally(() => setIsLoading(false));
    }, []);

    // ...
  };
```

**Tasks**:
- [ ] Migrate each legacy page to use `apiClient`
- [ ] Add TypeScript types
- [ ] Add loading/error states
- [ ] Add unit tests

**Acceptance Criteria**:
- Pages use `apiClient` exclusively
- Proper error handling
- No regressions

---

### Step 1.5: Remove Old Clients

**Once all migrations are complete**:

**Tasks**:
- [ ] Delete `src/api.js`
- [ ] Delete `src/lib/axios.ts`
- [ ] Remove global axios interceptor from `index.tsx`
- [ ] Add ESLint rule: `no-restricted-imports` for axios
- [ ] Update documentation

**ESLint Rule**:

```json
{
  "rules": {
    "no-restricted-imports": [
      "error",
      {
        "paths": [
          {
            "name": "axios",
            "message": "Use apiClient from src/services/apiClient.ts instead"
          }
        ]
      }
    ]
  }
}
```

**Acceptance Criteria**:
- Old clients removed
- No imports of `axios` in new code
- All features working
- ESLint catches violations

---

## Phase 2: UI Kit Unification

**Goal**: Consolidate duplicate UI components into single source of truth.

**Duration**: 1-2 sprints

### Current State

**Two UI Kits**:

1. `src/components/ui/*` (primary)
2. `src/@/components/ui/*` (duplicate aliases)

**Duplicates**:
- button
- card
- badge
- tabs
- table

### Step 2.1: Audit UI Components

**Tasks**:
- [ ] List all components in `components/ui/*`
- [ ] List all components in `@/components/ui/*`
- [ ] Identify duplicates
- [ ] Identify differences (if any)
- [ ] Create migration mapping

**Deliverable**: UI Component Audit Spreadsheet

| Component | Primary Path | Alias Path | Differences | Migration Action |
|-----------|-------------|------------|-------------|------------------|
| Button | `components/ui/button.tsx` | `@/components/ui/button.ts` | None | Keep primary, remove alias |
| Card | `components/ui/card.tsx` | `@/components/ui/card.ts` | None | Keep primary, remove alias |
| ... | ... | ... | ... | ... |

---

### Step 2.2: Standardize on Primary Kit

**Decision**: Use `src/components/ui/*` as single source of truth.

**Tasks**:
- [ ] Ensure all components in `components/ui/*` are complete
- [ ] Add missing exports to `components/ui/index.ts`
- [ ] Update component documentation
- [ ] Add Storybook stories (optional)

**Barrel Export** (`components/ui/index.ts`):

```ts
export { Button } from './button';
export { Card, CardHeader, CardTitle, CardContent, CardFooter } from './card';
export { Badge } from './badge';
export { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';
export { Table, TableHeader, TableBody, TableRow, TableCell } from './table';
// ... etc.
```

---

### Step 2.3: Update Imports

**Find All Alias Imports**:

```bash
grep -r "@/components/ui" src/ --include="*.tsx" --include="*.ts"
```

**Migration Pattern**:

```diff
- import { Button } from '@/components/ui/button';
+ import { Button } from 'components/ui/button';
```

**Automated Migration** (codemod):

```js
// scripts/migrate-ui-imports.js
const { renameImport } = require('jscodeshift');

module.exports = function(fileInfo, api) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  root
    .find(j.ImportDeclaration)
    .filter(path => path.node.source.value.startsWith('@/components/ui/'))
    .forEach(path => {
      path.node.source.value = path.node.source.value.replace(
        '@/components/ui/',
        'components/ui/'
      );
    });

  return root.toSource();
};
```

**Run**:

```bash
npx jscodeshift -t scripts/migrate-ui-imports.js src/
```

**Tasks**:
- [ ] Create codemod script
- [ ] Run on all source files
- [ ] Manually review changes
- [ ] Test all pages
- [ ] Commit changes

---

### Step 2.4: Remove Alias Kit

**Once all imports are updated**:

**Tasks**:
- [ ] Delete `src/@/components/ui/` directory
- [ ] Remove `@` alias from tsconfig.json paths
- [ ] Add ESLint rule to prevent `@/components/ui` imports
- [ ] Update documentation

**TSConfig Change**:

```diff
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
-     "@/*": ["src/*"]
    }
  }
}
```

**ESLint Rule**:

```json
{
  "rules": {
    "no-restricted-imports": [
      "error",
      {
        "patterns": [
          {
            "group": ["@/components/ui/*"],
            "message": "Use components/ui/* instead of @/components/ui/*"
          }
        ]
      }
    ]
  }
}
```

**Acceptance Criteria**:
- Alias kit removed
- All imports use `components/ui/*`
- ESLint catches violations
- No regressions

---

## Phase 3: Legacy Pages Migration

**Goal**: Migrate all legacy JS/JSX pages to TypeScript feature modules.

**Duration**: 3-4 sprints

### Legacy Pages Inventory

| Page | Route | Status | Replacement |
|------|-------|--------|-------------|
| `CreateListing.jsx` | `/listings/create` | LEGACY | `features/listings/pages/CreateListingPage.tsx` |
| `Bookings.jsx` | `/bookings` | LEGACY | `features/bookings/BookingsPage.tsx` |
| `Messages.jsx` | `/messages` | LEGACY | `features/messaging/MessagesPage.tsx` |
| `Requests.jsx` | `/requests` | LEGACY | `features/seller-dashboard/.../RequestsPage.tsx` |
| `Profile.jsx` | `/profile` | LEGACY | `features/user/ProfilePage.tsx` |
| `Settings.jsx` | `/settings` | LEGACY | `features/user/SettingsPage.tsx` |

---

### Step 3.1: Create Feature Module Structure

**For each legacy page, create feature module**:

**Example**: Migrate `/bookings`

```
src/features/bookings/
├── BookingsPage.tsx          # Main page component
├── components/
│   ├── BookingCard.tsx
│   ├── BookingFilters.tsx
│   └── BookingStatus.tsx
├── hooks/
│   └── useBookings.ts
├── api/
│   └── bookingsApi.ts
└── types/
    └── booking.ts
```

**Tasks**:
- [ ] Create feature directory structure
- [ ] Define TypeScript types
- [ ] Implement API client methods
- [ ] Create typed hooks
- [ ] Build new components

---

### Step 3.2: Build Feature Parity

**Ensure new feature matches or exceeds legacy functionality**:

**Checklist** (per feature):
- [ ] All data fetching works
- [ ] All user actions work (create, edit, delete)
- [ ] All filters/search work
- [ ] Error handling
- [ ] Loading states
- [ ] Empty states
- [ ] Unit tests
- [ ] Integration tests

---

### Step 3.3: Feature Flag New Routes

**Use feature flags to gradually roll out new pages**:

```tsx
// app/routes.tsx

const useNewBookings = config.featureFlags.newBookings;

<Route
  path="/bookings"
  element={useNewBookings ? <BookingsPageNew /> : <BookingsPageLegacy />}
/>
```

**Tasks**:
- [ ] Add feature flag config
- [ ] Update routes with conditional rendering
- [ ] Test both legacy and new paths
- [ ] Monitor errors in production

---

### Step 3.4: Gradual Rollout

**Rollout Strategy** (per feature):

1. **Internal Testing** (1 week)
   - Enable for internal users
   - Gather feedback
   - Fix bugs

2. **Beta Testing** (1-2 weeks)
   - Enable for 10% of users
   - Monitor metrics
   - A/B test if needed

3. **Full Rollout** (1 week)
   - Enable for 100% of users
   - Monitor for regressions
   - Keep legacy fallback for 1 sprint

4. **Cleanup**
   - Remove feature flag
   - Delete legacy page
   - Update documentation

---

### Step 3.5: Remove Legacy Pages

**Once new features are stable**:

**Tasks** (per page):
- [ ] Remove feature flag
- [ ] Delete legacy `.jsx` file
- [ ] Remove from `routes.tsx`
- [ ] Update documentation
- [ ] Celebrate 🎉

**Acceptance Criteria**:
- All legacy pages migrated
- No `.jsx` files in `src/pages/` (except config)
- All routes use feature modules
- Test coverage maintained

---

## Phase 4: TypeScript Adoption

**Goal**: 100% TypeScript coverage (except config files).

**Duration**: Ongoing (parallel with other phases)

### Current TypeScript Coverage

**Estimate**: ~60% TypeScript, ~40% JavaScript

**JS Files to Migrate**:

| File | Type | Priority | Effort |
|------|------|----------|--------|
| `src/api.js` | HTTP Client | HIGH | Low (to be deleted) |
| `src/config.js` | Config | LOW | Low (can stay JS) |
| `src/shared/context/AuthContext.jsx` | Context | HIGH | Medium |
| `src/hooks/useAuthMigration.js` | Hook | MEDIUM | Low |
| `src/hooks/useSellerDashboard.js` | Hook | HIGH | Medium |
| Legacy pages (`*.jsx`) | Pages | HIGH | High (see Phase 3) |

---

### Step 4.1: Set Up Strict TypeScript

**Enable strict mode incrementally**:

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

**Tasks**:
- [ ] Enable `strict: true`
- [ ] Fix all type errors (start with new code)
- [ ] Add `// @ts-expect-error` comments for legacy code
- [ ] Gradually remove `@ts-expect-error` as you migrate

---

### Step 4.2: Migrate Contexts to TypeScript

**Priority**: HIGH (contexts are used everywhere)

**Files**:
- `src/shared/context/AuthContext.jsx` → `AuthContext.tsx`
- `src/shared/context/ChatContext.tsx` (already TS ✓)
- `src/shared/context/UiContext.tsx` (already TS ✓)

**Migration Pattern** (AuthContext):

```diff
- // AuthContext.jsx
+ // AuthContext.tsx

+ import { ReactNode } from 'react';

+ interface User {
+   id: string;
+   email: string;
+   name: string;
+ }
+
+ interface AuthContextType {
+   isAuthenticated: boolean;
+   user: User | null;
+   login: (credentials: LoginCredentials) => Promise<void>;
+   logout: () => void;
+   // ... etc.
+ }

- export const AuthContext = createContext();
+ export const AuthContext = createContext<AuthContextType | undefined>(undefined);

- export const AuthProvider = ({ children }) => {
+ export const AuthProvider = ({ children }: { children: ReactNode }) => {
    // ...
  };

+ export const useAuth = (): AuthContextType => {
+   const context = useContext(AuthContext);
+   if (!context) {
+     throw new Error('useAuth must be used within AuthProvider');
+   }
+   return context;
+ };
```

**Tasks**:
- [ ] Migrate AuthContext to TS
- [ ] Add proper types for all context values
- [ ] Add typed hook (`useAuth`)
- [ ] Update all consumers to use typed hook
- [ ] Add tests

---

### Step 4.3: Migrate Hooks to TypeScript

**Files**:

| Hook | Status | Priority |
|------|--------|----------|
| `useAuthMigration.js` | JS | MEDIUM |
| `useSellerDashboard.js` | JS | HIGH |
| `useMessages.js` | JS | MEDIUM |
| `useThreadManager.js` | JS | MEDIUM |
| `useHITLGate.js` | JS | LOW |

**Migration Pattern**:

```diff
- // useSellerDashboard.js
+ // useSellerDashboard.ts

+ import type { DashboardData, DashboardFilters } from '../types/dashboard';
+
+ interface UseSellerDashboardResult {
+   data: DashboardData | null;
+   isLoading: boolean;
+   error: Error | null;
+   refetch: () => void;
+ }

- export const useSellerDashboard = () => {
+ export const useSellerDashboard = (
+   filters?: DashboardFilters
+ ): UseSellerDashboardResult => {
    // ...
  };
```

**Tasks**:
- [ ] Convert each hook to `.ts`
- [ ] Add return type annotations
- [ ] Add parameter type annotations
- [ ] Add tests with TypeScript

---

### Step 4.4: Track TypeScript Coverage

**Use `typescript-coverage-report`**:

```bash
npm install --save-dev typescript-coverage-report
```

**Add to package.json**:

```json
{
  "scripts": {
    "ts:coverage": "typescript-coverage-report"
  }
}
```

**Run**:

```bash
npm run ts:coverage
```

**Set Goal**: 90%+ coverage

**Tasks**:
- [ ] Install coverage tool
- [ ] Set up CI job to track coverage
- [ ] Set coverage thresholds
- [ ] Monitor and improve over time

---

## Phase 5: Testing & Quality

**Goal**: 80%+ test coverage with integration and E2E tests.

**Duration**: Ongoing (parallel with migrations)

### Current Testing State

**Existing Tests**:
- `src/__tests__/listings.integration.test.ts` ✓
- `src/components/*/__tests__/*.test.tsx` (snapshots) ✓

**Missing**:
- Unit tests for most hooks
- Integration tests for features
- E2E tests for critical flows

---

### Step 5.1: Unit Tests for Hooks

**For every hook, add tests**:

**Example** (`useListings.test.ts`):

```ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useListings } from './useListings';
import { apiClient } from '../services/apiClient';

jest.mock('../services/apiClient');

const wrapper = ({ children }) => (
  <QueryClientProvider client={new QueryClient()}>
    {children}
  </QueryClientProvider>
);

describe('useListings', () => {
  it('fetches listings successfully', async () => {
    const mockData = { results: [{ id: '1', title: 'Test' }] };
    (apiClient.getListings as jest.Mock).mockResolvedValue(mockData);

    const { result } = renderHook(() => useListings(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
  });

  it('handles errors', async () => {
    (apiClient.getListings as jest.Mock).mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useListings(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });
});
```

**Tasks**:
- [ ] Add tests for all hooks in `src/hooks/`
- [ ] Add tests for all feature hooks
- [ ] Mock API calls
- [ ] Test loading, success, and error states

---

### Step 5.2: Integration Tests for Features

**For each feature module, add integration tests**:

**Example** (`BookingsPage.integration.test.tsx`):

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookingsPage } from './BookingsPage';
import { apiClient } from '../../services/apiClient';

jest.mock('../../services/apiClient');

describe('BookingsPage Integration', () => {
  it('displays bookings after loading', async () => {
    const mockBookings = [
      { id: '1', property: 'Test Property', status: 'confirmed' },
    ];
    (apiClient.get as jest.Mock).mockResolvedValue(mockBookings);

    render(<BookingsPage />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Test Property')).toBeInTheDocument();
    });
  });

  it('filters bookings by status', async () => {
    // ... test filter functionality
  });
});
```

**Tasks**:
- [ ] Add integration tests for chat feature
- [ ] Add integration tests for listings feature
- [ ] Add integration tests for dashboard
- [ ] Add integration tests for bookings

---

### Step 5.3: E2E Tests with Playwright

**Critical User Flows**:

1. **Authentication Flow**
   - Sign up → verify → login

2. **Listing Creation Flow**
   - Select category → fill form → upload images → submit

3. **Chat Flow**
   - Open chat → send message → receive response → view recommendations

4. **Dashboard Flow**
   - Login → view dashboard → navigate to domain → view metrics

**Example E2E Test** (`e2e/auth.spec.ts`):

```ts
import { test, expect } from '@playwright/test';

test('user can sign up and login', async ({ page }) => {
  // Go to home page
  await page.goto('/');

  // Click signup button
  await page.click('text=Sign Up');

  // Fill form
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'SecurePassword123');
  await page.click('button[type="submit"]');

  // Should redirect to verification
  await expect(page).toHaveURL('/verify');

  // ... verify email, then login
});
```

**Tasks**:
- [ ] Set up Playwright
- [ ] Write E2E tests for auth flow
- [ ] Write E2E tests for listing creation
- [ ] Write E2E tests for chat
- [ ] Write E2E tests for dashboard navigation
- [ ] Add to CI pipeline

---

### Step 5.4: Coverage Tracking

**Set Up Jest Coverage**:

```json
// package.json
{
  "scripts": {
    "test:coverage": "jest --coverage"
  },
  "jest": {
    "coverageThreshold": {
      "global": {
        "branches": 80,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    }
  }
}
```

**Tasks**:
- [ ] Set coverage thresholds
- [ ] Add coverage reports to CI
- [ ] Monitor coverage over time
- [ ] Improve low-coverage areas

**Goal**: 80%+ coverage across branches, functions, lines, statements

---

## Migration Tracking

### Phase Checklist

#### Phase 1: HTTP Client Consolidation

- [ ] Complete ApiClient implementation
- [ ] Migrate AuthContext
- [ ] Migrate legacy hooks
- [ ] Migrate legacy pages (HTTP only)
- [ ] Remove old clients
- [ ] Add ESLint rule

**Estimated Duration**: 2-3 sprints

---

#### Phase 2: UI Kit Unification

- [ ] Audit UI components
- [ ] Standardize on primary kit
- [ ] Update all imports (codemod)
- [ ] Remove alias kit
- [ ] Add ESLint rule

**Estimated Duration**: 1-2 sprints

---

#### Phase 3: Legacy Pages Migration

- [ ] Migrate `/listings/create`
- [ ] Migrate `/bookings`
- [ ] Migrate `/messages`
- [ ] Migrate `/requests`
- [ ] Migrate `/profile`
- [ ] Migrate `/settings`
- [ ] Remove all legacy pages

**Estimated Duration**: 3-4 sprints

---

#### Phase 4: TypeScript Adoption

- [ ] Set up strict TypeScript
- [ ] Migrate contexts to TS
- [ ] Migrate hooks to TS
- [ ] Track TypeScript coverage
- [ ] Achieve 90%+ coverage

**Estimated Duration**: Ongoing (parallel)

---

#### Phase 5: Testing & Quality

- [ ] Add unit tests for hooks
- [ ] Add integration tests for features
- [ ] Add E2E tests for critical flows
- [ ] Set up coverage tracking
- [ ] Achieve 80%+ coverage

**Estimated Duration**: Ongoing (parallel)

---

### Weekly Tracking

**Report Template** (for standups):

```
## Migration Progress Report - Week X

### Completed This Week
- ✅ Migrated AuthContext to TypeScript
- ✅ Migrated useListings hook
- ✅ Added unit tests for apiClient

### In Progress
- 🔄 Migrating useSellerDashboard hook
- 🔄 Building new Bookings feature

### Blocked
- ⛔ Waiting for backend API updates for real estate metrics

### Next Week
- Migrate Messages page
- Complete Bookings feature
- Add E2E tests for auth flow

### Metrics
- TypeScript Coverage: 65% → 68%
- Test Coverage: 55% → 58%
- Legacy Pages Remaining: 6 → 5
```

---

## Rollback Strategy

### General Rollback Principles

1. **Keep legacy code** until new code is stable (1 sprint buffer)
2. **Use feature flags** for easy toggling
3. **Monitor errors** in production
4. **Have rollback plan** for each phase

---

### Phase-Specific Rollback

#### Phase 1: HTTP Client

**If apiClient has critical bugs**:

1. Revert to using `api.js` for affected modules
2. Fix bugs in `apiClient`
3. Re-deploy
4. Re-migrate affected modules

**How**:
```diff
- import { apiClient } from '../services/apiClient';
+ import { http } from '../api';
```

---

#### Phase 2: UI Kit

**If new UI kit has styling issues**:

1. Revert imports to alias kit (`@/components/ui/*`)
2. Fix styling in primary kit
3. Re-run codemod

**How**: Git revert commit, fix issues, re-migrate

---

#### Phase 3: Legacy Pages

**If new feature has critical bugs**:

1. Toggle feature flag to use legacy page
2. Fix bugs in new feature
3. Re-enable new feature

**How**:
```tsx
// Temporary rollback
<Route
  path="/bookings"
  element={<BookingsPageLegacy />}  // Rollback
/>
```

---

### Rollback Testing

**Before each migration**:

- [ ] Document rollback procedure
- [ ] Test rollback in staging
- [ ] Have rollback script ready
- [ ] Monitor key metrics post-deployment

---

## Success Metrics

### Technical Metrics

| Metric | Current | Target | Timeline |
|--------|---------|--------|----------|
| TypeScript Coverage | ~60% | 90%+ | 6 months |
| Test Coverage | ~40% | 80%+ | 6 months |
| HTTP Clients | 3 | 1 | 3 months |
| UI Kits | 2 | 1 | 2 months |
| Legacy Pages | 6 | 0 | 4 months |
| Build Time | 45s | 30s | 6 months |
| Bundle Size | 800KB | 600KB | 6 months |

### Business Metrics

| Metric | Target |
|--------|--------|
| Developer Onboarding Time | -50% (2 days → 1 day) |
| Bug Rate | -30% |
| Feature Delivery Speed | +25% |
| User-Reported Issues | -40% |

---

## Support & Resources

**Questions**:
- Architecture: See [FRONTEND_ARCHITECTURE.md](./FRONTEND_ARCHITECTURE.md)
- Real Estate: See [REAL_ESTATE_FRONTEND_MAP.md](./REAL_ESTATE_FRONTEND_MAP.md)

**Weekly Sync**:
- Review migration progress
- Unblock issues
- Adjust timeline if needed

**Last Updated**: 2025-11-14 (v1.0 - Initial Migration Plan)
