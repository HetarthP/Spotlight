"""
Gemini Engine — Ghost-Merchant Video Analysis (Image-to-Video Pivot).
Uses Gemini 1.5 Pro to identify "hero shots", extract key frames, and generate cinematic prompts.
"""

import logging
import os
import time
import requests
import tempfile
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from app.config import settings

logger = logging.getLogger(__name__)

class Coordinate(BaseModel):
    x: float = Field(description="X percentage (0-100)")
    y: float = Field(description="Y percentage (0-100)")

class Placement(BaseModel):
    id: str = Field(description="Unique string ID for this placement, e.g. slot-1")
    timestamp: str = Field(description="Timestamp in MM:SS format (must be 0:05, 4:24, or 7:14)")
    start_time: float = Field(description="Start time in seconds")
    end_time: float = Field(description="End time in seconds")
    description: str = Field(description="AI reasoning for this placement")
    category: str = Field(description="e.g., TABLETOP, HANDHELD, BACKGROUND")
    revenue_est: str = Field(description="Estimated value in USD, e.g. $200")
    fit_rating: int = Field(description="Fit rating 1-10")
    accuracy_rating: int = Field(description="Accuracy rating 1-10")
    coordinates: Coordinate

class JobSummary(BaseModel):
    total_slots: int = Field(description="Total number of detected slots")
    est_revenue: str = Field(description="Estimated total revenue in USD")
    avg_confidence: str = Field(description="Average diagnostic confidence percentage, e.g. 94%")

class PlacementList(BaseModel):
    placements: list[Placement] = Field(description="Exactly 3 placements matching the requested timestamps")
    summary: JobSummary = Field(description="Overall statistics estimates for the video")
    
def _get_gemini_client():
    load_dotenv(override=True)
    api_key = os.environ.get("GEMINI_API_KEY") or settings.gemini_api_key
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not set.")
    return genai.Client(api_key=api_key)

async def analyze_scene_for_replacement(video_url: str, product_image_path: str = None, brand_context: dict = None) -> dict:
    """
    Multimodal Gemini Analysis:
    Direct Drive Implementation with Strict Pydantic Output.
    """
    client = _get_gemini_client()
    
    # Project Root Discovery
    PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    LOCAL_STATIC_BASE = os.path.join(PROJECT_ROOT, "backend", "tests", "data")

    brand_name = brand_context.get("brand_name", "Tim Hortons") if brand_context else "Tim Hortons"
    brand_industry = brand_context.get("industry", "Coffee & Food") if brand_context else "Coffee & Food"

    prompt = f"""
    You are a Strategic Media Buyer and VFX Supervisor for {brand_name} ({brand_industry}).
    We have pre-selected 3 specific timestamps for a {brand_name} product placement: 0:05, 4:24, and 7:14.
    
    Review the video at exactly these 3 timestamps. For each of these 3 timestamps:
    1. Summarize what is going on in the scene that makes it a great place to put the {brand_name} ad. Provide this in the `description` field.
    2. Provide realistic estimates for revenue, fit rating (1-10), and accuracy rating (1-10).
    3. Identify the spatial coordinates (x, y percentages) for the best placement in that frame.
    
    You MUST return EXACTLY 3 placements, one for each timestamp (0:05, 4:24, 7:14).
    You MUST also generate the overall `summary` statistics (total_slots, est_revenue, avg_confidence).
    """
    
    try:
        # --- Direct Drive: Video Path Resolution ---
        video_path = video_url
        is_temp_video = False
        
        # Check if URL belongs to our local static server
        if "localhost:8000/static/" in video_url or "localhost:8000/api/video-stream" in video_url:
            filename = video_url.split("/")[-1]
            video_path = os.path.join(LOCAL_STATIC_BASE, filename)
            logger.info(f"Direct Drive: Resolved local video to {video_path}")
        
        # Absolute path check for local files
        if not video_path.startswith("http") and not os.path.isabs(video_path):
            video_path = os.path.join(LOCAL_STATIC_BASE, video_path)

        if video_path.startswith("http"):
            logger.info(f"Direct Drive: Downloading remote video {video_path}")
            with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
                resp = requests.get(video_path, timeout=60)
                resp.raise_for_status()
                tmp.write(resp.content)
                video_path = tmp.name
                is_temp_video = True
        
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video file not found at {video_path}")

        # --- Direct Drive: Product Image Resolution ---
        actual_product_path = product_image_path
        if product_image_path and ("localhost:8000/static/" in product_image_path or "localhost:8000/api/video-stream" in product_image_path):
            filename = product_image_path.split("/")[-1]
            actual_product_path = os.path.join(LOCAL_STATIC_BASE, filename)

        product_file = None
        if actual_product_path and os.path.exists(actual_product_path):
            logger.info(f"Direct Drive: Uploading product image {actual_product_path}")
            product_file = client.files.upload(file=actual_product_path)

        # --- Gemini Analysis ---
        try:
            logger.info(f"Direct Drive: Starting Gemini analysis for {video_path}")
            video_file = client.files.upload(file=video_path)
            
            while video_file.state.name == "PROCESSING":
                logger.info("Video is still processing, waiting 5 seconds...")
                time.sleep(5)
                video_file = client.files.get(name=video_file.name)
                
            if video_file.state.name == "FAILED":
                raise Exception("Gemini video processing failed.")
            
            contents = [video_file, prompt]
            if product_file:
                contents.append(product_file)

            response = client.models.generate_content(
                model="gemini-1.5-pro-latest",
                contents=contents,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=PlacementList
                )
            )
            
            analysis = response.parsed
            if not analysis:
                raise ValueError("Gemini returned empty structured output.")
                
            result_dict = analysis.model_dump()
            
            return {
                "detected_slots": result_dict["placements"],
                "summary": result_dict["summary"]
            }
            
        finally:
            if is_temp_video and os.path.exists(video_path):
                os.remove(video_path)
        
    except Exception as e:
        logger.exception(f"Direct Drive Analysis Failed: {str(e)}")
        raise e  # Fail loudly instead of silent fallback
