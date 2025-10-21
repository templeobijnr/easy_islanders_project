# Easy Islanders AI Agent – Comprehensive Analysis

## Executive Summary

The Easy Islanders AI agent is a **property-rental-specific assistant** built with LangChain and LangGraph. It currently handles **real estate searches only** with hardcoded geographic constraints (North Cyprus locations) and property-specific keywords. 

**Current State:**
- ✅ Works well for property rentals (accommodation, apartments, houses)
- ✅ Can contact agents and track photo requests
- ❌ Cannot recognize or handle other product categories (cars, electronics, food, services, etc.)
- ❌ Limited by hardcoded property-specific logic
- ❌ No dynamic category taxonomy support
- ❌ No multi-product intent classification

**What Needs to Change:** The agent must be refactored to handle the **hybrid marketplace model** (6 frontend categories + 50+ backend categories).

---

## Part 1: Current Agent Architecture (Top-Down)

### 1.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│              Easy Islanders AI Agent                        │
│                 (Orchestration Layer)                       │
└──────────────────┬──────────────────────────────────────────┘
                   │
       ┌───────────┴──────────────┬──────────────┐
       │                          │              │
    ┌──▼──────────┐        ┌─────▼──────┐  ┌────▼──────┐
    │  LangGraph  │        │   Chains   │  │  Tools    │
    │ (Graph-based│        │(Intent/    │  │(Search,   │
    │ state       │        │Requirements)  │Contact,   │
    │ machine)    │        │             │  │Knowledge) │
    └─────────────┘        └──────┬──────┘  └────┬──────┘
                                  │              │
            ┌─────────────────────┴──────────────┘
            │
    ┌───────▼────────────────────────────┐
    │  Database / External Services      │
    ├────────────────────────────────────┤
    │ • Listing (properties)             │
    │ • ServiceProvider (vetted)         │
    │ • KnowledgeBase (curated)          │
    │ • Twilio (WhatsApp outreach)       │
    └────────────────────────────────────┘
```

### 1.2 Request Flow

```
User Message
    │
    ▼
┌─────────────────────────┐
│ 1. LANGUAGE DETECTION   │  → Detect en, tr, ru, pl
│    (language_chain)     │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ 2. INTENT DETECTION     │  → Classify: property_search, agent_outreach,
│    (intent_chain)       │     status_update, general_chat, knowledge_query,
│ + Heuristic Corrections │     service_search, conversation_continuation
└────────┬────────────────┘
         │
    ┌────┴─────────────────────────────┬──────────────┬──────────────┐
    │                                  │              │              │
    ▼                                  ▼              ▼              ▼
PROPERTY_SEARCH             AGENT_OUTREACH      STATUS_UPDATE   KNOWLEDGE_QUERY
    │                           │                   │              │
    ├─ Extract Requirements      ├─ Resolve         ├─ Check        ├─ Search KB
    │  (requirements_chain)      │   listing ref    │  pending       │
    │  • bedrooms                │ • Contact seller │  actions       │
    │  • price range             │ • Send outreach  │ • Display      │
    │  • location                │   via Twilio     │  progress      │
    │  • features                │                  │                │
    │                            │                  │                │
    ├─ Query Database            │                  │                │
    │  (search_internal_listings)│                  │                │
    │ • Filter by location       │                  │                │
    │ • Filter by bedrooms       │                  │                │
    │ • Filter by price          │                  │                │
    │ • Sort by rating           │                  │                │
    │                            │                  │                │
    ├─ Regional Fallback         │                  │                │
    │  (if no results)           │                  │                │
    │                            │                  │                │
    └─ Return Cards             └─ Return OK       └─ Return OK    └─ Return KB
                                                                      Articles


    ▼
    │
    ALL → Fallback Chat (if no tool used)
         (fallback_chain)
    │
    ▼
Return Response to User
```

---

## Part 2: Current Implementation Details

### 2.1 Intent Detection Chain (`INTENT_PROMPT`)

**Current Intent Types:**
1. `PROPERTY_SEARCH` - Hard-coded for real estate
2. `AGENT_OUTREACH` - Contact property agents only
3. `STATUS_UPDATE` - Check pending photo requests
4. `CONVERSATION_CONTINUATION` - Recall property conversations
5. `GENERAL_CHAT` - Fallback
6. `KNOWLEDGE_QUERY` - Curated KB (works for any topic)
7. `SERVICE_SEARCH` - Vetted service providers (partially implemented)

**Critical Keywords (in `prompts.py`):**
```python
PROPERTY_KEYWORDS = {
    "apartment", "flat", "house", "villa", "rent", "rental", "property",
    "studio", "1+1", "2+1", "3+1", "bedroom", "bedrooms",
    "girne", "kyrenia", "lefkoşa", "nicosia", "magosa", "famagusta",
    # ... TRNC-specific locations
}
```

**Problem:** These keywords are **hardcoded and property-specific**. There's NO way to recognize:
- "Show me cars"
- "Find restaurants"
- "Hair products"
- "Electronics"
- etc.

### 2.2 Tools Available

**Primary Tools:**
1. **`search_internal_listings()`** - Real estate search ONLY
   - Filters: `listing_type="property_rent"`, location, bedrooms, price, features
   - Returns: Property cards
   - **Limitation:** Hard-coded to expect `Listing.listing_type` = "property_rent"

2. **`initiate_contact_with_seller()`** - Property agent outreach
   - Sends WhatsApp messages to property owners
   - **Limitation:** Assumes seller model, not applicable to car rentals or food

3. **`search_services()`** - Vetted service providers
   - Searches `ServiceProvider` table by category
   - Can handle any category (lawyers, doctors, restaurants)
   - **Status:** Implemented but underutilized

4. **`get_knowledge()`** - Curated knowledge base
   - Searches `KnowledgeBase` table
   - Works for general information (residency rules, banking, etc.)

5. **`find_rental_property()` & `find_used_car()`** - Live scrapers
   - Trigger external web scrapers
   - **Status:** Both defined but property-search-biased

6. **`perform_google_search()`** - Fallback web search

### 2.3 Heuristics (Hard-Coded Keyword Detection)

**Files:**
- `assistant/brain/agent.py` - Lines 39-108 (in-agent helpers)
- `assistant/brain/heuristics.py` - Extracted reusable heuristics

**Current Heuristics:**
```python
PROPERTY_KEYWORDS = {
    "apartment", "flat", "house", "villa", "rent", "rental", "property",
    "studio", "1+1", "2+1", "3+1", "bedroom", "bedrooms",
    # All other keywords are North Cyprus locations
}

def looks_like_property_search(text: str) -> bool:
    # Only recognizes property-specific patterns
    # Returns True if text contains property keywords OR matches bedroom regex

def looks_like_agent_outreach(text: str) -> bool:
    # Only recognizes agent/contact/photos keywords

def looks_like_status_update(text: str) -> bool:
    # Only recognizes "any update", "pictures", "photos" keywords
```

**Problem:** These are **sequential, single-purpose detectors**. The system **cannot** recognize multi-category patterns like:
- "Car rental near Kyrenia"
- "Restaurants in Nicosia"
- "Electronics under 100 euros"

### 2.4 Graph Architecture (`graph.py`)

**Graph Nodes:**
1. `node_parse_intent()` - Runs intent_chain & heuristic corrections
2. `node_property_search()` - Searches internal listings
3. `node_outreach()` - Contacts agents
4. `node_status()` - Checks pending actions
5. `node_fallback()` - Generic chat
6. `node_continuation()` - Recalls history
7. `node_knowledge()` - Knowledge base search
8. `node_service_search()` - Service provider search (NEW but underutilized)

**Graph Edges:**
```
┌─────────────┐
│ parse_intent│
└──────┬──────┘
       │
   ┌───┴────────────────────────────┬────────────────┬──────────────┐
   │                                │                │              │
   ▼                                ▼                ▼              ▼
property_search         agent_outreach         status_update    knowledge/service
   │                         │                    │               │
   └─────────────────────────────────────────────────────────────┘
                          │
                          ▼
                     node_fallback
                          │
                          ▼
                    Return Response
```

**Problem:** The graph is **property-specific**. It has no edges for:
- Car rental searches
- Restaurant searches
- General product searches
- Dynamic category routing

---

## Part 3: Current Limitations

### 3.1 Hard-Coded Logic

| Component | Issue | Impact |
|-----------|-------|--------|
| `PROPERTY_KEYWORDS` | Only recognizes property-related terms | Can't detect car/food/electronics searches |
| `listing_type="property_rent"` | Hard-coded in search tool | Can only search rental properties |
| TRNC location constraints | Fixed location aliases | Can't handle searches for other regions |
| Heuristic detection | Sequential, single-purpose | No cross-category intent matching |
| Intent types | 7 types, property-biased | Missing dynamic category intent routing |

### 3.2 Missing Capabilities

| Feature | Status | Need |
|---------|--------|------|
| Multi-product search | ❌ No | Dynamic product discovery |
| Category taxonomy | ❌ No | Map user queries to 50+ backend categories |
| Dynamic location | ❌ Partially | Support any location, not just TRNC |
| Pricing flexibility | ⚠️ Partial | Handle per-item, per-day, per-night pricing |
| Service search | ⚠️ Implemented | Not connected to intent routing |
| Featured items | ❌ No | Recommend featured listings per category |

### 3.3 Database Model Limitations

**Current `Listing` Model:**
```python
class Listing(models.Model):
    listing_type = CharField()  # Only "property_rent", "property_sale"
    location = CharField()      # Only North Cyprus areas
    price = DecimalField()      # Single price (works for rentals)
    structured_data = JSONField()  # Flexible but undocumented
```

**Problem:** 
- No `category_id` or `subcategory_id` foreign keys
- No `price_unit` to support "per night", "per day", "per person"
- No flexible schema for multi-type products

---

## Part 4: How the Agent Actually Works (Current)

### Step-by-Step Example: User Says "Show me 2+1 apartments in Kyrenia under 1000"

**Step 1: Language Detection**
```
Input: "Show me 2+1 apartments in Kyrenia under 1000"
Chain: language_chain()
Output: "en"
```

**Step 2: Intent Detection**
```
Input: message, history, language, pending_actions
Chain: intent_chain() → LLM JSON output
LLM says: 
{
  "intent_type": "property_search",
  "confidence": 0.95,
  "needs_tool": true,
  "tool_name": "search_internal_listings"
}

Heuristic Correction:
- looks_like_property_search() returns True
  (because "2+1", "apartments", "kyrenia" in PROPERTY_KEYWORDS)
- Confidence boosted to 0.9
```

**Step 3: Requirements Extraction**
```
Chain: requirements_chain()
LLM extracts:
{
  "bedrooms": 2,
  "location": "kyrenia",
  "max_price": 1000,
  "property_type": "apartment"
}
```

**Step 4: Tool Execution**
```
search_internal_listings(
    listing_type="property_rent",
    location="kyrenia",
    attributes={
        "beds": 2,
        "max_price": 1000,
    },
    language="en"
)

Database Query:
SELECT * FROM assistant_listing 
WHERE listing_type ILIKE '%property_rent%'
  AND location ILIKE '%kyrenia%'
  AND (structured_data->>'bedrooms')::int = 2
  AND price <= 1000
  AND is_active = true
LIMIT 25

Returns: 5 properties matching criteria
```

**Step 5: Response Assembly**
```
Response = {
    "message": "I found 5 properties for you.",
    "language": "en",
    "recommendations": [
        {
            "id": "123",
            "title": "2+1 Apartment in Girne City",
            "price": "950 EUR",
            "location": "Kyrenia",
            "images": ["image1.jpg"],
            "features": ["2 bedrooms", "Furnished"]
        },
        // ... 4 more
    ]
}
```

### Problem with This Flow

If user says: **"Show me cars in Kyrenia"**
1. Language: "en" ✅
2. Intent: LLM tries but heuristic FAILS ❌
   - "cars" is NOT in PROPERTY_KEYWORDS
   - No keyword-based fallback
   - Defaults to `general_chat` with 0.4 confidence
3. Response: Fallback chat says "I'm here to help with properties..." ❌

---

## Part 5: Graph Execution Details

### Graph State
```python
state = {
    "conversation_id": str,
    "language": "en" | "tr" | "ru" | "pl",
    "last_intent": dict,
    "last_intent_confidence": float,
    "last_recommendations": list[int],      # Listing IDs
    "pending_actions": list[dict],          # Outreach tracking
    "listing_ctx": {
        "last_listing_id": int | None,
        "image_count": int,
        "verified_with_photos": bool
    },
    "errors": list[str]
}
```

### Graph Node Details

**`node_parse_intent(state)`**
```python
def node_parse_intent(state: Dict[str, Any]) -> Dict[str, Any]:
    # Calls parse_and_correct_intent() from agent_utils
    # Uses heuristics to fix weak LLM classifications
    # Updates state["last_intent"] and state["last_intent_confidence"]
    # Returns updated state
```

**`node_property_search(state)`**
```python
# Extract requirements
req = run_chain(requirements_chain(), message=user_text, language=language)

# Call tool
result = search_internal_listings(
    listing_type="property_rent",
    location=location,
    attributes={...},
    language=language
)

# Build cards & save history
recommendations = _build_recommendation_card(listing_id) for each result
save_assistant_turn(conversation_id, user_text, msg, context)

return {
    "message": f"I found {len(result)} properties",
    "recommendations": recommendations,
    "last_recommendations": [card["id"] for card in recommendations]
}
```

---

## Part 6: Current Functionality Matrix

| Feature | Supported? | How | Limitation |
|---------|-----------|-----|-----------|
| **Property Search** | ✅ Yes | Heuristics + LLM | TRNC-only, no other regions |
| **Agent Outreach** | ✅ Yes | Twilio WhatsApp | Property-specific contact logic |
| **Photo Request** | ✅ Yes | Pending action tracking | Only for properties |
| **Price Filtering** | ✅ Yes | Numeric range | Single price unit (per night) |
| **Location Filtering** | ✅ Yes | Normalized aliases | Hard-coded North Cyprus locations |
| **Feature Filtering** | ✅ Yes | JSON keyword search | Property-specific features (bedrooms, furnished) |
| **Multi-Language** | ✅ Yes | Detected + used in prompts | en, tr, ru, pl |
| **Knowledge Base** | ✅ Yes | Free-form search | Not connected to intent routing |
| **Service Provider Search** | ⚠️ Partial | Implemented, not routed | Missing intent classification for services |
| **Car Rental Search** | ❌ No | Tool exists but not called | Car-specific keywords not recognized |
| **Food/Restaurant Search** | ❌ No | No tool, no keywords | Completely unsupported |
| **Electronics Search** | ❌ No | No tool, no keywords | Completely unsupported |
| **Dynamic Categories** | ❌ No | Hard-coded categories only | Can't learn new categories |

---

## Part 7: Number of Graphs

**Answer: 1 Graph (LangGraph-based orchestrator)**

```
File: assistant/brain/graph.py
Class: _build_graph() function
Nodes: 8 (parse_intent, property_search, outreach, status, knowledge, service_search, continuation, fallback)
Edges: Sequential routing based on intent_type
Status: Operational alongside agent.py
```

**Note:** There are TWO orchestrators:
1. **Sequential Agent** (`assistant/brain/agent.py`) - Primary, working
2. **Graph Agent** (`assistant/brain/graph.py`) - Newer, stateful alternative
   - Can run with or without LangGraph library
   - Uses same chains, tools, and heuristics

---

## Part 8: Agent Extension Plan

### Phase 1: Dynamic Category Recognition (2-3 days)

**Goal:** Teach agent to recognize product categories dynamically

**Changes:**

1. **Create `CATEGORY_KEYWORDS` dictionary**
```python
# assistant/brain/category_keywords.py
CATEGORY_KEYWORDS = {
    "accommodation": ["hotel", "apartment", "flat", "house", "villa", "rental", "stay", "booking"],
    "car_rental": ["car", "rental", "drive", "rent a car", "vehicle", "auto", "automobile"],
    "activities": ["activity", "tour", "experience", "adventure", "things to do", "attraction"],
    "dining": ["restaurant", "food", "eat", "meal", "cuisine", "cafe", "dinner", "lunch"],
    "beaches": ["beach", "sea", "shore", "sandy", "swimming"],
    "electronics": ["phone", "laptop", "computer", "camera", "device", "tech", "gadget"],
    "beauty": ["hair", "makeup", "skincare", "salon", "cosmetics", "beauty"],
    "fashion": ["clothing", "shoes", "apparel", "dress", "outfit", "fashion"],
    "services": ["lawyer", "doctor", "clinic", "plumber", "electrician", "repair"],
    # ... 40+ more categories
}
```

2. **Update Intent Prompt**
   - Add dynamic category detection
   - Map user query to category_id from database
   - Return both intent_type AND category_id

3. **Create Category Intent Type**
```python
# New intent types
"product_search": {
    "category_id": "uuid",
    "category_name": "beauty" | "electronics" | etc.,
    "search_type": "internal" | "external",
}
```

### Phase 2: Unified Search Tool (3-4 days)

**Goal:** Create single search tool that handles any product category

**Current:**
```python
search_internal_listings(
    listing_type="property_rent",  # Hard-coded
    location=location,
    attributes=attributes,
    language=language,
)
```

**New:**
```python
def search_listings_by_category(
    category_slug: str,           # "accommodation", "beauty", "electronics", etc.
    subcategory_slug: Optional[str] = None,
    location: Optional[str] = None,
    attributes: Optional[Dict] = None,
    language: str = "en",
) -> Dict[str, Any]:
    """
    Universal search across ALL product categories.
    
    Parameters:
    - category_slug: backend category ("beauty", "electronics", "accommodation")
    - attributes: flexible filters (price, location, features, etc.)
    
    Returns:
    - Standard card format for any product type
    """
    # Query: SELECT * FROM assistant_listing 
    #        WHERE category.slug = category_slug 
    #        AND filters...
    
    # Handle different price units dynamically
    # Handle different feature sets per category
    # Return cards with category-specific metadata
```

### Phase 3: Database Schema Updates (1-2 days)

**Goal:** Add category support to Listing model

**Migrations needed:**
```python
# New fields
category = ForeignKey(Category, on_delete=models.CASCADE)
subcategory = ForeignKey(Subcategory, on_delete=models.SET_NULL, null=True)
price_unit = CharField(default="per item")  # "per night", "per day", "per person", "per item"

# Keep backward compatibility
# Existing Listing records → assign to "accommodation" category automatically
```

### Phase 4: Update Heuristics (1 day)

**Goal:** Multi-category keyword detection

**New heuristic:**
```python
def detect_product_category(text: str) -> Optional[str]:
    """
    Detect which category user is searching for.
    
    Returns category slug or None if unclear.
    """
    from .category_keywords import CATEGORY_KEYWORDS
    
    t = text.lower()
    
    # Score each category by keyword matches
    scores = {}
    for cat, keywords in CATEGORY_KEYWORDS.items():
        matches = sum(1 for kw in keywords if kw in t)
        if matches > 0:
            scores[cat] = matches
    
    # Return highest-scoring category
    if scores:
        return max(scores, key=scores.get)
    
    return None
```

### Phase 5: Update Graph (1-2 days)

**Goal:** Dynamic routing based on category

**New graph edge:**
```
parse_intent → [category detected?]
    ├─ Yes → product_search_node(category_slug)
    │         ├─ search_listings_by_category(category_slug, ...)
    │         ├─ return cards
    │         └─ fallback if no results
    │
    └─ No → existing property_search / general_chat
```

**New nodes:**
```python
def node_product_search(state: Dict[str, Any]) -> Dict[str, Any]:
    # Universal handler for all product categories
    # Extracts category from intent
    # Calls search_listings_by_category()
    # Returns cards with category-specific rendering hints

def node_contact_merchant(state: Dict[str, Any]) -> Dict[str, Any]:
    # Universal outreach handler
    # Works for ANY seller (property owner, shop, restaurant)
    # Uses contact info from listing.structured_data
```

### Phase 6: Frontend Integration (1-2 days)

**Goal:** Cards rendered based on category

**Example:**
- **Accommodation card:** Image + price "€150/night" + "2 bedrooms" + [Book] button
- **Car rental card:** Image + price "€40/day" + "Automatic, AC" + [Reserve] button
- **Restaurant card:** Image + price "Average €25" + "Outdoor seating, WiFi" + [Reserve] button
- **Beauty card:** Image + price "€50" + "Hair styling" + [Book appointment] button

---

## Part 9: Implementation Roadmap

### Week 1: Category Recognition
```
Monday-Wednesday:
  ✅ Create CATEGORY_KEYWORDS
  ✅ Update INTENT_PROMPT to detect categories
  ✅ Add category_id to intent result

Thursday-Friday:
  ✅ Add detect_product_category() heuristic
  ✅ Update graph parse_intent node
  ✅ Test with sample queries
```

### Week 2: Search Tool
```
Monday-Tuesday:
  ✅ Design search_listings_by_category() API
  ✅ Handle flexible price_unit
  ✅ Handle flexible features per category

Wednesday-Thursday:
  ✅ Update Listing model (migrations)
  ✅ Seed categories into database
  ✅ Update admin to support category assignment

Friday:
  ✅ Test search across categories
  ✅ Fallback for backward compat
```

### Week 3: Graph & Integration
```
Monday-Tuesday:
  ✅ Add node_product_search()
  ✅ Update graph routing
  ✅ Add category-aware outreach

Wednesday:
  ✅ Update frontend cards
  ✅ Test E2E flows

Thursday-Friday:
  ✅ Polish & edge cases
  ✅ Multilingual support
```

---

## Part 10: Critical Implementation Details

### Required Database Changes

```python
# Migration: Create categories
class Migration(migrations.Migration):
    operations = [
        migrations.AddField(
            model_name='listing',
            name='category',
            field=models.ForeignKey('assistant.Category', on_delete=models.CASCADE),
        ),
        migrations.AddField(
            model_name='listing',
            name='subcategory',
            field=models.ForeignKey('assistant.Subcategory', on_delete=models.SET_NULL, null=True, blank=True),
        ),
        migrations.AddField(
            model_name='listing',
            name='price_unit',
            field=models.CharField(max_length=50, default='per item'),
        ),
        # Populate existing listings → accommodation category
        migrations.RunPython(populate_existing_listings),
    ]

# Populate function
def populate_existing_listings(apps, schema_editor):
    Listing = apps.get_model('assistant', 'Listing')
    Category = apps.get_model('assistant', 'Category')
    
    accommodation = Category.objects.get(slug='accommodation')
    for listing in Listing.objects.filter(category__isnull=True):
        listing.category = accommodation
        listing.price_unit = 'per night'  # Assume nightly for rentals
        listing.save()
```

### Updated Search Tool

```python
def search_listings_by_category(
    category_slug: str,
    subcategory_slug: Optional[str] = None,
    location: Optional[str] = None,
    attributes: Optional[Dict] = None,
    language: str = "en",
) -> Dict[str, Any]:
    """
    Universal search across all product categories.
    """
    try:
        # Get category object
        category = Category.objects.get(slug=category_slug)
        
        # Start query
        qs = Listing.objects.filter(category=category, is_active=True)
        
        # Apply subcategory if provided
        if subcategory_slug:
            qs = qs.filter(subcategory__slug=subcategory_slug)
        
        # Apply location if provided (optional for non-geographic categories)
        if location:
            norm_loc = normalize_location(location)
            qs = qs.filter(
                Q(location__icontains=norm_loc)
                | Q(structured_data__location__icontains=norm_loc)
            )
        
        # Apply flexible attributes
        if attributes:
            if max_price := attributes.get('max_price'):
                qs = qs.filter(price__lte=max_price)
            if min_price := attributes.get('min_price'):
                qs = qs.filter(price__gte=min_price)
            if features := attributes.get('features'):
                for feat in features:
                    qs = qs.filter(
                        Q(features__icontains=feat)
                        | Q(structured_data__features__icontains=feat)
                    )
        
        qs = qs.order_by('-is_featured', '-rating', '-created_at')[:25]
        
        # Build cards
        cards = []
        for listing in qs:
            card = {
                "id": str(listing.id),
                "title": listing.structured_data.get('title', listing.title),
                "price": f"{listing.price} {listing.currency}",
                "price_unit": listing.price_unit,
                "category": category_slug,
                "images": listing.structured_data.get('image_urls', [])[:5],
                "features": listing.features or listing.structured_data.get('features', []),
                "rating": float(listing.rating or 0),
            }
            cards.append(card)
        
        return {"success": True, "count": len(cards), "data": cards}
    
    except Exception as e:
        logger.exception(f"search_listings_by_category failed for {category_slug}")
        return {"success": False, "error": str(e), "count": 0, "data": []}
```

### Updated Intent Prompt

```python
INTENT_PROMPT_V2 = ChatPromptTemplate.from_messages([
    ("system", """
You are Easy Islanders AI Assistant for a multi-category marketplace.

PRIMARY TASK: Detect user's true intent AND identify which product category they're searching for.

MARKETPLACE STRUCTURE:
- Frontend: 6 visible categories (Accommodation, Cars, Activities, Dining, Beaches, Chat)
- Backend: 50+ categories (Electronics, Beauty, Fashion, Services, etc.)
- Users can search ANY backend category via AI Chat

INTENT TYPES:
1. PRODUCT_SEARCH - User wants to find products/services
   → Extract: category_slug, location (if relevant), price, features
   → Categories: accommodation, car_rental, activities, dining, beaches, electronics, beauty, fashion, services, etc.
   
2. AGENT_OUTREACH - User wants to contact seller/merchant
   → Extract: which listing/merchant to contact
   
3. STATUS_UPDATE - Check on pending actions
   
4. GENERAL_CHAT - Everything else

CATEGORY DETECTION:
- User: "Show me cars under 5000 euros" → category: car_rental
- User: "Find restaurants in Kyrenia" → category: dining
- User: "Hair services" → category: beauty
- User: "Electronics under 100" → category: electronics
- User: "Show me hotels" → category: accommodation

Return STRICT JSON:
{
  "intent_type": "product_search" | "agent_outreach" | "status_update" | "general_chat",
  "category_slug": "accommodation" | "car_rental" | "electronics" | null,
  "location": "kyrenia" | null,
  "confidence": 0.95,
  "reasoning": "User mentioned cars + price range"
}
""".strip()),
    ("user", """
Message: "{message}"
History: {history_json}
Language: {language}

Analyze and return JSON.
""".strip())
])
```

---

## Part 11: Testing Strategy

### Unit Tests
```python
# test_category_detection.py
def test_detect_car_search():
    assert detect_product_category("Show me cars under 5000") == "car_rental"

def test_detect_food_search():
    assert detect_product_category("restaurants in kyrenia") == "dining"

def test_detect_beauty_search():
    assert detect_product_category("hair products") == "beauty"

# test_search_by_category.py
def test_search_accommodation():
    result = search_listings_by_category("accommodation", location="kyrenia")
    assert result["success"] is True

def test_search_electronics():
    result = search_listings_by_category("electronics", attributes={"max_price": 100})
    assert result["success"] is True
```

### E2E Tests
```
User: "Show me hair salons"
Expected: Category detected as "beauty", search results shown

User: "Find restaurants near me"
Expected: Category "dining", results in current location

User: "Rent a car for 2 days"
Expected: Category "car_rental", price calculated as 2 * daily_rate

User: "Looking for 2+1 apartment in Kyrenia"
Expected: Category "accommodation", filtered by bedrooms + location
```

---

## Part 12: Migration Path (Backward Compatibility)

### Phase 1: Add New Code (No Breaking Changes)
- Add `Category` and `Subcategory` models
- Add `category_id`, `subcategory_id`, `price_unit` fields to Listing
- Existing listings remain valid (no category = accommodation)
- New code uses new fields, old code ignores them

### Phase 2: Gradual Migration
- Populate `category_id` for existing listings (accommodation)
- Update intent detection to use new heuristics
- Both old and new paths work

### Phase 3: Full Switchover
- Remove old property_search logic
- Routes all product searches through new unified tool
- Old code becomes fallback only

---

## Summary Table: Before vs After

| Aspect | Before | After |
|--------|--------|-------|
| **Supported Categories** | 1 (accommodation) | 50+ (unlimited) |
| **Search Intent Recognition** | Property keywords only | Dynamic category detection |
| **Search Tool** | `search_internal_listings()` property-specific | `search_listings_by_category()` universal |
| **Graph Nodes** | 8 (property-biased) | 10 (category-agnostic) |
| **Heuristics** | Hard-coded property keywords | Dynamic category keyword mapping |
| **Database Model** | No category field | Category + Subcategory FKs |
| **Price Flexibility** | Per-night only | Per-item, per-day, per-person, etc. |
| **Location Constraints** | North Cyprus only | Any location |
| **Frontend UI** | Property cards only | Adaptive cards per category |

---

**Ready for implementation? Start with Phase 1 (Category Keywords) and proceed step-by-step.**
