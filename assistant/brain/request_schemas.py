from typing import Optional, Dict, Any, Literal
from pydantic import BaseModel, Field, root_validator


class Budget(BaseModel):
    amount: Optional[float] = Field(default=None, ge=0)
    currency: Optional[str] = Field(default=None, description="ISO currency code")


class ProductAttributes(BaseModel):
    model: Optional[str]
    brand: Optional[str]
    condition: Optional[Literal['new', 'used', 'refurbished']]
    color: Optional[str]


class VehicleAttributes(BaseModel):
    make: Optional[str]
    model: Optional[str]
    year: Optional[int]
    color: Optional[str]
    fuel: Optional[Literal['petrol', 'diesel', 'electric', 'hybrid']]


class ServiceAttributes(BaseModel):
    service_type: Optional[str]
    urgency: Optional[Literal['low', 'normal', 'high']]
    hours: Optional[str]


class GenericAttributes(BaseModel):
    # Allow a conservative set of generic fields
    details: Optional[str]
    notes: Optional[str]


class RequestPayload(BaseModel):
    category: Literal['PROPERTY', 'VEHICLE', 'GENERAL_PRODUCT', 'SERVICE', 'KNOWLEDGE_QUERY', 'OUT_OF_SCOPE']
    subcategory: Optional[str] = None
    location: Optional[str] = None
    budget_amount: Optional[float] = Field(default=None, ge=0)
    budget_currency: Optional[str] = None
    attributes: Dict[str, Any] = Field(default_factory=dict)
    contact: str

    @root_validator(pre=True)
    def validate_attributes_by_category(cls, values):
        category = values.get('category')
        attrs = values.get('attributes') or {}
        try:
            if category == 'GENERAL_PRODUCT':
                ProductAttributes(**attrs)
            elif category == 'VEHICLE':
                VehicleAttributes(**attrs)
            elif category == 'SERVICE':
                ServiceAttributes(**attrs)
            elif category in ('KNOWLEDGE_QUERY', 'OUT_OF_SCOPE'):
                # No attributes needed; allow only generic
                GenericAttributes(**attrs)
            else:
                # PROPERTY or others: keep generic minimal to avoid leakage
                GenericAttributes(**attrs)
        except Exception as e:
            raise ValueError(f"invalid_attributes_for_category: {str(e)}")
        return values
