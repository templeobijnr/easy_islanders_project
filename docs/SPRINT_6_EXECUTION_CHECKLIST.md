# Sprint 6: Preference Extraction - Execution Checklist

**Goal:** Persist structured real-estate preferences and have the RE agent pre-filter with them—fully flagged, observable, and rollback-safe.

**Duration:** 2 weeks
**Team:** Backend (2), Frontend (1), QA (1)
**Status:** ✅ READY TO START

---

## 🎯 Acceptance Criteria

Sprint 6 is **DONE** when:
- [ ] In staging, RE agent pre-filters using saved budget/location/bedrooms when user doesn't specify them
- [ ] Agent reply acknowledges: "Based on your saved budget 150-200k EUR, ..."
- [ ] Preference chips visible in chat header with "Edit" button
- [ ] "Pause personalization" toggle works per-thread
- [ ] ≥90% extraction accuracy on 100-message sample (manual eval) for MVP fields (budget, location, bedrooms)
- [ ] No TTFB regression; prefs read cached (5-min) and observable
- [ ] WS traces include `meta.traces.memory.preferences_used`
- [ ] Grafana dashboard panel for `prefs_*` metrics

---

## 📋 Task Breakdown

### Pre-Sprint Setup (1 day)

#### Backend Setup
- [ ] **T1.1** Verify pgvector extension installed on dev/staging
  ```sql
  -- Run as superuser
  CREATE EXTENSION IF NOT EXISTS vector;
  SELECT * FROM pg_extension WHERE extname = 'vector';
  ```

- [ ] **T1.2** Test OpenAI API access with LangChain
  ```python
  from langchain_openai import ChatOpenAI
  from langchain.output_parsers import PydanticOutputParser
  llm = ChatOpenAI(model="gpt-4-turbo-preview", temperature=0)
  print(llm.invoke("Test: extract budget from 'need 2BR under 200k'"))
  ```

- [ ] **T1.3** Verify Celery workers running
  ```bash
  celery -A easy_islanders inspect active
  celery -A easy_islanders inspect registered
  ```

- [ ] **T1.4** Create Sprint 6 feature flags in settings
  ```python
  # easy_islanders/settings/base.py
  PREF_READ_ENABLED = env.bool("PREF_READ_ENABLED", default=False)
  PREF_WRITE_ENABLED = env.bool("PREF_WRITE_ENABLED", default=False)
  PREF_EXTRACT_ASYNC = env.bool("PREF_EXTRACT_ASYNC", default=True)
  ```

---

### Week 1: Core Backend Infrastructure

#### Day 1-2: Database Schema & Service Layer

- [ ] **T2.1** Create Django models with schema versioning
  ```python
  # assistant/models.py

  class UserPreference(models.Model):
      SCHEMA_VERSION = 1

      CATEGORY_CHOICES = [
          ('real_estate', 'Real Estate'),
          ('services', 'Services'),
      ]

      SOURCE_CHOICES = [
          ('explicit', 'Explicitly Stated'),
          ('inferred', 'Inferred from Context'),
          ('behavior', 'Learned from Behavior'),
      ]

      PREFERENCE_TYPE_CHOICES = [
          ('budget', 'Budget'),
          ('location', 'Location'),
          ('bedrooms', 'Bedrooms'),
          ('bathrooms', 'Bathrooms'),
          ('property_type', 'Property Type'),
          ('features', 'Features'),
      ]

      id = models.UUIDField(primary_key=True, default=uuid.uuid4)
      user = models.ForeignKey(User, on_delete=models.CASCADE)
      category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
      preference_type = models.CharField(max_length=50, choices=PREFERENCE_TYPE_CHOICES)

      # Normalized enum values
      value = models.JSONField()  # {type, min/max/values, unit, applied_from}
      raw_value = models.TextField(blank=True)  # Original user utterance

      # Confidence & decay
      confidence = models.FloatField(default=1.0)
      extracted_at = models.DateTimeField(auto_now_add=True)
      last_used_at = models.DateTimeField(null=True, blank=True)
      last_decayed_at = models.DateTimeField(default=timezone.now)
      use_count = models.IntegerField(default=0)

      source = models.CharField(max_length=50, choices=SOURCE_CHOICES)
      schema_version = models.IntegerField(default=SCHEMA_VERSION)

      # Audit
      embedding = VectorField(dimensions=1536, null=True, blank=True)
      metadata = models.JSONField(default=dict)  # {reasoning, contradictions, etc.}

      class Meta:
          db_table = 'user_preferences'
          unique_together = [['user', 'category', 'preference_type']]
          indexes = [
              models.Index(fields=['user', 'category']),
              models.Index(fields=['-confidence', '-last_used_at']),
          ]

      @property
      def is_stale(self):
          """Check if preference needs decay (30+ days since last use)."""
          if not self.last_used_at:
              return False
          return (timezone.now() - self.last_used_at).days > 30

      def apply_time_decay(self, days_since_use: int) -> float:
          """
          Apply time-based confidence decay.

          Decay schedule:
          - 0-7 days: no decay
          - 7-30 days: -0.01 per day
          - 30-90 days: -0.02 per day
          - 90+ days: -0.05 per day
          """
          if days_since_use <= 7:
              return 0
          elif days_since_use <= 30:
              return (days_since_use - 7) * 0.01
          elif days_since_use <= 90:
              return 0.23 + (days_since_use - 30) * 0.02
          else:
              return 1.43 + (days_since_use - 90) * 0.05


  class PreferenceExtractionEvent(models.Model):
      """Audit trail for extraction attempts."""
      id = models.UUIDField(primary_key=True, default=uuid.uuid4)
      user = models.ForeignKey(User, on_delete=models.CASCADE)
      thread_id = models.CharField(max_length=255)
      message_id = models.UUIDField()
      utterance = models.TextField()
      extracted_preferences = models.JSONField()
      confidence_scores = models.JSONField()
      extraction_method = models.CharField(max_length=50)
      llm_reasoning = models.TextField(blank=True)
      contradictions_detected = models.JSONField(default=list)
      created_at = models.DateTimeField(auto_now_add=True)
  ```

- [ ] **T2.2** Create migration and apply
  ```bash
  python manage.py makemigrations assistant --name add_user_preferences_v1
  python manage.py migrate assistant
  ```

- [ ] **T2.3** Add pgvector index migration
  ```python
  # assistant/migrations/0XXX_add_pgvector_index.py
  operations = [
      migrations.RunSQL(
          sql="""
              CREATE INDEX user_preferences_embedding_idx
              ON user_preferences
              USING ivfflat (embedding vector_cosine_ops)
              WITH (lists = 100);
          """,
          reverse_sql="DROP INDEX IF EXISTS user_preferences_embedding_idx;"
      ),
  ]
  ```

- [ ] **T2.4** Create canonical value normalizers
  ```python
  # assistant/services/preference_normalizer.py

  # Canonical location mappings
  LOCATION_CANONICAL = {
      "girne": "Girne",
      "kyrenia": "Girne",
      "lefkosa": "Nicosia",
      "nicosia": "Nicosia",
      "iskele": "Iskele",
      "famagusta": "Iskele",
      "gazimagusa": "Iskele",
      # ... add all city variants
  }

  # Canonical feature mappings
  FEATURE_CANONICAL = {
      "pool": "swimming_pool",
      "swimming pool": "swimming_pool",
      "sea view": "sea_view",
      "seaview": "sea_view",
      "ocean view": "sea_view",
      "gym": "fitness_center",
      "fitness": "fitness_center",
      # ... add all feature variants
  }

  def normalize_location(raw: str) -> str:
      """Normalize location to canonical form."""
      return LOCATION_CANONICAL.get(raw.lower().strip(), raw.title())

  def normalize_features(raw_list: List[str]) -> List[str]:
      """Normalize features to canonical enum values."""
      return [FEATURE_CANONICAL.get(f.lower(), f) for f in raw_list]

  def normalize_budget(raw_min: float, raw_max: float, currency: str) -> dict:
      """Normalize budget to EUR with standard ranges."""
      # Convert to EUR if needed
      if currency == "USD":
          raw_min *= 0.92
          raw_max *= 0.92
      elif currency == "GBP":
          raw_min *= 1.16
          raw_max *= 1.16

      return {
          "type": "range",
          "min": round(raw_min, -3),  # Round to nearest 1000
          "max": round(raw_max, -3),
          "currency": "EUR"
      }
  ```

- [ ] **T2.5** Create PreferenceService with idempotency
  ```python
  # assistant/services/preference_service.py

  import hashlib
  from django.utils import timezone
  from django.db import transaction
  from assistant.models import UserPreference
  from assistant.services.preference_normalizer import (
      normalize_location, normalize_features, normalize_budget
  )

  class PreferenceService:
      """Service for preference CRUD with idempotency and normalization."""

      @staticmethod
      def _hash_preference(user_id: str, category: str, pref_type: str, value: dict) -> str:
          """Generate idempotent hash for preference."""
          key = f"{user_id}:{category}:{pref_type}:{json.dumps(value, sort_keys=True)}"
          return hashlib.sha256(key.encode()).hexdigest()[:16]

      @classmethod
      def upsert_preference(
          cls,
          user_id: str,
          category: str,
          preference_type: str,
          value: dict,
          confidence: float,
          source: str,
          raw_value: str = "",
          metadata: dict = None
      ) -> UserPreference:
          """
          Idempotent preference upsert with normalization.

          Precedence: current turn > explicit saved > strong inferred (≥0.7) > weak inferred
          """
          # Normalize value
          if preference_type == "location":
              value["values"] = [normalize_location(v) for v in value.get("values", [])]
          elif preference_type == "budget":
              value = normalize_budget(
                  value.get("min", 0),
                  value.get("max", float('inf')),
                  value.get("currency", "EUR")
              )
          elif preference_type == "features":
              value["values"] = normalize_features(value.get("values", []))

          # Check for existing preference
          existing = UserPreference.objects.filter(
              user_id=user_id,
              category=category,
              preference_type=preference_type
          ).first()

          # Contradiction detection
          contradictions = []
          if existing and existing.source == "explicit" and source == "explicit":
              # Explicit contradiction → record and use new value
              if existing.value != value:
                  contradictions.append({
                      "old_value": existing.value,
                      "new_value": value,
                      "timestamp": timezone.now().isoformat()
                  })
                  # Reduce confidence on old preference
                  existing.confidence = max(existing.confidence - 0.3, 0.3)
                  existing.save()

          # Upsert with precedence rules
          obj, created = UserPreference.objects.update_or_create(
              user_id=user_id,
              category=category,
              preference_type=preference_type,
              defaults={
                  "value": value,
                  "raw_value": raw_value,
                  "confidence": confidence,
                  "source": source,
                  "extracted_at": timezone.now(),
                  "metadata": metadata or {"contradictions": contradictions}
              }
          )

          return obj

      @classmethod
      def get_active_with_precedence(
          cls,
          user_id: str,
          category: str = None,
          min_confidence: float = 0.4
      ) -> dict:
          """
          Get active preferences with precedence and 'why' notes.

          Returns: {
              "real_estate": {
                  "budget": {
                      "value": {...},
                      "applied_from": "explicit",
                      "confidence": 1.0,
                      "why": "You told me your budget is 150-200k EUR"
                  }
              }
          }
          """
          qs = UserPreference.objects.filter(
              user_id=user_id,
              confidence__gte=min_confidence
          ).order_by('-confidence', '-last_used_at')

          if category:
              qs = qs.filter(category=category)

          # Apply time-based decay
          for pref in qs:
              if pref.last_used_at:
                  days_since_use = (timezone.now() - pref.last_used_at).days
                  decay = pref.apply_time_decay(days_since_use)
                  if decay > 0:
                      pref.confidence = max(pref.confidence - decay, 0.1)
                      pref.last_decayed_at = timezone.now()
                      pref.save()

          result = {}
          for pref in qs:
              if pref.category not in result:
                  result[pref.category] = {}

              # Generate "why" note
              why = cls._generate_why_note(pref)

              result[pref.category][pref.preference_type] = {
                  "value": pref.value,
                  "applied_from": pref.source,
                  "confidence": round(pref.confidence, 2),
                  "why": why,
                  "last_used": pref.last_used_at.isoformat() if pref.last_used_at else None
              }

          return result

      @staticmethod
      def _generate_why_note(pref: UserPreference) -> str:
          """Generate human-readable 'why' note for preference."""
          if pref.source == "explicit":
              return f"You told me {pref.raw_value or 'your preferences'}"
          elif pref.source == "inferred":
              if pref.confidence >= 0.7:
                  return f"Based on our conversation about {pref.preference_type}"
              else:
                  return f"I inferred this from your recent searches"
          elif pref.source == "behavior":
              return f"Based on properties you've saved or viewed"
          return "Saved from previous conversation"
  ```

#### Day 3: Extraction Pipeline

- [ ] **T3.1** Create LangChain structured extraction with fallback
  ```python
  # assistant/services/preference_extraction.py

  from langchain.output_parsers import PydanticOutputParser
  from langchain.prompts import PromptTemplate
  from langchain_openai import ChatOpenAI
  from pydantic import BaseModel, Field
  import re

  # Pydantic schemas (same as before)
  # ... ExtractedPreference, PreferenceExtractionOutput ...

  class PreferenceExtractor:
      """LLM-powered extraction with rule-based fallback."""

      def __init__(self):
          self.llm = ChatOpenAI(model="gpt-4-turbo-preview", temperature=0)
          self.parser = PydanticOutputParser(pydantic_object=PreferenceExtractionOutput)

      def extract(self, user_message: str, conversation_history: List[dict], existing_preferences: List[dict]) -> PreferenceExtractionOutput:
          """Extract with LLM, fallback to rules on failure."""
          try:
              return self._llm_extract(user_message, conversation_history, existing_preferences)
          except Exception as exc:
              logger.warning(f"LLM extraction failed, using rule fallback: {exc}")
              return self._rule_fallback_extract(user_message)

      def _llm_extract(self, user_message, history, existing) -> PreferenceExtractionOutput:
          """LLM extraction (same as before)."""
          # ... existing implementation ...

      def _rule_fallback_extract(self, user_message: str) -> PreferenceExtractionOutput:
          """
          Rule-based fallback for budget, location, bedrooms.

          Patterns:
          - Budget: "200k", "under 200000", "150-250k EUR"
          - Location: "in Girne", "near Kyrenia", "Lefkosa"
          - Bedrooms: "2 bedroom", "3BR", "two bed"
          """
          preferences = []

          # Budget pattern
          budget_match = re.search(r'(?:budget|price)?\s*(?:under|up to|max)?\s*(\d+(?:\.\d+)?)\s*(?:k|thousand)?\s*(EUR|USD|GBP)?', user_message, re.I)
          if budget_match:
              amount = float(budget_match.group(1))
              if 'k' in user_message.lower() or 'thousand' in user_message.lower():
                  amount *= 1000
              currency = budget_match.group(2) or "EUR"
              preferences.append(ExtractedPreference(
                  category="real_estate",
                  preference_type="budget",
                  value=PreferenceRange(type="range", min=0, max=amount, unit=currency),
                  confidence=0.9,
                  source="explicit",
                  reasoning=f"Extracted budget from pattern: {budget_match.group(0)}"
              ))

          # Location pattern
          location_keywords = ["girne", "kyrenia", "lefkosa", "nicosia", "iskele", "famagusta"]
          for keyword in location_keywords:
              if keyword in user_message.lower():
                  preferences.append(ExtractedPreference(
                      category="real_estate",
                      preference_type="location",
                      value=PreferenceList(type="list", values=[keyword.title()]),
                      confidence=0.95,
                      source="explicit",
                      reasoning=f"Found location keyword: {keyword}"
                  ))
                  break

          # Bedrooms pattern
          bedrooms_match = re.search(r'(\d+)\s*(?:bed(?:room)?|BR)', user_message, re.I)
          if bedrooms_match:
              bed_count = int(bedrooms_match.group(1))
              preferences.append(ExtractedPreference(
                  category="real_estate",
                  preference_type="bedrooms",
                  value=PreferenceRange(type="range", min=bed_count, max=bed_count),
                  confidence=1.0,
                  source="explicit",
                  reasoning=f"Extracted bedrooms from pattern: {bedrooms_match.group(0)}"
              ))

          return PreferenceExtractionOutput(
              preferences=preferences,
              overall_reasoning="Rule-based fallback extraction"
          )
  ```

- [ ] **T3.2** Create Celery task with retry and circuit breaker
  ```python
  # assistant/tasks.py

  from celery import shared_task
  from assistant.services.preference_service import PreferenceService
  from assistant.services.preference_extraction import PreferenceExtractor
  from assistant.monitoring.metrics import inc_preference_extract_requests, inc_preference_saved
  import logging

  logger = logging.getLogger(__name__)

  @shared_task(bind=True, max_retries=3, autoretry_for=(Exception,), retry_backoff=True)
  def extract_preferences_async(self, user_id: str, thread_id: str, message_id: str, user_message: str):
      """
      Async preference extraction with retry and metrics.

      Feature flag: PREF_EXTRACT_ASYNC (default: True)
      """
      from django.conf import settings

      if not settings.PREF_WRITE_ENABLED:
          logger.debug("PREF_WRITE disabled, skipping extraction")
          return {"skipped": True, "reason": "flag_disabled"}

      try:
          inc_preference_extract_requests(result="started")

          # Get conversation history
          from assistant.models import Message
          messages = Message.objects.filter(thread_id=thread_id).order_by('-created_at')[:10]
          history = [{"role": m.role, "content": m.content} for m in reversed(messages)]

          # Get existing preferences
          existing = PreferenceService.get_active_with_precedence(
              user_id=user_id,
              category="real_estate"
          ).get("real_estate", {})

          # Extract
          extractor = PreferenceExtractor()
          extraction = extractor.extract(
              user_message=user_message,
              conversation_history=history,
              existing_preferences=[existing]
          )

          # Save (idempotent upsert with PII redaction)
          from assistant.memory.pii import redact_pii

          saved_count = 0
          for pref in extraction.preferences:
              if pref.confidence >= 0.4:
                  # Redact PII from raw value
                  redacted = redact_pii(user_message, redact_email=True, redact_phone=True)

                  PreferenceService.upsert_preference(
                      user_id=user_id,
                      category=pref.category,
                      preference_type=pref.preference_type,
                      value=pref.value.dict(),
                      confidence=pref.confidence,
                      source=pref.source,
                      raw_value=redacted["text"],
                      metadata={"reasoning": pref.reasoning}
                  )

                  inc_preference_saved(type=pref.preference_type, source=pref.source)
                  saved_count += 1

          inc_preference_extract_requests(result="success")
          logger.info(f"Extracted {len(extraction.preferences)} preferences, saved {saved_count}")

          return {
              "success": True,
              "extracted_count": len(extraction.preferences),
              "saved_count": saved_count,
              "types": [p.preference_type for p in extraction.preferences]
          }

      except Exception as exc:
          inc_preference_extract_requests(result="failure")
          logger.error(f"Preference extraction failed: {exc}", exc_info=True)
          raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))
  ```

#### Day 4: Metrics & Observability

- [ ] **T4.1** Add Prometheus metrics
  ```python
  # assistant/monitoring/metrics.py (add to existing file)

  # Preference extraction metrics
  PREF_EXTRACT_REQUESTS_TOTAL = Counter(
      "prefs_extract_requests_total",
      "Count of preference extraction requests by result",
      ["result"]  # started, success, failure
  )

  PREF_SAVED_TOTAL = Counter(
      "prefs_saved_total",
      "Count of saved preferences by type and source",
      ["type", "source"]
  )

  PREF_APPLIED_TOTAL = Counter(
      "prefs_applied_total",
      "Count of preferences applied by agent and field",
      ["agent", "field"]
  )

  PREF_CONTRADICTIONS_TOTAL = Counter(
      "prefs_contradictions_total",
      "Count of preference contradictions detected",
      ["type"]
  )

  PREF_LATENCY_SECONDS = Histogram(
      "prefs_latency_seconds",
      "Preference extraction latency",
      buckets=(0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0)
  )

  def inc_preference_extract_requests(result: str) -> None:
      try:
          if _PROMETHEUS_AVAILABLE:
              PREF_EXTRACT_REQUESTS_TOTAL.labels(result=result).inc()
      except Exception:
          pass

  def inc_preference_saved(type: str, source: str) -> None:
      try:
          if _PROMETHEUS_AVAILABLE:
              PREF_SAVED_TOTAL.labels(type=type, source=source).inc()
      except Exception:
          pass
  ```

- [ ] **T4.2** Add structured logging
  ```python
  # assistant/brain/supervisor_graph.py (update)

  def _apply_memory_context(state: SupervisorState) -> SupervisorState:
      """Fetch memory + preferences with structured logging."""
      # ... existing Zep fetch ...

      # Fetch preferences (with flag check)
      preferences = {}
      prefs_meta = {"loaded": False, "count": 0, "fields": []}

      if settings.PREF_READ_ENABLED and user_id:
          try:
              start = time.time()
              preferences = PreferenceService.get_active_with_precedence(
                  user_id=str(user_id),
                  category="real_estate",
                  min_confidence=0.5
              )
              latency = time.time() - start

              prefs_meta = {
                  "loaded": True,
                  "count": len(preferences.get("real_estate", {})),
                  "fields": list(preferences.get("real_estate", {}).keys()),
                  "latency_ms": round(latency * 1000, 2)
              }

              logger.info(
                  f"[{thread_id}] Loaded preferences: {prefs_meta['fields']} ({prefs_meta['latency_ms']}ms)",
                  extra={"preferences_meta": prefs_meta}
              )
          except Exception as exc:
              logger.warning(f"Failed to load preferences: {exc}")

      # Merge into state
      state["user_preferences"] = preferences
      state["memory_trace"]["preferences"] = prefs_meta

      return state
  ```

---

### Week 2: Agent Integration & Frontend

#### Day 5-6: RE Agent Integration

- [ ] **T5.1** Update agent contracts
  ```python
  # assistant/agents/contracts.py

  class AgentContext(TypedDict, total=False):
      user_id: str | None
      locale: Required[str]
      time: Required[str]
      conversation_capsule: NotRequired[dict[str, Any]]
      memory: NotRequired[dict[str, Any]]
      user_preferences: NotRequired[dict[str, Any]]  # NEW: {category: {type: {value, why, applied_from}}}
  ```

- [ ] **T5.2** Update RE agent to use preferences
  ```python
  # assistant/agents/real_estate/agent.py

  def handle_property_search(request: AgentRequest) -> AgentResponse:
      """
      Property search with automatic preference application.

      Precedence: current turn > explicit saved > strong inferred (≥0.7) > weak inferred
      """
      ctx = request["ctx"]
      user_input = request["input"]
      user_prefs = ctx.get("user_preferences", {}).get("real_estate", {})

      # Extract explicit params from current utterance
      explicit_params = extract_search_params(user_input)

      # Build search params with precedence
      params = {}
      auto_applied = []
      applied_fields = []

      # Budget (current turn > saved)
      if "budget" in explicit_params:
          params["price_min"] = explicit_params["budget"]["min"]
          params["price_max"] = explicit_params["budget"]["max"]
      elif "budget" in user_prefs:
          budget = user_prefs["budget"]["value"]
          params["price_min"] = budget.get("min")
          params["price_max"] = budget.get("max")
          why = user_prefs["budget"]["why"]
          auto_applied.append(f"budget {budget['min']}-{budget['max']} EUR ({why})")
          applied_fields.append("budget")

      # Location (current turn > saved)
      if "location" in explicit_params:
          params["location"] = explicit_params["location"]
      elif "location" in user_prefs:
          loc = user_prefs["location"]["value"]
          params["location"] = loc["values"][0] if loc.get("values") else None
          if params["location"]:
              why = user_prefs["location"]["why"]
              auto_applied.append(f"location {params['location']} ({why})")
              applied_fields.append("location")

      # Bedrooms (current turn > saved)
      if "bedrooms" in explicit_params:
          params["bedrooms_min"] = explicit_params["bedrooms"]["min"]
          params["bedrooms_max"] = explicit_params["bedrooms"]["max"]
      elif "bedrooms" in user_prefs:
          beds = user_prefs["bedrooms"]["value"]
          params["bedrooms_min"] = beds.get("min")
          params["bedrooms_max"] = beds.get("max")
          if params["bedrooms_min"]:
              why = user_prefs["bedrooms"]["why"]
              auto_applied.append(f"{params['bedrooms_min']} bedrooms ({why})")
              applied_fields.append("bedrooms")

      # Execute search
      from listings.models import Listing
      qs = Listing.objects.filter(is_active=True, is_published=True)

      if params.get("price_min"):
          qs = qs.filter(price__gte=params["price_min"])
      if params.get("price_max"):
          qs = qs.filter(price__lte=params["price_max"])
      if params.get("location"):
          qs = qs.filter(location__icontains=params["location"])
      if params.get("bedrooms_min"):
          qs = qs.filter(structured_data__bedrooms__gte=params["bedrooms_min"])

      listings = qs.order_by('-created_at')[:20]

      # Generate response with acknowledgment
      reply = ""
      if auto_applied:
          reply = f"Based on your saved preferences ({', '.join(auto_applied)}), "
      else:
          reply = "Here are "

      reply += f"I found {listings.count()} properties"

      if params.get("location"):
          reply += f" in {params['location']}"

      reply += ":"

      # Mark preferences as used + emit metric
      if applied_fields:
          pref_ids = [
              str(p.id) for p in UserPreference.objects.filter(
                  user_id=ctx["user_id"],
                  category="real_estate",
                  preference_type__in=applied_fields
              )
          ]
          if pref_ids:
              PreferenceService.mark_used(pref_ids)

          for field in applied_fields:
              inc_preference_applied(agent="real_estate", field=field)

      return {
          "reply": reply,
          "actions": [
              {
                  "type": "show_listings",
                  "params": {
                      "listings": [format_listing(l) for l in listings],
                      "auto_applied_preferences": auto_applied
                  }
              }
          ],
          "traces": {
              "search_params": params,
              "preferences_used": {
                  "fields": applied_fields,
                  "source": [user_prefs[f]["applied_from"] for f in applied_fields]
              },
              "auto_applied": auto_applied
          }
      }
  ```

#### Day 7-8: Frontend Integration

- [ ] **T6.1** Create preference chips component
  ```typescript
  // frontend/src/features/chat/components/PreferenceChips.tsx

  import React from 'react';
  import { useUi } from '../../../shared/context/UiContext';

  interface PreferenceChipsProps {
      preferences: {
          budget?: { value: any; why: string };
          location?: { value: any; why: string };
          bedrooms?: { value: any; why: string };
      };
      onEdit: () => void;
  }

  export const PreferenceChips: React.FC<PreferenceChipsProps> = ({ preferences, onEdit }) => {
      if (!preferences || Object.keys(preferences).length === 0) {
          return null;
      }

      return (
          <div className="flex items-center gap-2 p-3 bg-lime-50 border-b border-lime-200">
              <span className="text-sm text-slate-600 font-medium">Using saved preferences:</span>

              {preferences.budget && (
                  <div className="px-3 py-1 bg-white border border-lime-300 rounded-full text-sm">
                      Budget: {preferences.budget.value.min}-{preferences.budget.value.max} {preferences.budget.value.currency}
                  </div>
              )}

              {preferences.location && (
                  <div className="px-3 py-1 bg-white border border-lime-300 rounded-full text-sm">
                      Location: {preferences.location.value.values.join(', ')}
                  </div>
              )}

              {preferences.bedrooms && (
                  <div className="px-3 py-1 bg-white border border-lime-300 rounded-full text-sm">
                      Bedrooms: {preferences.bedrooms.value.min}
                  </div>
              )}

              <button
                  onClick={onEdit}
                  className="ml-auto px-3 py-1 text-sm text-lime-700 hover:bg-lime-100 rounded-lg transition"
              >
                  Edit
              </button>
          </div>
      );
  };
  ```

- [ ] **T6.2** Add per-thread personalization toggle
  ```typescript
  // frontend/src/features/chat/components/PersonalizationToggle.tsx

  import React, { useState } from 'react';
  import axios from 'axios';

  interface PersonalizationToggleProps {
      threadId: string;
      initialEnabled: boolean;
  }

  export const PersonalizationToggle: React.FC<PersonalizationToggleProps> = ({
      threadId,
      initialEnabled
  }) => {
      const [enabled, setEnabled] = useState(initialEnabled);
      const [loading, setLoading] = useState(false);

      const handleToggle = async () => {
          setLoading(true);
          try {
              await axios.post(`/api/threads/${threadId}/personalization/`, {
                  enabled: !enabled
              });
              setEnabled(!enabled);
          } catch (error) {
              console.error('Failed to toggle personalization:', error);
          } finally {
              setLoading(false);
          }
      };

      return (
          <div className="flex items-center gap-2">
              <label className="text-sm text-slate-600">Personalization:</label>
              <button
                  onClick={handleToggle}
                  disabled={loading}
                  className={`
                      relative inline-flex h-6 w-11 items-center rounded-full
                      transition-colors focus:outline-none focus:ring-2 focus:ring-lime-500
                      ${enabled ? 'bg-lime-600' : 'bg-slate-300'}
                      ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
              >
                  <span
                      className={`
                          inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                          ${enabled ? 'translate-x-6' : 'translate-x-1'}
                      `}
                  />
              </button>
          </div>
      );
  };
  ```

- [ ] **T6.3** Integrate with ChatPane
  ```typescript
  // frontend/src/features/chat/ChatPage.tsx (update)

  import { PreferenceChips } from './components/PreferenceChips';
  import { PersonalizationToggle } from './components/PersonalizationToggle';

  export const ChatPage: React.FC = () => {
      const { activeJob } = useUi();
      const { messages, threadId } = useChat();
      const [preferences, setPreferences] = useState(null);

      // Fetch preferences on mount
      useEffect(() => {
          if (activeJob === 'real_estate') {
              fetchPreferences();
          }
      }, [activeJob]);

      const fetchPreferences = async () => {
          try {
              const response = await axios.get('/api/preferences/?category=real_estate');
              setPreferences(response.data.preferences.real_estate || {});
          } catch (error) {
              console.error('Failed to fetch preferences:', error);
          }
      };

      return (
          <div className="flex flex-col h-full">
              <PreferenceChips
                  preferences={preferences}
                  onEdit={() => {/* TODO: Open edit modal */}}
              />

              <div className="p-4 border-b">
                  <PersonalizationToggle
                      threadId={threadId}
                      initialEnabled={true}
                  />
              </div>

              {/* ... existing chat UI ... */}
          </div>
      );
  };
  ```

#### Day 9-10: Testing & Validation

- [ ] **T7.1** Unit tests for extraction
  ```python
  # tests/services/test_preference_extraction.py

  import pytest
  from assistant.services.preference_extraction import PreferenceExtractor

  @pytest.fixture
  def extractor():
      return PreferenceExtractor()

  def test_extract_budget_explicit(extractor):
      result = extractor.extract(
          user_message="I want to spend between 150k and 200k EUR",
          conversation_history=[],
          existing_preferences=[]
      )

      assert len(result.preferences) >= 1
      budget_pref = [p for p in result.preferences if p.preference_type == "budget"][0]
      assert budget_pref.value.min == 150000
      assert budget_pref.value.max == 200000
      assert budget_pref.confidence == 1.0
      assert budget_pref.source == "explicit"

  def test_rule_fallback_on_llm_failure(extractor, monkeypatch):
      """Test rule-based fallback when LLM fails."""
      # Mock LLM to raise exception
      def mock_llm_extract(*args, **kwargs):
          raise Exception("OpenAI API down")

      monkeypatch.setattr(extractor, "_llm_extract", mock_llm_extract)

      result = extractor.extract(
          user_message="need 2 bedroom under 200k in Girne",
          conversation_history=[],
          existing_preferences=[]
      )

      # Should still extract via rules
      assert len(result.preferences) >= 2  # bedrooms + budget
      assert result.overall_reasoning == "Rule-based fallback extraction"

  def test_normalization(extractor):
      """Test canonical normalization."""
      result = extractor.extract(
          user_message="looking in kyrenia with sea view",
          conversation_history=[],
          existing_preferences=[]
      )

      location_pref = [p for p in result.preferences if p.preference_type == "location"][0]
      # Should normalize kyrenia → Girne
      assert "Girne" in location_pref.value.values or "Kyrenia" in location_pref.value.values
  ```

- [ ] **T7.2** Integration tests
  ```python
  # tests/integration/test_preference_flow.py

  import pytest
  from django.contrib.auth import get_user_model
  from assistant.services.preference_service import PreferenceService
  from assistant.tasks import extract_preferences_async

  User = get_user_model()

  @pytest.mark.django_db
  def test_end_to_end_preference_flow():
      """Test: message → extract → save → load → use."""
      # Create test user
      user = User.objects.create_user('test_prefs', 'test@example.com', 'password')

      # Step 1: Extract from message
      result = extract_preferences_async(
          user_id=str(user.id),
          thread_id="test_thread",
          message_id="msg_123",
          user_message="I need a 2 bedroom apartment in Girne, budget 200k EUR"
      )

      assert result["success"] == True
      assert result["saved_count"] >= 3  # budget, location, bedrooms

      # Step 2: Load preferences
      prefs = PreferenceService.get_active_with_precedence(
          user_id=str(user.id),
          category="real_estate"
      )

      assert "real_estate" in prefs
      assert "budget" in prefs["real_estate"]
      assert "location" in prefs["real_estate"]
      assert "bedrooms" in prefs["real_estate"]

      # Step 3: Verify normalization
      assert prefs["real_estate"]["location"]["value"]["values"] == ["Girne"]
      assert prefs["real_estate"]["budget"]["value"]["max"] == 200000

      # Step 4: Verify 'why' notes
      assert "You told me" in prefs["real_estate"]["budget"]["why"]

  @pytest.mark.django_db
  def test_contradiction_detection():
      """Test preference contradiction handling."""
      user = User.objects.create_user('test_contradiction', 'test@example.com', 'password')

      # First preference: budget 200k
      PreferenceService.upsert_preference(
          user_id=str(user.id),
          category="real_estate",
          preference_type="budget",
          value={"type": "range", "min": 0, "max": 200000, "currency": "EUR"},
          confidence=1.0,
          source="explicit",
          raw_value="budget 200k EUR"
      )

      # Contradictory preference: budget 300k
      PreferenceService.upsert_preference(
          user_id=str(user.id),
          category="real_estate",
          preference_type="budget",
          value={"type": "range", "min": 0, "max": 300000, "currency": "EUR"},
          confidence=1.0,
          source="explicit",
          raw_value="budget 300k EUR"
      )

      # Load preferences
      prefs = PreferenceService.get_active_with_precedence(
          user_id=str(user.id),
          category="real_estate"
      )

      # Should have latest value (300k)
      assert prefs["real_estate"]["budget"]["value"]["max"] == 300000

      # Check metadata for contradiction record
      pref_obj = UserPreference.objects.get(
          user_id=user.id,
          preference_type="budget"
      )
      assert "contradictions" in pref_obj.metadata
  ```

- [ ] **T7.3** Create 100-message eval dataset
  ```python
  # scripts/generate_preference_eval_dataset.py

  EVAL_DATASET = [
      {
          "id": 1,
          "utterance": "I need a 2 bedroom apartment in Girne, budget 200k EUR",
          "expected_preferences": [
              {"type": "bedrooms", "value": {"min": 2, "max": 2}, "confidence": 1.0},
              {"type": "location", "value": {"values": ["Girne"]}, "confidence": 1.0},
              {"type": "budget", "value": {"min": 0, "max": 200000, "currency": "EUR"}, "confidence": 1.0}
          ]
      },
      {
          "id": 2,
          "utterance": "looking for family home near the beach",
          "expected_preferences": [
              {"type": "bedrooms", "value": {"min": 2, "max": 3}, "confidence": 0.7},
              {"type": "features", "value": {"values": ["sea_view"]}, "confidence": 0.6}
          ]
      },
      # ... 98 more examples ...
  ]

  def evaluate_extraction_accuracy(extractor, dataset):
      """Evaluate extraction accuracy on dataset."""
      correct = 0
      total = 0

      for example in dataset:
          result = extractor.extract(
              user_message=example["utterance"],
              conversation_history=[],
              existing_preferences=[]
          )

          for expected in example["expected_preferences"]:
              total += 1
              # Check if extracted
              found = any(
                  p.preference_type == expected["type"] and
                  p.confidence >= expected["confidence"] - 0.1
                  for p in result.preferences
              )
              if found:
                  correct += 1

      accuracy = correct / total if total > 0 else 0
      return accuracy

  if __name__ == "__main__":
      extractor = PreferenceExtractor()
      accuracy = evaluate_extraction_accuracy(extractor, EVAL_DATASET)
      print(f"Extraction Accuracy: {accuracy:.2%}")

      if accuracy < 0.90:
          print("❌ FAILED: Accuracy below 90% threshold")
          sys.exit(1)
      else:
          print("✅ PASSED: Accuracy meets 90% threshold")
  ```

---

## 🔍 Rollout Plan

### Stage 1: Write-Only Dark Launch (Day 11)
- [ ] Deploy to staging with `PREF_WRITE=true`, `PREF_READ=false`
- [ ] Monitor extraction metrics for 24 hours
- [ ] Verify no performance degradation
- [ ] Check PII redaction working

### Stage 2: Read Canary (Day 12-13)
- [ ] Enable `PREF_READ=true` on staging
- [ ] Test preference chips display
- [ ] Test agent acknowledgment messages
- [ ] Verify "pause personalization" toggle
- [ ] Run full smoke test suite

### Stage 3: Production Canary (Day 14)
- [ ] Deploy to 10% of production workers
- [ ] Monitor for 24 hours:
  - `prefs_extract_requests_total{result="success"}`
  - `prefs_applied_total` > 0
  - No increase in error rate
  - TTFB within budget
- [ ] Collect user feedback

### Stage 4: Full Rollout (Sprint 7)
- [ ] Deploy to 100% if canary successful
- [ ] Run human eval on 100 conversations
- [ ] Calculate final metrics:
  - Extraction accuracy
  - Preference reuse rate
  - Repetition reduction
  - User satisfaction score

---

## 📊 Monitoring & Alerts

### Grafana Dashboard Panels

- [ ] **T8.1** Add preference metrics panel
  ```promql
  # Extraction success rate (last 1h)
  rate(prefs_extract_requests_total{result="success"}[1h])
  /
  rate(prefs_extract_requests_total[1h])

  # Preferences saved by type
  increase(prefs_saved_total[1h])

  # Preferences applied by agent
  increase(prefs_applied_total[1h])

  # Extraction latency p95
  histogram_quantile(0.95, rate(prefs_latency_seconds_bucket[5m]))
  ```

### PagerDuty Alerts

- [ ] **T8.2** Configure alerts
  ```yaml
  # Critical: Extraction failure rate >10%
  alert: PreferenceExtractionFailureHigh
  expr: rate(prefs_extract_requests_total{result="failure"}[5m]) / rate(prefs_extract_requests_total[5m]) > 0.1

  # Warning: No preferences applied in 1 hour
  alert: PreferencesNotApplied
  expr: increase(prefs_applied_total[1h]) == 0

  # Warning: Extraction latency p95 >2s
  alert: PreferenceExtractionSlow
  expr: histogram_quantile(0.95, rate(prefs_latency_seconds_bucket[5m])) > 2.0
  ```

---

## ✅ Definition of Done

Sprint 6 is **DONE** when all of the following are true:

### Functional
- [ ] RE agent pre-filters using saved budget/location/bedrooms
- [ ] Agent reply acknowledges applied preferences with "why" notes
- [ ] Preference chips visible and functional
- [ ] "Pause personalization" toggle works per-thread
- [ ] PII redacted from saved preferences

### Quality
- [ ] ≥90% extraction accuracy on 100-msg eval dataset
- [ ] All unit tests passing (>80% coverage)
- [ ] Integration tests passing
- [ ] No TTFB regression (<100ms overhead)
- [ ] Preferences cached (5-min TTL)

### Observability
- [ ] Grafana dashboard panel added
- [ ] PagerDuty alerts configured
- [ ] Structured logging in place
- [ ] WS traces include `preferences_used` metadata

### Operations
- [ ] Feature flags work (PREF_READ, PREF_WRITE)
- [ ] Rollback procedure tested
- [ ] Runbook documentation complete
- [ ] Team trained on new features

---

## 🚨 Rollback Plan

If issues arise in production:

1. **Soft Rollback (disable reads only):**
   ```bash
   export PREF_READ_ENABLED=false
   # Restart workers
   ```
   **Impact:** Chat continues, preferences still extracted but not applied

2. **Full Rollback (disable all):**
   ```bash
   export PREF_READ_ENABLED=false
   export PREF_WRITE_ENABLED=false
   # Restart workers
   ```
   **Impact:** System returns to Sprint 5 behavior

3. **Emergency:** Delete recent preferences
   ```python
   # Delete preferences created after specific timestamp
   UserPreference.objects.filter(
       extracted_at__gte='2025-11-XX 00:00:00'
   ).delete()
   ```

---

## 📞 Team Contacts

- **Backend Lead:** [Name] - Slack: #backend-dev
- **Frontend Lead:** [Name] - Slack: #frontend-dev
- **QA Lead:** [Name] - Slack: #qa
- **SRE On-Call:** PagerDuty escalation
- **PM:** [Name] - Slack: #product

---

**Last Updated:** 2025-11-03
**Status:** ✅ READY TO START
**Estimated Completion:** 2 weeks (Sprint 6)
