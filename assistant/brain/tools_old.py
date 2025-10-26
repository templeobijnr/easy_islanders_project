from typing import Any, Dict

from langchain_core.tools import Tool, StructuredTool
from pydantic import BaseModel, Field

from ..tools import search_internal_listings, initiate_contact_with_seller


def make_search_tool() -> Tool:
    def _fn(**kwargs: Dict[str, Any]) -> Dict[str, Any]:
        return search_internal_listings(**kwargs)

    return Tool(
        name="search_internal_listings",
        description="Search internal property listings with filters and regional fallback.",
        func=_fn,
    )


class OutreachInput(BaseModel):
    listing_id: int = Field(description="The listing ID to contact the agent for")
    channel: str = Field(default="whatsapp", description="Communication channel (whatsapp, telegram, etc.)")
    language: str = Field(default="en", description="Language for the outreach message")

def make_outreach_tool() -> StructuredTool:
    def _fn(listing_id: int, channel: str = "whatsapp", language: str = "en") -> Dict[str, Any]:
        return initiate_contact_with_seller(listing_id=listing_id, channel=channel, language=language)

    return StructuredTool.from_function(
        func=_fn,
        name="initiate_contact_with_seller",
        description="Contact agent via WhatsApp to request photos and availability.",
        args_schema=OutreachInput,
    )


