"""
Videos router — upload handling & processing triggers.
Stages 1-2: Ingestion → 3D Intelligence.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.workers.tasks import process_video_task
from app.auth import get_current_user, require_role

router = APIRouter()


class VideoIngestRequest(BaseModel):
    """Sent after Cloudinary UploadWidget returns."""
    imdb_id: str
    cloudinary_public_id: str


class ProcessRequest(BaseModel):
    """Trigger the full pipeline for a video."""
    video_id: str  # DB id or cloudinary public_id


@router.post("/ingest")
async def ingest_video(
    payload: VideoIngestRequest,
    user: dict = Depends(require_role("creator")),
):
    """
    Record a new video upload.
    Links imdbID → cloudinary_public_id in the database.
    """
    # TODO: Insert into Postgres via Prisma / SQLAlchemy
    return {
        "status": "ingested",
        "imdb_id": payload.imdb_id,
        "cloudinary_public_id": payload.cloudinary_public_id,
    }


@router.post("/process")
async def process_video(
    payload: ProcessRequest,
    user: dict = Depends(require_role("creator")),
):
    """
    Kick off the async processing pipeline:
    1. Frame extraction via Cloudinary
    2. 3D grounding via Gemini 2.0 Flash
    3. Temporal smoothing via Backboard.io
    """
    task = process_video_task.delay(payload.video_id)
    return {
        "status": "processing",
        "task_id": task.id,
        "video_id": payload.video_id,
    }


@router.get("/status/{task_id}")
async def get_task_status(task_id: str):
    """Check Celery task status."""
    from app.workers.celery_app import celery_app

    result = celery_app.AsyncResult(task_id)
    return {
        "task_id": task_id,
        "status": result.status,
        "result": result.result if result.ready() else None,
    }
