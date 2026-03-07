"""
Pydantic schemas for API request/response models.
"""

from pydantic import BaseModel
from typing import Optional


# ── Movie ─────────────────────────────────────

class MovieBase(BaseModel):
    imdb_id: str
    title: str
    year: str
    poster_url: Optional[str] = None
    genre: Optional[str] = None


class MovieCreate(MovieBase):
    pass


class MovieResponse(MovieBase):
    id: int
    cloudinary_public_id: Optional[str] = None

    class Config:
        from_attributes = True


# ── Video ─────────────────────────────────────

class VideoBase(BaseModel):
    cloudinary_public_id: str
    imdb_id: str


class VideoCreate(VideoBase):
    pass


class VideoResponse(VideoBase):
    id: int
    status: str  # "uploaded" | "processing" | "ready"

    class Config:
        from_attributes = True


# ── Ad Slot (3D Bounding Box) ─────────────────

class AdSlotBase(BaseModel):
    """9-point 3D bounding box + metadata."""
    video_id: int
    frame_number: int
    x: float
    y: float
    z: float
    w: float
    h: float
    d: float
    roll: float
    pitch: float
    yaw: float
    kelvin: Optional[int] = None
    scene_intent: Optional[str] = None


class AdSlotCreate(AdSlotBase):
    pass


class AdSlotResponse(AdSlotBase):
    id: int

    class Config:
        from_attributes = True


# ── Brand ─────────────────────────────────────

class BrandBase(BaseModel):
    name: str
    logo_public_id: Optional[str] = None


class BrandResponse(BrandBase):
    id: int

    class Config:
        from_attributes = True


# ── Placement Event ───────────────────────────

class PlacementEventBase(BaseModel):
    video_id: str
    brand_asset_id: str
    event_type: str  # "impression" | "hover" | "click"
    timestamp_ms: int
    viewer_id: Optional[str] = None


class PlacementEventCreate(PlacementEventBase):
    pass
