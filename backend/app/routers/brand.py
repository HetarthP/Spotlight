from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services.brand_profile import get_user_brand_profile, update_user_brand_profile

router = APIRouter()

class BrandProfileUpdate(BaseModel):
    brand_name: Optional[str] = None
    industry: Optional[str] = None
    budget: Optional[str] = None
    target_demo: Optional[str] = None
    tone: Optional[str] = None
    goals: Optional[str] = None
    product_image_url: Optional[str] = None

@router.get("/{user_id}")
async def get_profile(user_id: str):
    return get_user_brand_profile(user_id)

@router.put("/{user_id}")
async def update_profile(user_id: str, payload: BrandProfileUpdate):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    return update_user_brand_profile(user_id, updates)
