# Recommendation Cards - Debugging & Fixes Applied

**Date:** 2025-11-10
**Status:** 🔧 DEBUGGING IN PROGRESS

---

## Issue Identified

**Root Cause:** The `InlineRecsCarousel` was conditionally rendered only when `activeJob` was set, but `activeJob` was always `null`, preventing recommendations from displaying even when they existed in state.

**From logs:**
```javascript
[ChatPage] Carousel render condition: {
  activeJob: null,  // ❌ Always null
  hasActiveJob: false,
  willRenderCarousel: false  // ❌ Never rendered
}
```

**Even though:**
```javascript
[ChatContext] Setting results with recommendations  // ✅ Results were set correctly
```

---

## Changes Applied

### Fix #1: Remove activeJob Dependency from Carousel

**File:** [frontend/src/features/chat/ChatPage.tsx:87-96](frontend/src/features/chat/ChatPage.tsx#L87-L96)

**Before:**
```typescript
{activeJob && <InlineRecsCarousel />}
// Only renders if activeJob is set
```

**After:**
```typescript
{(() => {
  console.log('[ChatPage] Carousel render condition:', {
    activeJob,
    hasActiveJob: !!activeJob,
    resultsLength: messages.length,
    willRenderCarousel: true
  });
  // Always render carousel - it will handle empty state internally
  return <InlineRecsCarousel />;
})()}
```

**Impact:** Carousel now always renders, and its internal logic decides whether to show cards based on `results.length > 0`

---

### Fix #2: Enhanced WebSocket Logging

**File:** [frontend/src/shared/context/ChatContext.tsx:140-157](frontend/src/shared/context/ChatContext.tsx#L140-L157)

**Added detailed logging:**
```typescript
console.log('[ChatContext] WebSocket recommendations extraction:', {
  hasRecommendations: !!recommendations,
  isArray: Array.isArray(recommendations),
  count: recommendations?.length || 0,
  agent: frame.payload?.agent,
  payloadKeys: Object.keys(frame.payload || {})
});
```

**Impact:** Better visibility into WebSocket message structure and recommendation extraction

---

### Fix #3: ChatPage State Logging

**File:** [frontend/src/features/chat/ChatPage.tsx:26-32](frontend/src/features/chat/ChatPage.tsx#L26-L32)

**Added state tracking:**
```typescript
console.log('[ChatPage] State check:', {
  threadId,
  activeJob,
  messagesCount: messages.length,
  resultsCount: results.length,
  hasRecommendations: results.length > 0
});
```

**Impact:** Track when recommendations are available in ChatContext

---

### Fix #4: WebSocket Status Logging

**File:** [frontend/src/features/chat/ChatPage.tsx:35-46](frontend/src/features/chat/ChatPage.tsx#L35-L46)

**Added connection status tracking:**
```typescript
const handleWsStatus = useCallback((status) => {
  console.log('[ChatPage] WebSocket status changed:', status);
  setConnectionStatus(status);
}, [setConnectionStatus]);

const handleWsMessage = useCallback((wsMessage: any) => {
  console.log('[ChatPage] WebSocket message received:', {
    type: wsMessage.type,
    event: wsMessage.event,
    hasRecommendations: !!wsMessage.payload?.rich?.recommendations,
    recommendationsCount: wsMessage.payload?.rich?.recommendations?.length || 0
  });
  // ...
}, []);
```

**Impact:** Track WebSocket connection health and message reception

---

## Testing Instructions

### Step 1: Rebuild Frontend

```bash
cd frontend
npm start
```

### Step 2: Open Browser DevTools → Console

You should now see detailed logs at each stage:

**On page load:**
```
[ChatPage] State check: {
  threadId: "9814114a-...",
  activeJob: null,
  messagesCount: 1,
  resultsCount: 0,
  hasRecommendations: false
}
```

**When WebSocket connects:**
```
[ChatPage] WebSocket status changed: connecting
[ChatPage] WebSocket status changed: connected
```

**When you send a message:**
```
[ChatContext] HTTP response received: {
  hasRecommendations: false,
  responseKeys: ['ok', 'thread_id', ...]
}
```

**When agent responds via WebSocket:**
```
[ChatPage] WebSocket message received: {
  type: 'chat_message',
  event: 'assistant_message',
  hasRecommendations: true,
  recommendationsCount: 3
}

[ChatContext] WebSocket recommendations extraction: {
  hasRecommendations: true,
  isArray: true,
  count: 3,
  agent: 'real_estate',
  payloadKeys: ['text', 'rich', 'agent']
}

[ChatContext] Setting results from WebSocket: 3 items

[ChatPage] State check: {
  threadId: "9814114a-...",
  activeJob: null,
  messagesCount: 2,
  resultsCount: 3,  // ✅ Results populated!
  hasRecommendations: true
}

[InlineRecsCarousel] Render check: {
  activeJob: null,
  resultsLength: 3,  // ✅ Has results!
  hasActiveJob: false
}

[InlineRecsCarousel] Final recs: {
  recsLength: 3,
  usingApiResults: true,  // ✅ Using real data!
  usingMockData: false
}

[InlineRecsCarousel] Rendering with 3 recommendations
```

**Expected result:** You should see 3 recommendation cards displayed!

---

## Verification Checklist

After testing, verify:

- [ ] Console shows `[ChatPage] WebSocket status changed: connected`
- [ ] Console shows `[ChatPage] WebSocket message received` when agent responds
- [ ] Console shows `[ChatContext] Setting results from WebSocket: N items`
- [ ] Console shows `[InlineRecsCarousel] Rendering with N recommendations`
- [ ] **Recommendation cards are visible in the UI** ✅
- [ ] Cards show images (not "image" placeholder)
- [ ] Cards show correct title, price, area
- [ ] Cards show badges (WiFi, AC, etc.)
- [ ] Reserve and Contact buttons work

---

## If Cards Still Don't Show

### Check #1: WebSocket Connection

**Look for:**
```
[ChatPage] WebSocket status changed: connected
```

**If you see `disconnected` or `error`:**
- Check if backend WebSocket is running
- Check browser console for CORS errors
- Verify token is valid

### Check #2: Backend Sending Recommendations

**Look for:**
```
[ChatPage] WebSocket message received: {
  hasRecommendations: true,
  recommendationsCount: 3
}
```

**If `hasRecommendations: false`:**
- Check backend Celery logs: `docker compose logs celery_chat | grep "RE Agent: emitting"`
- Verify `ENABLE_RE_RECOMMEND_CARD=true` in backend
- Check backend logs for errors

### Check #3: Recommendations Being Stored

**Look for:**
```
[ChatContext] Setting results from WebSocket: 3 items
```

**If you see this but no cards:**
- Check `[InlineRecsCarousel] Render check` logs
- Verify `resultsLength > 0`

### Check #4: Carousel Rendering

**Look for:**
```
[InlineRecsCarousel] Rendering with 3 recommendations
```

**If you see this but no visible cards:**
- Inspect DOM in browser DevTools
- Check for CSS issues hiding cards
- Verify `RecommendationCard` component rendering

---

## Expected Complete Log Sequence

When everything works correctly, you should see this sequence:

```
1. [ChatPage] State check: resultsCount: 0
2. [ChatPage] WebSocket status changed: connected
3. User sends message: "I need apartment in Iskele"
4. [ChatContext] HTTP response received: hasRecommendations: false (expected)
5. [ChatPage] WebSocket message received: hasRecommendations: true, recommendationsCount: 3
6. [ChatContext] WebSocket recommendations extraction: count: 3
7. [ChatContext] Setting results from WebSocket: 3 items
8. [ChatPage] State check: resultsCount: 3
9. [InlineRecsCarousel] Render check: resultsLength: 3
10. [InlineRecsCarousel] Final recs: recsLength: 3, usingApiResults: true
11. [InlineRecsCarousel] Rendering with 3 recommendations
12. ✅ Cards visible in UI!
```

---

## Summary

**What was wrong:**
- Carousel was conditionally rendered only when `activeJob !== null`
- But `activeJob` was always `null` because no job chips were selected
- So even when recommendations existed in state, carousel never rendered

**What we fixed:**
- Removed `activeJob` dependency - carousel always renders now
- Carousel's internal logic (`if (!recs.length) return null`) handles empty state
- Added comprehensive logging to track data flow at every step

**Expected result:**
- Recommendations now display automatically when received via WebSocket
- No need to manually select a job chip
- Works for both real-time (WebSocket) and HTTP fallback

---

**Document Version:** 1.0
**Last Updated:** 2025-11-10
**Status:** Ready for testing
