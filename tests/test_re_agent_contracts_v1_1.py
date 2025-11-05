"""
Test RE Agent contracts v1.1 (tenure support).

Validates:
- Request/response schemas are frozen
- Golden frames match schemas
- Real agent responses match expected structure
"""
import json
import pytest
from pathlib import Path
from jsonschema import validate, ValidationError


# Paths
SCHEMA_DIR = Path(__file__).parent.parent / "schema" / "agent" / "real_estate" / "1.1"
GOLDEN_DIR = Path(__file__).parent / "golden" / "agent" / "v1.1"


def load_json(path: Path) -> dict:
    """Load JSON file."""
    with open(path, 'r') as f:
        return json.load(f)


@pytest.fixture
def request_schema():
    """Load request schema v1.1."""
    return load_json(SCHEMA_DIR / "request.schema.json")


@pytest.fixture
def response_schema():
    """Load response schema v1.1."""
    return load_json(SCHEMA_DIR / "response.schema.json")


class TestContractsV11:
    """Test contract immutability and golden frames."""

    def test_request_schema_immutable(self, request_schema):
        """Request schema v1.1 must not change."""
        assert "/1.1/" in request_schema["$id"], "Schema version changed!"
        required = set(request_schema["required"])
        assert required == {"thread_id", "client_msg_id", "intent", "input", "ctx"}

        # Tenure must be in search_params
        tenure_enum = request_schema["properties"]["search_params"]["properties"]["tenure"]["enum"]
        assert set(tenure_enum) == {"short_term", "long_term", "auto"}

    def test_response_schema_immutable(self, response_schema):
        """Response schema v1.1 must not change."""
        assert "/1.1/" in response_schema["$id"], "Schema version changed!"
        required = set(response_schema["required"])
        assert required == {"reply", "actions", "traces"}

        # Check show_listings action has tenure field
        actions_schema = response_schema["properties"]["actions"]
        show_listings = None
        for action_type in actions_schema["items"]["oneOf"]:
            if action_type["properties"]["type"]["const"] == "show_listings":
                show_listings = action_type
                break

        assert show_listings is not None
        assert "tenure" in show_listings["properties"]["params"]["required"]

    def test_golden_short_term_valid(self, request_schema, response_schema):
        """Golden frame 003 (short-term) must validate."""
        golden = load_json(GOLDEN_DIR / "003-show_listings-short_term.json")

        # Validate request
        validate(instance=golden["request"], schema=request_schema)

        # Validate response
        validate(instance=golden["response"], schema=response_schema)

        # Check tenure
        assert golden["response"]["traces"]["tenure"] == "short_term"
        assert golden["response"]["actions"][0]["params"]["tenure"] == "short_term"

    def test_golden_long_term_valid(self, request_schema, response_schema):
        """Golden frame 004 (long-term) must validate."""
        golden = load_json(GOLDEN_DIR / "004-show_listings-long_term.json")

        # Validate request
        validate(instance=golden["request"], schema=request_schema)

        # Validate response
        validate(instance=golden["response"], schema=response_schema)

        # Check tenure
        assert golden["response"]["traces"]["tenure"] == "long_term"
        assert golden["response"]["actions"][0]["params"]["tenure"] == "long_term"

    def test_price_display_format(self, response_schema):
        """Price display must include tenure unit."""
        golden_st = load_json(GOLDEN_DIR / "003-show_listings-short_term.json")
        golden_lt = load_json(GOLDEN_DIR / "004-show_listings-long_term.json")

        # Short-term should have /night
        st_price = golden_st["response"]["actions"][0]["params"]["listings"][0]["price_per_night"]
        assert "/night" in st_price

        # Long-term should have /month
        lt_price = golden_lt["response"]["actions"][0]["params"]["listings"][0]["price_per_night"]
        assert "/month" in lt_price
