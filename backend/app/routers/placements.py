"""
Placements router — ad placement CRUD & conversion analytics.
Stage 5: Interactive Display & Analytics.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class PlacementEvent(BaseModel):
    """Logged when a viewer interacts with a placed ad."""
    video_id: str
    brand_asset_id: str
    event_type: str  # "hover" | "click" | "impression"
    timestamp_ms: int
    viewer_id: Optional[str] = None


@router.post("/events")
async def log_event(event: PlacementEvent):
    """
    Record a viewer interaction event.
    These feed the Brand Dashboard analytics.
    """
    # TODO: Insert into Postgres analytics table
    return {"status": "logged", "event_type": event.event_type}


@router.get("/analytics/{video_id}")
async def get_analytics(video_id: str):
    """
    Return aggregated placement metrics for a video.
    Auth0 RBAC: brand role required.
    """
    # TODO: Query Postgres for real metrics
    return {
        "video_id": video_id,
        "impressions": 0,
        "hovers": 0,
        "clicks": 0,
        "ctr": 0.0,
    }


@router.get("/slots/{video_id}")
async def get_ad_slots(video_id: str):
    """
    Return detected 3D ad slots for a video.
    Each slot contains 9-point bounding box coordinates.
    """
    # TODO: Query Postgres for stored 3D bboxes
    return {
        "video_id": video_id,
        "slots": [],
    }
