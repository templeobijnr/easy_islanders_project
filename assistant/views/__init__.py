# assistant/views/__init__.py
# Intentionally empty: no re-exports to avoid circular imports.
# If you need type-only imports later, gate them under TYPE_CHECKING.
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    # from .whatever import TypesOnly
    pass