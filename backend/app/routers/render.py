"""
Render router — Ghost-Merchant Fal.ai Generative VFX Engine.

POST /api/v1/render/start            — Submit a render job (returns job_id immediately)
GET  /api/v1/render/status/{job_id}  — Poll job status / fetch output URL
"""

import logging
import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.services.fal_engine import submit_kling_omni_v2v, get_job_status
from app.services.gemini_engine import analyze_scene_for_replacement
from app.services.brand_profile import get_user_brand_profile

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Request / Response Models ─────────────────────────────────────────────────

class RenderStartRequest(BaseModel):
    """
    Payload for Kling Omni V2V (Video-to-Video).
    """
    video_url: str
    reference_png_url: str
    general_target: str
    user_id: Optional[str] = "auth0|default"


class AgenticPlacementResponse(BaseModel):
    video_url: str
    status: str
    message: str


class AnalysisRequest(BaseModel):
    video_url: str
    product_image_url: Optional[str] = None
    user_id: Optional[str] = "auth0|default"

class RenderStatusResponse(BaseModel):
    job_id: str
    status: str                       # created | processing | completed | failed
    output_video_url: Optional[str] = None
    error: Optional[str] = None
    message: Optional[str] = None

@router.post("/analyze")
async def analyze_video_strategic(payload: AnalysisRequest):
    """
    Diagnostic Endpoint: Triggers a full strategic scan of a video.
    Returns detected slots with coordinates and accuracy ratings.
    """
    try:
        brand_profile = get_user_brand_profile(payload.user_id)
        
        # Use provided product image or fallback to brand profile one
        product_img = payload.product_image_url or brand_profile.get("product_image_url")
        
        video_url = payload.video_url
        
        analysis = await analyze_scene_for_replacement(
            video_url=video_url,
            product_image_path=product_img,
            brand_context=brand_profile
        )
        return analysis
    except Exception as exc:
        logger.exception(f"Strategic analysis failed: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))

@router.post("/agentic-placement", response_model=AgenticPlacementResponse)
async def agentic_placement(payload: RenderStartRequest):
    """
    Agentic Orchestration: Gemini 1.5 Pro (Brain) -> Fal.ai (Kling Omni V2V Engine).
    """
    try:
        # 0. Fetch Brand Context
        brand_profile = get_user_brand_profile(payload.user_id)
        logger.info(f"Using brand profile for placement: {brand_profile['brand_name']}")

        # 1. Gemini Scene Analysis (Identify specific target and optimal timestamps)
        analysis = await analyze_scene_for_replacement(
            payload.video_url, 
            payload.general_target,
            brand_context=brand_profile
        )
        
        specific_target = analysis["specific_description"]
        start_t = analysis["start_time"]
        end_t = analysis["end_time"]
        
        # 2. Local Video Cutting & Upload Preparation
        # Instead of relying on Cloudinary's dynamic transforms (which timeout / 404),
        # we pass the raw video URL and timestamps to our local downloader/trimmer.
        raw_video_url = payload.video_url

        # 3. Kling Omni V2V Execution
        logger.info(f"Triggering Fal engine with raw video and timestamps: {start_t} - {end_t}")
        final_video_url = await submit_kling_omni_v2v(
            video_url=raw_video_url,
            reference_png_url=payload.reference_png_url,
            target_product=specific_target,
            start_time=start_t,
            end_time=end_t
        )
        
        return AgenticPlacementResponse(
            video_url=final_video_url,
            status="completed",
            message=f"Successfully replaced product in segment {start_t}s - {end_t}s using Kling Omni V2V.",
        )

    except Exception as exc:
        logger.exception(f"Agentic placement failed: {exc}")
        raise HTTPException(status_code=500, detail=f"Agentic placement failed: {str(exc)}")


@router.get("/status/{job_id}", response_model=RenderStatusResponse)
async def poll_render_status(job_id: str):
    """
    Poll the status of a Fal.ai inpainting job.

    Returns ``status`` and, once completed, an ``output_video_url`` pointing to
    the generated video. 

    Status values: processing | completed | failed
    """
    try:
        result = await get_job_status(job_id)
        status = result["status"]

        if status == "failed":
            raise HTTPException(
                status_code=500,
                detail={
                    "job_id": job_id,
                    "status": "failed",
                    "error": result.get("error", "Fal.ai render failed."),
                },
            )

        # Map Fal.ai's status if necessary,
        # but let's just pass it straight through for transparency.
        display_status = status
        
        return RenderStatusResponse(
            job_id=job_id,
            status=display_status,
            output_video_url=result.get("output_video_url"),
            message=(
                "Generation complete. Send output_video_url to player."
                if status == "succeeded"
                else f"Job is {status}."
            ),
        )

    except HTTPException:
        raise  # re-raise our own 500

    except RuntimeError as exc:
        logger.error(f"Status poll error for job {job_id}: {exc}")
        raise HTTPException(status_code=503, detail=str(exc))

    except Exception as exc:
        logger.exception(f"Unexpected error polling job {job_id}: {exc}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error while polling render status.",
        )
