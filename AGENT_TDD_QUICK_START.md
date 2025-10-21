# AI Agent TDD Implementation – Quick Start Guide

## 📋 TDD Plan Overview

A **comprehensive, zero-breaking-changes implementation** of multi-category agent using Test-Driven Development.

- **Status:** 1,147-line plan ready to execute
- **Approach:** Tests FIRST, then code
- **Safety:** RED GATE protection for existing property search
- **Feature flags:** New features disabled by default

---

## 🎯 Phase 1: Foundations (This Week)

### What Gets Built
```
✅ Classification Engine (hard rules + LLM fallback)
✅ Tool Registry (central validation for all tools)
✅ Feature Flags (enable/disable features safely)
✅ Data Models (logging for learning & analytics)
✅ RED GATE (protect existing property search)
```

### Test Coverage
```
40+ new unit tests
├─ 15 classification tests
├─ 8 tool registry tests
├─ 6 feature flag tests
├─ 8 RED GATE tests (existing property search)
└─ 3 integration tests

Target: 80%+ code coverage
```

---

## 📦 Key Files to Create

### Tests (Write FIRST)
```
tests/
├─ test_classification_engine.py    (15 tests)
├─ test_tool_registry.py            (8 tests)
├─ test_feature_flags.py            (6 tests)
├─ test_existing_property_search_unchanged.py  (8 RED GATE tests)
└─ test_feature_flag_integration.py (3 tests)
```

### Implementation (After tests pass)
```
assistant/
├─ brain/
│  ├─ classification.py             (NEW)
│  └─ tool_registry.py              (NEW)
├─ utils/
│  └─ feature_flags.py              (NEW)
├─ models.py                        (UPDATE: add 2 logging models)
└─ migrations/
   └─ 0002_classification_logging.py (NEW)
```

---

## 🚀 Quick Start Commands

### 1. Install Test Dependencies
```bash
cd /Users/apple_trnc/Desktop/work/easy_islanders_project
pip install pytest pytest-django pytest-cov
```

### 2. Create Test Files
```bash
# Create test directory structure
mkdir -p tests
touch tests/__init__.py
touch tests/test_classification_engine.py
touch tests/test_tool_registry.py
touch tests/test_feature_flags.py
touch tests/test_existing_property_search_unchanged.py
touch tests/test_feature_flag_integration.py
```

### 3. Copy Test Code
- Open `AGENT_TDD_IMPLEMENTATION_PLAN.md` (Phase 1 section)
- Copy test code for each file from the plan
- Paste into corresponding `tests/*.py` file

### 4. Run Tests (They Will Fail - That's Expected!)
```bash
# First run: tests fail (no implementation yet)
pytest tests/ -v

# Run only specific test file
pytest tests/test_classification_engine.py -v

# Run RED GATE (existing property search protection)
pytest tests/test_existing_property_search_unchanged.py -v --tb=short
```

### 5. Implement Code (Make Tests Pass)
- Open `AGENT_TDD_IMPLEMENTATION_PLAN.md` (Implementation Tasks section)
- Copy code for each module
- Create files in `assistant/brain/` and `assistant/utils/`

### 6. Run Tests Again (They Pass Now)
```bash
pytest tests/ -v
pytest tests/ --cov=assistant --cov-report=html
```

### 7. Create Migration
```bash
python manage.py makemigrations assistant
python manage.py migrate
```

---

## 🔴 RED GATE: The Critical Safety Net

**File:** `tests/test_existing_property_search_unchanged.py`

These 8 tests MUST ALWAYS PASS:

```python
✅ test_existing_property_search_simple
✅ test_existing_property_search_with_price_filter
✅ test_existing_agent_outreach_still_works
✅ test_existing_multilingual_support
✅ test_existing_status_update
✅ test_regression_property_search_intent_detection
```

**Rule:** If RED GATE fails, the build is BROKEN. Do NOT commit.

---

## 📊 Success Criteria

Phase 1 is complete when:

- [ ] 40+ tests written and all passing
- [ ] 0 breaking changes to existing code
- [ ] RED GATE: 8/8 tests passing
- [ ] Feature flags prevent new features from activating
- [ ] Code coverage ≥ 80%
- [ ] Classification engine detects 5+ categories with >90% confidence
- [ ] Tool registry validates schema correctly

---

## 🔄 Workflow: TDD Cycle

### For Each Feature:

**Step 1: Write Test**
```python
def test_car_keywords_simple():
    category, confidence = classify_query_heuristic("Show me cars")
    assert category == "car_rental"
    assert confidence >= 0.95
```

**Step 2: Run Test (Fails)**
```
FAILED test_car_keywords_simple - ModuleNotFoundError: No module named 'classification'
```

**Step 3: Implement Code**
```python
# assistant/brain/classification.py
def classify_query_heuristic(query: str):
    # Implementation that makes test pass
```

**Step 4: Run Test (Passes)**
```
PASSED test_car_keywords_simple
```

**Repeat for all 40+ tests**

---

## 📈 Feature Flags: Safe Activation

### New Features Disabled By Default
```python
from assistant.utils.feature_flags import get_feature_flag

# Property search: always enabled (existing)
assert get_feature_flag("property_search", default=True) is True

# New features: disabled by default
assert get_feature_flag("multi_category_search", default=False) is False
assert get_feature_flag("vector_search", default=False) is False
```

### Enable for Testing
```python
from assistant.utils.feature_flags import set_feature_flag

# For specific user (testing)
set_feature_flag("multi_category_search", True, user_id=123)

# For canary rollout (5% of users)
enable_canary_rollout("multi_category_search", 5)

# Globally (after validation)
set_feature_flag("multi_category_search", True)
```

---

## 🧪 Running Tests in Different Scenarios

### Before Coding (Expect Failures)
```bash
pytest tests/ -v

# Output:
# FAILED test_classification_engine.py::TestClassificationHeuristics::test_car_keywords_simple
# ModuleNotFoundError: No module named 'classification'
```

### During Development (Some Pass, Some Fail)
```bash
pytest tests/ -v

# Output:
# PASSED test_car_keywords_simple
# FAILED test_car_keywords_complex
# FAILED test_property_keywords_apartment
```

### After Implementation (All Pass + RED GATE)
```bash
pytest tests/test_existing_property_search_unchanged.py -v

# Output:
# PASSED test_existing_property_search_simple
# PASSED test_existing_property_search_with_price_filter
# PASSED test_existing_agent_outreach_still_works
# ... (all 8 RED GATE tests)
```

---

## 🎬 Getting Started (Next 2 Hours)

**Time: 0:00 - 0:30**
- [ ] Install test dependencies: `pip install pytest pytest-django pytest-cov`
- [ ] Create test file structure
- [ ] Copy test code into test files

**Time: 0:30 - 0:45**
- [ ] Run tests (they will all fail): `pytest tests/ -v`
- [ ] Verify failures are expected (ModuleNotFoundError, etc.)

**Time: 0:45 - 1:30**
- [ ] Create `assistant/brain/classification.py`
- [ ] Create `assistant/brain/tool_registry.py`
- [ ] Create `assistant/utils/feature_flags.py`
- [ ] Copy code from AGENT_TDD_IMPLEMENTATION_PLAN.md

**Time: 1:30 - 2:00**
- [ ] Run tests again: `pytest tests/ -v`
- [ ] Fix any remaining failures
- [ ] Verify RED GATE passes: `pytest tests/test_existing_property_search_unchanged.py -v`

**Time: 2:00+**
- [ ] Create models, migrations
- [ ] Run full test suite with coverage
- [ ] Commit to Git

---

## 📚 Full Documentation

For **complete details**, see:
- **AGENT_TDD_IMPLEMENTATION_PLAN.md** (1,147 lines)
  - Phase structure
  - All 40+ test codes
  - All implementation codes
  - Checklists and success criteria

---

## 🔗 Related Documents

- **PRODUCT_ARCHITECTURE.md** – Hybrid marketplace model (6 frontend + 50+ backend categories)
- **AGENT_EXTENSION_QUICK_REFERENCE.md** – High-level extension overview
- **AI_AGENT_ANALYSIS.md** – Current agent architecture and limitations
- **AGENT_TDD_IMPLEMENTATION_PLAN.md** – This detailed TDD plan (1,147 lines)

---

## ❓ FAQ

**Q: Why TDD?**
A: Tests first ensures RED GATE protection, catches bugs early, and documents expected behavior.

**Q: Will my code break?**
A: No. RED GATE tests ensure existing property search never breaks. New features are behind flags.

**Q: How long does Phase 1 take?**
A: 2-3 hours to write tests, 3-4 hours to implement = 6-7 hours total.

**Q: What if a test fails?**
A: That's the point! Red test → write code → green test. Repeat.

**Q: When do I enable new features?**
A: Not until Phase 1 is complete, tests pass, and RED GATE is green. Then feature flags control rollout.

---

## ✅ Phase 1 Checklist

```
TESTS:
- [ ] Write test_classification_engine.py (15 tests)
- [ ] Write test_tool_registry.py (8 tests)
- [ ] Write test_feature_flags.py (6 tests)
- [ ] Write test_existing_property_search_unchanged.py (8 RED GATE tests)
- [ ] Write test_feature_flag_integration.py (3 tests)

IMPLEMENTATION:
- [ ] Create assistant/brain/classification.py
- [ ] Create assistant/brain/tool_registry.py
- [ ] Create assistant/utils/feature_flags.py
- [ ] Update assistant/models.py (add 2 models)
- [ ] Create migration 0002_classification_logging.py

VALIDATION:
- [ ] All 40+ tests passing
- [ ] RED GATE: 8/8 tests passing
- [ ] Code coverage >= 80%
- [ ] No breaking changes to existing code

COMMIT:
- [ ] git add tests/ assistant/
- [ ] git commit -m "Phase 1: TDD foundations for multi-category agent"
- [ ] git push

NEXT:
- [ ] Begin Phase 2 (Learn from Data)
```

---

**Ready to start?** → Open `AGENT_TDD_IMPLEMENTATION_PLAN.md` and begin with tests!
