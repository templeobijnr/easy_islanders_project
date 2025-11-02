# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commonly Used Commands

### Frontend (React + TypeScript)
```bash
cd frontend
npm start              # Dev server on :3000
npm run build         # Production build
npm test              # Run all tests
npm run test:unit     # Component & hook tests
npm run test:e2e      # Playwright e2e tests
npm run test:ci       # Full CI test suite
```

### Backend (Django)
```bash
# From project root
python3 manage.py runserver              # Dev server on :8000
python3 manage.py migrate                # Apply migrations
python3 manage.py makemigrations         # Create new migrations
python3 manage.py test                   # Run Django tests
python3 manage.py seed_intent_exemplars  # Seed router data
python3 manage.py update_calibration_params  # Update router calibration
```

### Router Evaluation
```bash
# Validate intent router accuracy and latency
python3 scripts/eval_router.py --corpus scripts/router_eval_corpus.json
# Expected: accuracy ≥ 0.92, ECE ≤ 0.05, p95 latency < 120ms

# Update cached centroids
python3 scripts/update_centroids.py
```

### Metrics & Monitoring
```bash
curl http://127.0.0.1:8000/api/metrics/ | grep -E "router_requests_total|router_uncertain_total|router_latency_seconds"
```

### Cache Clearing (Frontend)
```bash
# If TypeScript errors persist after fixes
pkill -f react-scripts || true
rm -rf frontend/node_modules/.cache
cd frontend && npm start
```

---

## High-Level Architecture

### Stack Overview
- **Frontend**: React 18.2 + TypeScript (partial migration), Create React App 5.0.1
- **Backend**: Django 5.2.5 + Django REST Framework
- **Database**: PostgreSQL with pgvector extension for vector embeddings
- **Task Queue**: Celery for async processing
- **Caching**: Redis (optional, controlled by `USE_REDIS_CACHE`)
- **AI/ML**: OpenAI API (optional fallback to hashing-based embeddings)
- **Observability**: OpenTelemetry, Prometheus metrics

### Frontend Architecture

#### State Management Pattern
Uses **Context API** with three main contexts (no Redux):

1. **UiContext** (`src/shared/context/UiContext.tsx`)
   - Manages UI state: active job selection, active tab, left rail visibility
   - Provides: `activeJob`, `setActiveJob`, `activeTab`, `setActiveTab`, `leftRailOpen`, `toggleLeftRail`

2. **ChatContext** (`src/shared/context/ChatContext.tsx`)
   - Manages chat state: messages, threads, conversation flow
   - Provides: `messages`, `send`, `threadId`, message history

3. **AuthContext** (`src/shared/context/AuthContext.tsx`)
   - Manages authentication: JWT tokens, user state, login/logout
   - Integrates with axios interceptors for automatic token injection

**Critical**: All three contexts must wrap the app at root level in `src/App.js` or `src/index.js`. The nesting order matters for dependencies.

#### Component Architecture
**Feature-based module structure** mixing TypeScript (new) and JavaScript (legacy):

```
src/
├── features/          # New TypeScript feature modules
│   ├── chat/          # Chat UI, Composer, message bubbles
│   │   ├── components/
│   │   │   ├── ChatPane.tsx
│   │   │   ├── Composer.tsx
│   │   │   ├── InlineRecsCarousel.tsx  # Self-contained, reads from context
│   │   │   └── RecommendationCard.tsx
│   │   ├── hooks/
│   │   │   └── useChat.ts
│   │   └── ChatPage.tsx
│   └── left-rail/     # Job selection sidebar
│       ├── LeftRail.tsx
│       ├── JobChip.tsx
│       └── index.ts   # Barrel exports
├── shared/            # Shared TypeScript utilities
│   ├── context/       # Context providers
│   ├── components/    # Page, Header, Footer
│   ├── constants.ts   # MOCK_RESULTS, JOB_CHIPS, theme tokens
│   └── types.ts
├── pages/             # Legacy JavaScript pages
│   ├── Requests.jsx
│   ├── Bookings.jsx
│   └── Messages.jsx
└── components/        # Legacy JavaScript components
    ├── auth/
    ├── common/
    └── dashboard/
```

**Self-Contained Component Pattern**: Components like `InlineRecsCarousel` read directly from context (`useUi`, `useChat`) and constants (`MOCK_RESULTS`) instead of accepting props. This eliminates prop-drilling and type mismatches.

**Barrel Export Pattern**: Each feature module has an `index.ts` that re-exports components:
```typescript
export { default as LeftRail } from './LeftRail';
export { default as JobChip } from './JobChip';
```
Match default vs named exports carefully - using `export { default as X }` re-exports a default export.

#### Styling System
- **Tailwind CSS 3.3.2** with custom theme
- **Primary color**: Lime green `#6CC24A` (lime-600)
- **Design tokens**: `rounded-2xl`, `border-slate-200`, `backdrop-blur`, `shadow-sm`
- **Responsive**: Mobile-first with `md:` and `lg:` breakpoints

### Backend Architecture

#### Django Apps Structure
```
assistant/           # Core AI chat logic, agent orchestration
├── models.py        # Conversation, Message, DemandLead
├── tasks.py         # Celery tasks for async AI calls
├── views/           # Modular view organization
│   ├── agent.py     # Agent search, recommendations
│   ├── listings.py  # Listing CRUD
│   ├── messages.py  # V1 messages API
│   └── __init__.py  # View imports
└── utils/           # Helpers, PII redaction

router_service/      # Intent classification router
├── models.py        # IntentExemplar, DomainCentroid, RouterEvent
├── pipeline.py      # LangGraph classification pipeline
├── views.py         # /api/route/, /api/feedback/
└── metrics.py       # Prometheus metrics

users/               # User management, JWT auth
listings/            # Listing models, categories, availability
```

#### Intent Router (v1.5)
**Purpose**: Classifies user utterances into domains (real_estate, general, services, etc.) with calibrated confidence scores.

**Pipeline Flow**:
1. User utterance → `/api/route/` endpoint
2. Embed utterance (OpenAI or hash fallback)
3. Supervised classification (scikit-learn logistic regression trained on RouterEvent history)
4. Platt scaling calibration for confidence adjustment
5. Governance check: if confidence < threshold → return "clarify" action
6. Log RouterEvent for self-evaluation
7. Return `{ domain, confidence, calibrated_confidence, policy_action }`

**Critical Files**:
- `router_service/pipeline.py` - LangGraph state machine
- `router_service/models.py` - DomainCentroid (cached embeddings), IntentExemplar (seed data), RouterEvent (feedback loop)
- `scripts/eval_router.py` - Accuracy/latency validation (must pass: accuracy ≥ 0.92, ECE ≤ 0.05, p95 < 120ms)
- `scripts/update_centroids.py` - Rebuild cached centroids

**Metrics** (Prometheus):
- `router_requests_total` - Total routing requests by domain
- `router_uncertain_total` - Requests below confidence threshold
- `router_latency_seconds` - P50/P95/P99 latency
- `router_calibration_ece` - Expected Calibration Error by domain
- `router_accuracy_total` - Accuracy counters

**Retraining**: Run `python3 manage.py update_calibration_params` nightly to refresh Platt scaling parameters from recent RouterEvent data.

### API Contracts

**See [API_CONTRACTS.md](API_CONTRACTS.md) for complete schemas.**

**Key Patterns**:
- **Authentication**: JWT in `Authorization: Bearer <token>` header (axios interceptor handles this)
- **Versioning**: URL path versioning (`/api/v1/messages/`, `/api/v2/...`)
- **Pagination**: Standard format with `page`, `limit`, `has_next`, `next`/`previous` URLs
- **Error Format**: `{ "error": "string", "message": "string", "details": {...}, "code": "ERROR_CODE" }`
- **Language Support**: `?language=en|tr|ru|pl|de` query param or `Accept-Language` header

**Critical Endpoints**:
- `POST /api/chat/` - Main chat interaction (message, language, conversation_id, thread_id)
- `POST /api/route/` - Intent classification (utterance, thread_id)
- `GET /api/v1/messages/` - Fetch messages with filtering (type, thread_id, is_unread)
- `GET /api/v1/messages/unread-count/` - Unread message count
- `POST /api/v1/messages/{thread_id}/read_status/` - Mark thread as read
- `GET /api/recommendations/` - Get recommendations by category/location
- `POST /api/agent/search/` - AI-powered search with metadata

**Frontend Integration**:
```javascript
// Axios interceptor setup (src/api.js or similar)
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Error handling for 401 (token expired)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## Common Patterns & Gotchas

### TypeScript Migration (Partial)
The codebase is **mid-migration** from JavaScript to TypeScript:
- New features → TypeScript (`.tsx`, `.ts`)
- Legacy pages → JavaScript (`.jsx`, `.js`)
- When importing legacy JS components in TS files, you may need to add `// @ts-ignore` or create `.d.ts` type declarations

### Barrel Exports
When creating a new feature module:
1. Use **default exports** for components: `export default MyComponent`
2. Re-export in `index.ts`: `export { default as MyComponent } from './MyComponent'`
3. Import from barrel: `import { MyComponent } from './features/my-feature'`

**Common Error**: `Module has no default export` → Check that the component uses `export default` and the barrel re-exports with `export { default as ... }`.

### Mock Data Flow
**Recommendations are currently mocked** via `MOCK_RESULTS` in `src/shared/constants.ts`:
```typescript
export const MOCK_RESULTS = {
  real_estate: [ /* listings */ ],
  general: [ /* results */ ],
  // ...
};
```
Components like `InlineRecsCarousel` read directly from `MOCK_RESULTS[activeJob]`. When wiring to backend, replace with API calls to `/api/recommendations/` but keep the same data shape.

### PII Handling
The backend automatically redacts PII in logs and applies hashing/encryption:
- **Email**: Redacted in logs, hashed in storage
- **Phone**: Redacted in logs, encrypted in storage
- **Address**: Geocoded to coordinates only
- **Never log**: Passwords, payment info, raw phone numbers

### Router Validation Workflow
Before deploying router changes:
1. Seed test data: `python3 manage.py seed_intent_exemplars`
2. Update centroids: `python3 scripts/update_centroids.py`
3. Run evaluation: `python3 scripts/eval_router.py --corpus scripts/router_eval_corpus.json`
4. Check metrics: accuracy ≥ 0.92, ECE ≤ 0.05, p95 latency < 120ms
5. If failing, add more exemplars or tune classifier params in `router_service/pipeline.py`

### Testing Strategy
- **Unit Tests**: Jest for React components and hooks (`npm run test:unit`)
- **Integration Tests**: Test context interactions, API mocking (`npm run test:integration`)
- **E2E Tests**: Playwright for full user flows (`npm run test:e2e`)
- **Backend Tests**: Django test suite (`python3 manage.py test`)
- **CI**: `npm run test:ci` runs full suite (unit + integration + e2e)

**Coverage Threshold**: 70% for branches, functions, lines, statements (configured in `frontend/package.json`).

---

## Database & Migrations

### pgvector Setup
The router requires PostgreSQL with the `pgvector` extension:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```
Run this as a superuser (e.g., `postgres`) before running migrations.

### Common Migration Issues
| Symptom | Fix |
|---------|-----|
| `role "easy_user" does not exist` | `CREATE ROLE easy_user LOGIN PASSWORD 'easy_pass';` |
| `permission denied to create extension "vector"` | Run `CREATE EXTENSION vector;` as superuser |
| `relation "router_service_domaincentroid" does not exist` | Run `python3 manage.py migrate router_service` |

---

## Development Workflow

### Starting Services Locally
```bash
# Terminal 1: Backend (Django + Celery)
authenv  # Activate virtual environment
python3 manage.py runserver

# Terminal 2: Frontend (React)
cd frontend
npm start

# Terminal 3: Celery worker (if using async tasks)
celery -A easy_islanders worker -l info

# Terminal 4: Redis (if USE_REDIS_CACHE=true)
redis-server
```

### Hot Reload & Cache Issues
- **React hot reload** works automatically via CRA webpack dev server
- **Django auto-reload** works via runserver (watches `.py` files)
- **If TypeScript errors persist**: Clear cache with `rm -rf frontend/node_modules/.cache`
- **If Django templates don't update**: Restart runserver

### Git Workflow
Current branch: `frontend/fix-imports-prototype-rev6`
- **Never force push** to main/master
- **Run tests before committing**: `npm run test:ci` (frontend), `python3 manage.py test` (backend)
- **Check linting**: ESLint runs automatically in CRA dev server

---

## Production Considerations

### Security
- **Current**: JWT tokens stored in `localStorage` (vulnerable to XSS)
- **Recommended**: Migrate to HttpOnly cookies for token storage
- **CORS**: Configure `CORS_ALLOWED_ORIGINS` in `easy_islanders/settings/base.py`
- **Rate Limiting**: Configured per endpoint (see API_CONTRACTS.md)

### Environment Variables
Key settings (check `.env` or `easy_islanders/settings/`):
- `DEBUG` - Set to `False` in production
- `SECRET_KEY` - Rotate regularly
- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - Optional (router falls back to hashing)
- `USE_REDIS_CACHE` - Enable Redis caching
- `ENABLE_INTENT_PARSER` - Enable router classification

### Deployment
- **Frontend Build**: `npm run build` → static files in `frontend/build/`
- **Django Static Files**: `python3 manage.py collectstatic`
- **Migrations**: Run `python3 manage.py migrate` before deploying new code
- **Procfile**: Configured for Railway/Heroku deployment

---

## Key Files Reference

### Frontend
- `src/shared/context/UiContext.tsx` - UI state (job selection, left rail)
- `src/shared/context/ChatContext.tsx` - Chat state (messages, threads)
- `src/shared/context/AuthContext.tsx` - Auth state (JWT tokens, user)
- `src/shared/constants.ts` - MOCK_RESULTS, JOB_CHIPS, theme tokens
- `src/features/chat/components/InlineRecsCarousel.tsx` - Self-contained recs display
- `src/App.js` - Main app component (context providers must wrap here)

### Backend
- `router_service/pipeline.py` - Intent classification LangGraph pipeline
- `router_service/models.py` - Router data models (centroids, events, exemplars)
- `assistant/views/messages.py` - V1 messages API implementation
- `assistant/tasks.py` - Celery async tasks for AI calls
- `easy_islanders/settings/base.py` - Django settings
- `scripts/eval_router.py` - Router accuracy/latency validation

### Documentation
- `API_CONTRACTS.md` - Complete frontend-backend API schemas
- `README.md` - Router demo guide, local validation workflow
- `DEPLOYMENT_STATUS_FINAL.md` / `DEPLOYMENT_SUMMARY.md` - Deployment docs

---

## Troubleshooting

### Frontend Build Failures
1. **TypeScript errors after changes**: Clear cache with `rm -rf node_modules/.cache`
2. **Module not found**: Check barrel exports match (default vs named)
3. **Props type mismatch**: Verify self-contained components don't accept props

### Backend Errors
1. **Router evaluation fails**: Seed data with `python3 manage.py seed_intent_exemplars`
2. **pgvector errors**: Ensure extension is created: `CREATE EXTENSION vector;`
3. **Celery tasks not running**: Check Redis is running and `USE_REDIS_CACHE=true`

### Integration Issues
1. **401 Unauthorized**: Check JWT token in `localStorage.getItem('token')`
2. **CORS errors**: Add frontend URL to `CORS_ALLOWED_ORIGINS` in Django settings
3. **Chat not working**: Verify all three contexts (Ui, Chat, Auth) wrap the app

---

**Last Updated**: 2025-10-31 (Sprint 5 - Router v1.5)
