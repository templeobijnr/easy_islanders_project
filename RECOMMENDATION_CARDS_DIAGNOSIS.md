# Recommendation Cards - Complete Flow Diagnosis

**Date:** 2025-11-10
**Status:** 🔴 CRITICAL ISSUES FOUND

---

## 🔍 Complete Flow Traced

### Backend → Frontend Data Flow

```
1. Real Estate API (/api/v1/real_estate/search)
   ↓
2. Search Adapter (assistant/domain/real_estate_search.py::format_listing_for_card)
   ↓
3. Real Estate Handler (assistant/brain/real_estate_handler.py)
   ↓
4. Task Processing (assistant/tasks.py::process_chat_message)
   ↓
5. WebSocket Message (channels layer)
   ↓
6. Frontend ChatContext (src/shared/context/ChatContext.tsx)
   ↓
7. InlineRecsCarousel (src/features/chat/components/InlineRecsCarousel.tsx)
   ↓
8. RecommendationCard (src/features/chat/components/RecommendationCard.tsx)
```

---

## 🐛 Critical Issues Found

### Issue #1: Field Name Mismatch (Backend → Frontend)

**Backend sends (snake_case):**
```python
{
    "id": str,
    "title": str,
    "subtitle": str,
    "price": str,
    "image_url": str,  # ❌ snake_case
    "metadata": {...}
}
```

**Frontend expects (camelCase):**
```typescript
interface RecItem {
  id: string;
  title: string;
  subtitle?: string;
  price?: string;
  imageUrl?: string;  # ❌ camelCase mismatch!
  ...
}
```

**Impact:** Images will NOT display because `image_url` doesn't match `imageUrl`.

**Location:**
- Backend: [assistant/domain/real_estate_search.py:337, 353](assistant/domain/real_estate_search.py#L337)
- Frontend: [frontend/src/features/chat/components/RecommendationCard.tsx:18, 67-68](frontend/src/features/chat/components/RecommendationCard.tsx#L18)

---

### Issue #2: Recommendations Never Extracted from WebSocket

**Backend sends:**
```json
{
  "type": "chat_message",
  "event": "assistant_message",
  "payload": {
    "text": "Here are some properties...",
    "rich": {
      "recommendations": [...]  // ← Backend sends this
    }
  }
}
```

**Frontend ChatContext (pushAssistantMessage):**
```typescript
const pushAssistantMessage = useCallback((frame: AssistantFrame) => {
  const text = frame.payload?.text;  // ✅ Extracts text
  // ❌ NEVER extracts frame.payload.rich.recommendations!

  setMessages((prev) => prev.map(...));  // Only updates text
  // ❌ Never updates results state!
}, []);
```

**Impact:** Recommendations are sent from backend but **NEVER stored or displayed** in frontend!

**Location:**
- Backend: [assistant/tasks.py:1689](assistant/tasks.py#L1689)
- Frontend: [frontend/src/shared/context/ChatContext.tsx:112-150](frontend/src/shared/context/ChatContext.tsx#L112-L150)

---

### Issue #3: Results State Never Updated

**Frontend ChatContext:**
```typescript
const [results] = useState<any[]>([]);  // ❌ No setter!
```

The `results` array is hardcoded to an empty array and never updated. Even if recommendations were extracted from WebSocket, there's no way to update this state.

**Impact:** `InlineRecsCarousel` will always use `MOCK_RESULTS` instead of real API data.

**Location:** [frontend/src/shared/context/ChatContext.tsx:69](frontend/src/shared/context/ChatContext.tsx#L69)

---

### Issue #4: Missing Pydantic Model Conversion (Backend)

**Real Estate Handler:**
```python
card_items = [format_listing_for_card(listing) for listing in listings]  # Returns list of dicts

card_payload = RecommendationCardPayload(
    items=card_items,  # ⚠️ Passing plain dicts to Pydantic model
    ...
)
```

**RecommendationCardPayload Schema:**
```python
class RecommendationCardPayload(BaseModel):
    items: List[CardItem]  # Expects List of Pydantic models
    ...
```

**Status:** Pydantic v2 MAY auto-convert dicts if structure matches, but this is fragile.

**Location:** [assistant/brain/real_estate_handler.py:413-417](assistant/brain/real_estate_handler.py#L413-L417)

---

### Issue #5: Frontend Missing Required Fields

**Frontend RecItem interface:**
```typescript
interface RecItem {
  id: string;
  title: string;
  subtitle?: string;
  price?: string;
  rating?: number;
  imageUrl?: string;
  area?: string;
  badges?: string[];
  distanceMins?: number;
}
```

**Backend sends:**
```python
{
    "id": str,
    "title": str,
    "subtitle": str,
    "price": str,
    "image_url": str,
    "metadata": {
        "bedrooms": int,
        "bathrooms": decimal,
        "amenities": list,
        ...
    }
}
```

**Missing in backend:**
- `rating` (frontend expects but backend doesn't send)
- `area` (frontend expects but backend doesn't send)
- `badges` (frontend expects but backend doesn't send)
- `distanceMins` (frontend expects but backend doesn't send)

**Impact:** These fields will always be undefined in frontend, UI will miss features.

---

## ✅ Fixes Required

### Fix #1: Normalize Field Names to camelCase

**File:** [assistant/domain/real_estate_search.py:348-355](assistant/domain/real_estate_search.py#L348-L355)

```python
# BEFORE
return {
    "id": str(listing.get("id", "")),
    "title": listing.get("title", ""),
    "subtitle": subtitle,
    "price": price_str,
    "image_url": image_url,  # ❌ snake_case
    "metadata": metadata
}

# AFTER
return {
    "id": str(listing.get("id", "")),
    "title": listing.get("title", ""),
    "subtitle": subtitle,
    "price": price_str,
    "imageUrl": image_url,  # ✅ camelCase to match frontend
    "metadata": metadata
}
```

### Fix #2: Extract Recommendations from WebSocket

**File:** [frontend/src/shared/context/ChatContext.tsx:69](frontend/src/shared/context/ChatContext.tsx#L69)

```typescript
// BEFORE
const [results] = useState<any[]>([]);  // No setter

// AFTER
const [results, setResults] = useState<any[]>([]);  // Add setter
```

**File:** [frontend/src/shared/context/ChatContext.tsx:112-150](frontend/src/shared/context/ChatContext.tsx#L112-L150)

```typescript
const pushAssistantMessage = useCallback((frame: AssistantFrame) => {
  if (!frame || frame.type !== 'chat_message' || frame.event !== 'assistant_message') return;

  const inReplyTo = frame.meta?.in_reply_to;
  if (!inReplyTo) return;

  const text = typeof frame.payload?.text === 'string' ? frame.payload.text : '';

  // ✅ EXTRACT RECOMMENDATIONS FROM PAYLOAD
  const recommendations = frame.payload?.rich?.recommendations || [];
  if (recommendations.length > 0) {
    setResults(recommendations);  // Update results state
  }

  // ... rest of function
}, []);
```

### Fix #3: Add Missing Fields to Backend Response

**File:** [assistant/domain/real_estate_search.py:348-355](assistant/domain/real_estate_search.py#L348-L355)

```python
return {
    "id": str(listing.get("id", "")),
    "title": listing.get("title", ""),
    "subtitle": subtitle,
    "price": price_str,
    "imageUrl": image_url,  # Fixed casing
    "metadata": metadata,

    # ✅ ADD MISSING FIELDS
    "rating": listing.get("rating"),  # Already in API response
    "area": listing.get("district"),  # Map district to area
    "badges": _generate_badges(listing),  # Helper function for amenities
}

def _generate_badges(listing: Dict[str, Any]) -> List[str]:
    """Generate badge labels from listing data."""
    badges = []
    amenities = listing.get("amenities", [])

    # Map key amenities to badges
    if "wifi" in amenities:
        badges.append("WiFi")
    if "ac" in amenities:
        badges.append("AC")
    if "pool" in amenities:
        badges.append("Pool")
    if "parking" in amenities:
        badges.append("Parking")

    return badges[:3]  # Limit to 3 badges for UI
```

### Fix #4: Convert Dicts to Pydantic Models (Backend)

**File:** [assistant/brain/real_estate_handler.py:413](assistant/brain/real_estate_handler.py#L413)

```python
# BEFORE
card_items = [format_listing_for_card(listing) for listing in listings]

# AFTER
from assistant.brain.tools import CardItem

card_items = [CardItem(**format_listing_for_card(listing)) for listing in listings]
# ✅ Convert dicts to Pydantic models explicitly
```

---

## 🧪 Testing Plan

### Test 1: Verify Field Name Fix

```bash
# Send test message
curl -X POST http://localhost:8000/api/v1/real_estate/search?city=Iskele&rent_type=long_term&limit=1

# Check response has imageUrl (not image_url)
# Expected:
# {
#   "count": 56,
#   "results": [
#     {
#       "id": "...",
#       "title": "...",
#       "imageUrl": "https://...",  # ✅ camelCase
#       ...
#     }
#   ]
# }
```

### Test 2: Verify Recommendations in WebSocket

```javascript
// In browser console after sending chat message
// Check WebSocket message payload
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Recommendations:', data.payload.rich.recommendations);
  // Should show array of card objects
};
```

### Test 3: Verify Frontend Displays Cards

```
1. Send message: "I need a long term apartment in Iskele"
2. Check browser DevTools React Components:
   - ChatContext.results should have array of recommendations
   - InlineRecsCarousel should render cards
   - RecommendationCard should display images (not "image" placeholder)
```

---

## 📊 Summary of Issues

| # | Issue | Severity | Impact | Status |
|---|-------|----------|--------|--------|
| 1 | Field name mismatch (image_url vs imageUrl) | HIGH | Images don't display | Fix ready |
| 2 | Recommendations never extracted from WebSocket | CRITICAL | Cards never shown | Fix ready |
| 3 | Results state never updated | CRITICAL | Always shows mock data | Fix ready |
| 4 | Plain dicts passed to Pydantic model | MEDIUM | May cause validation errors | Fix ready |
| 5 | Missing fields (rating, area, badges) | LOW | UI features missing | Fix ready |

---

## 🚀 Deployment Checklist

After applying all fixes:

- [ ] Backend: Fix field name `image_url` → `imageUrl`
- [ ] Backend: Add missing fields (rating, area, badges)
- [ ] Backend: Convert dicts to Pydantic models
- [ ] Frontend: Add `setResults` to results state
- [ ] Frontend: Extract recommendations from WebSocket payload
- [ ] Rebuild Docker containers
- [ ] Test end-to-end: Send chat message, verify cards display
- [ ] Verify images display (not placeholder)
- [ ] Verify rating, badges show if available

---

**Document Version:** 1.0
**Last Updated:** 2025-11-10
**Status:** Diagnosis complete, fixes ready to apply
