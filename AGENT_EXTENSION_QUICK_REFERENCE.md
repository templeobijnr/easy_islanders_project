# AI Agent Extension – Quick Reference Guide

## 🎯 Current Status

### What Works Now (Property-Only)
```
User: "Show me 2+1 apartments in Kyrenia"
→ ✅ Recognized as property_search
→ ✅ Extracts: bedrooms=2, location=kyrenia
→ ✅ Queries database
→ ✅ Returns 5 apartment cards
```

### What Breaks Now (Everything Else)
```
User: "Show me cars under 5000"
→ ❌ NOT recognized (no "car" keyword heuristic)
→ ❌ Falls back to generic chat
→ ❌ User frustrated

User: "Find hair salons"
→ ❌ NOT recognized (no "hair" keyword heuristic)
→ ❌ Falls back to generic chat
→ ❌ User frustrated

User: "Electronics under 100 euros"
→ ❌ NOT recognized (no "electronics" keyword heuristic)
→ ❌ Falls back to generic chat
→ ❌ User frustrated
```

---

## 📊 Agent Architecture (Current)

### Single Graph with 8 Nodes
```
INPUT MESSAGE
    ↓
[Language Detection] (en, tr, ru, pl)
    ↓
[Intent Detection] (7 intent types)
    ├→ property_search (⚠️ ONLY THIS WORKS FOR PRODUCTS)
    ├→ agent_outreach
    ├→ status_update
    ├→ general_chat
    ├→ knowledge_query
    ├→ service_search (exists but unused)
    ├→ conversation_continuation
    └→ fallback_chat
    ↓
RESPONSE
```

### Current Tools Available
| Tool | Purpose | Status |
|------|---------|--------|
| `search_internal_listings()` | Property search | ✅ Working |
| `initiate_contact_with_seller()` | Agent outreach | ✅ Working |
| `search_services()` | Service provider search | ⚠️ Exists, not routed |
| `get_knowledge()` | Knowledge base | ✅ Working |
| `find_rental_property()` | Property scraper | ⚠️ Exists, not called |
| `find_used_car()` | Car scraper | ⚠️ Exists, not called |

---

## 🔴 Key Limitations

### 1. **Hard-Coded Keywords (Biggest Problem)**
```python
PROPERTY_KEYWORDS = {
    "apartment", "flat", "house", "villa", "rent", "rental",
    "studio", "1+1", "2+1", "3+1", "bedroom", "bedrooms",
    "girne", "kyrenia", "lefkoşa", "nicosia", "magosa", "famagusta",
    # ... only property terms
}
```

**Impact:** Only property searches recognized. Any other query → generic chat fallback.

### 2. **Single-Purpose Intent Types**
Current intent types assume ONLY real estate:
- `property_search` - Can't be `car_search` or `electronics_search`
- `agent_outreach` - Assumes property agent, not restaurant or shop

### 3. **Hard-Coded Search Logic**
```python
def search_internal_listings(listing_type="property_rent", ...):  # ← Property-only
    # Query assumes Listing.listing_type contains "property_rent"
    # Can't search other product types
```

### 4. **Missing Database Fields**
```python
class Listing(models.Model):
    # ❌ No category_id
    # ❌ No subcategory_id
    # ❌ No price_unit (only per-night works)
    listing_type = CharField()      # Only "property_rent", "property_sale"
    structured_data = JSONField()   # Flexible but undocumented
```

### 5. **Location Constraints**
Only North Cyprus locations recognized. Can't handle other regions.

---

## ✅ Solution: Multi-Category Extension

### Phase 1: Dynamic Category Recognition (2-3 days)
**File:** `assistant/brain/category_keywords.py` (NEW)
```python
CATEGORY_KEYWORDS = {
    "accommodation": ["hotel", "apartment", "flat", "house", "villa", ...],
    "car_rental": ["car", "rental", "drive", "rent a car", "vehicle", ...],
    "dining": ["restaurant", "food", "eat", "meal", "cuisine", ...],
    "electronics": ["phone", "laptop", "computer", "camera", ...],
    "beauty": ["hair", "makeup", "skincare", "salon", ...],
    # ... 45 more categories
}

def detect_product_category(text: str) -> Optional[str]:
    # Score each category by keyword matches
    # Return highest-scoring category
```

### Phase 2: Unified Search Tool (3-4 days)
**File:** `assistant/tools/__init__.py` (UPDATE)
```python
def search_listings_by_category(
    category_slug: str,  # "accommodation", "beauty", "electronics", etc.
    location: Optional[str] = None,
    attributes: Optional[Dict] = None,  # price, features, etc.
    language: str = "en",
) -> Dict[str, Any]:
    # Universal search for ANY product category
    # Handles flexible price_unit
    # Returns standard card format
```

### Phase 3: Database Updates (1-2 days)
**File:** `assistant/models.py` (UPDATE)
```python
# Add to Listing model:
category = ForeignKey(Category, on_delete=models.CASCADE)  # NEW
subcategory = ForeignKey(Subcategory, on_delete=models.SET_NULL)  # NEW
price_unit = CharField(default="per item")  # NEW: "per night", "per day", etc.

# Migration: Populate existing listings → "accommodation" category
```

### Phase 4: Updated Intent Detection (1 day)
**File:** `assistant/brain/prompts.py` (UPDATE)
```python
INTENT_PROMPT_V2 = """
Detect BOTH:
1. Intent type (product_search, agent_outreach, etc.)
2. Category slug (accommodation, beauty, electronics, etc.)

Return JSON:
{
  "intent_type": "product_search",
  "category_slug": "electronics",  # NEW
  "location": "kyrenia",
  "confidence": 0.95
}
"""
```

### Phase 5: Graph Routing (1-2 days)
**File:** `assistant/brain/graph.py` (UPDATE)
```python
# NEW NODES:
def node_product_search(state):
    # Universal handler for all categories
    category = state["last_intent"]["category_slug"]
    result = search_listings_by_category(category, ...)
    return result

def node_contact_merchant(state):
    # Universal outreach (works for property, restaurant, shop, etc.)
    listing_id = state["contacted_listing"]
    contact_info = listing.structured_data["contact_info"]
    # Send via appropriate channel
```

### Phase 6: Frontend Adaptation (1-2 days)
**File:** `frontend/src/components/chat/RecommendationCard.jsx` (UPDATE)
```javascript
// Render cards differently based on category
if (item.category === "accommodation") {
  return <AccommodationCard price_unit="€/night" {...item} />
} else if (item.category === "car_rental") {
  return <CarCard price_unit="€/day" {...item} />
} else if (item.category === "beauty") {
  return <ServiceCard price_unit="€" {...item} />
}
```

---

## 📈 Impact: Before vs After

### Before (Current)
```
User Queries Supported:
✅ "2+1 apartment in Kyrenia"
✅ "Hotels under 500 euros"
✅ "Property rental in Girne"

❌ "Show me cars"
❌ "Find restaurants"
❌ "Electronics under 100"
❌ "Hair services"
❌ 99% of non-property queries
```

### After (3-Week Implementation)
```
User Queries Supported:
✅ "2+1 apartment in Kyrenia"
✅ "Hotels under 500 euros"
✅ "Property rental in Girne"

✅ "Show me cars"
✅ "Find restaurants"
✅ "Electronics under 100"
✅ "Hair services"
✅ "Beauty salons"
✅ "Activity tours"
✅ "Lawyers near Kyrenia"
✅ "Fashion clothing"
✅ 50+ new categories
```

---

## 🛠️ Implementation Timeline

```
WEEK 1: Category Recognition
├─ Mon-Wed: Create CATEGORY_KEYWORDS, update prompts
├─ Thu-Fri: Add detect_product_category() heuristic, test
└─ Result: Agent can classify product category from user input

WEEK 2: Search & Database
├─ Mon-Tue: Implement search_listings_by_category()
├─ Wed-Thu: Database migrations, category seeding
├─ Fri: Cross-category search tests
└─ Result: Universal search tool ready

WEEK 3: Integration & Polish
├─ Mon-Tue: Update graph nodes & routing
├─ Wed: Frontend card adaptations
├─ Thu-Fri: E2E testing, edge cases, multilingual
└─ Result: Full multi-category marketplace active
```

---

## 🚀 Quick Start (If You Want to Begin Now)

### Step 1: Create Category Keywords File
```bash
# Create this file:
touch /Users/apple_trnc/Desktop/work/easy_islanders_project/assistant/brain/category_keywords.py
```

### Step 2: Add Basic Keywords
```python
CATEGORY_KEYWORDS = {
    "accommodation": ["hotel", "apartment", "flat", "house", "villa", "rental"],
    "car_rental": ["car", "rental", "vehicle", "auto", "drive"],
    "dining": ["restaurant", "food", "eat", "cafe"],
    "electronics": ["phone", "laptop", "computer", "camera"],
    "beauty": ["hair", "makeup", "skincare", "salon"],
    # Add more as needed
}
```

### Step 3: Update Intent Prompt
Add to `INTENT_PROMPT` in `assistant/brain/prompts.py`:
```python
# Add to system message:
"Also detect the product CATEGORY (accommodation, car_rental, dining, electronics, beauty, etc.)"

# Add to return JSON schema:
"category_slug": "accommodation" | "car_rental" | null
```

---

## 📌 Key Files to Modify

| File | Change | Complexity |
|------|--------|-----------|
| `assistant/brain/category_keywords.py` | CREATE new | Low |
| `assistant/brain/prompts.py` | UPDATE intent prompt | Low |
| `assistant/brain/heuristics.py` | ADD detect_product_category() | Low |
| `assistant/brain/graph.py` | UPDATE routing logic | Medium |
| `assistant/tools/__init__.py` | ADD search_listings_by_category() | Medium |
| `assistant/models.py` | ADD category fields to Listing | Medium |
| `assistant/migrations/` | ADD migration | Medium |
| `frontend/src/components/chat/RecommendationCard.jsx` | UPDATE card rendering | Medium |

---

## 💾 Database Changes Needed

### New Models
```python
class Category(models.Model):
    slug = SlugField(unique=True)  # "accommodation", "electronics", etc.
    name = CharField()              # "Hotels & Accommodations", "Electronics", etc.
    is_featured_category = BooleanField()  # Show in sidebar? (6 frontend categories)
    display_order = IntegerField()

class Subcategory(models.Model):
    category = ForeignKey(Category)
    slug = SlugField()               # "phones", "laptops" (under electronics)
    name = CharField()
```

### Updated Listing Model
```python
class Listing(models.Model):
    # Existing fields remain
    
    # NEW fields:
    category = ForeignKey(Category, on_delete=models.CASCADE)  # REQUIRED
    subcategory = ForeignKey(Subcategory, null=True, blank=True)  # OPTIONAL
    price_unit = CharField(max_length=50, default="per item")  # "per night", "per day", "per person", "per item"
    features = JSONField(default=list)  # Flexible per category
```

### Migration
```python
# Populate existing listings
for listing in Listing.objects.all():
    listing.category = Category.objects.get(slug="accommodation")
    listing.price_unit = "per night"
    listing.save()
```

---

## 🎓 What This Achieves

✅ **Scalability:** From 1 category (property) to 50+ categories
✅ **User Experience:** "Show me cars" → works, not fallback to generic chat
✅ **Database Flexibility:** Support any product type, any price unit
✅ **Unified Architecture:** Single search tool for all categories
✅ **Frontend Adaptation:** Cards render based on category
✅ **Extensibility:** Add new categories without code changes (just database updates)

---

## 📚 Full Documentation

**See:** `/Users/apple_trnc/Desktop/work/easy_islanders_project/AI_AGENT_ANALYSIS.md` (923 lines)

**Covers:**
- Part 1-2: Current architecture in detail
- Part 3-4: How it works today (step-by-step)
- Part 5-7: Graph execution details + number of graphs
- Part 8-12: Extension plan, implementation roadmap, code examples, testing strategy

---

## ❓ FAQ

**Q: How many graphs does the agent have?**
A: **1 graph** (in `graph.py` with 8 nodes). There are also 2 orchestrators: legacy sequential (`agent.py`) and stateful graph (`graph.py`).

**Q: Does it recognize anything besides real estate?**
A: No. Only property keywords trigger product_search. Everything else → generic chat.

**Q: What's the main limitation?**
A: **Hard-coded property-specific keywords**. The system can't dynamically learn new categories.

**Q: How do we fix it?**
A: **Multi-phase extension**: (1) Dynamic category detection, (2) Unified search tool, (3) Database schema, (4) Graph routing, (5) Frontend adaptation.

**Q: How long to implement?**
A: ~3 weeks (high effort, medium complexity, well-documented).

---

## ✨ Next Steps

1. **Review** this quick reference + full AI_AGENT_ANALYSIS.md
2. **Decide** whether to proceed with Phase 1 (category recognition)
3. **Plan** integration with hybrid marketplace architecture (PRODUCT_ARCHITECTURE.md)
4. **Begin** Phase 1 when ready (estimated 2-3 days to first working version)

**Ready to start? Let's build a truly universal marketplace agent! 🚀**
