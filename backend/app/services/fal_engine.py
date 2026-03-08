"""
Fal Engine — Ghost-Merchant Generative VFX Engine.

Handles asynchronous video-to-video inpainting via the official fal-client SDK.
"""

import logging
import os
import requests
import tempfile
from typing import Optional
from dotenv import load_dotenv
import fal_client

from app.config import settings

logger = logging.getLogger(__name__)

FAL_MODEL_V2V = "fal-ai/kling-video/o1/video-to-video/reference"

def _ensure_fal_key():
    """Ensure the Fal API key is configured."""
    # Defeat Uvicorn environment caching by reading the .env right now:
    load_dotenv(override=True)
    key = os.environ.get("FAL_KEY")
    if not key:
        raise RuntimeError("FAL_KEY is not set. Add it to your .env file.")
    os.environ["FAL_KEY"] = key

def upload_url_to_fal(source_url: str, is_video: bool = True, start_time: Optional[float] = None, end_time: Optional[float] = None) -> str:
    """Downloads a file from a URL, optionally trims it if a video, and uploads it to Fal's native storage."""
    suffix = ".mp4" if is_video else ".png"
    
    is_temp_raw = False
    
    if source_url.startswith("http://") or source_url.startswith("https://"):
        # Sanitize Cloudinary URLs: Remove dynamic transformations if present
        import re
        clean_url = re.sub(r'/upload(?:/so_[^/]+)?/', '/upload/', source_url)
        
        logger.info(f"Downloading from '{clean_url}' for Fal native upload...")
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
        response = requests.get(clean_url, stream=True, headers=headers)
        response.raise_for_status()
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            for chunk in response.iter_content(chunk_size=8192):
                temp_file.write(chunk)
            raw_file_path = temp_file.name
        is_temp_raw = True
    else:
        logger.info(f"Using local file '{source_url}' for Fal native upload...")
        raw_file_path = source_url

    final_upload_path = raw_file_path
    trimmed_file_path = None

    try:
        if is_video:
            import subprocess
            logger.info(f"Processing local video with FFmpeg to enforce 24fps (and optionally trimming from {start_time}s to {end_time}s)...")
            
            with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as trim_file:
                trimmed_file_path = trim_file.name
                
            import imageio_ffmpeg
            ffmpeg_path = imageio_ffmpeg.get_ffmpeg_exe()
            command = [
                ffmpeg_path,
                "-hide_banner",
                "-loglevel", "error",
                "-y",                   # Overwrite output
            ]
            
            if start_time is not None and end_time is not None:
                duration = end_time - start_time
                command.extend([
                    "-ss", str(start_time), # Fast seek to start time
                ])
                command.extend([
                    "-i", raw_file_path,    # Input file
                    "-t", str(duration),    # Duration of cut
                ])
            else:
                command.extend([
                    "-i", raw_file_path,
                ])
                
            command.extend([
                "-c:v", "libx264",      # Standard video codec
                "-c:a", "aac",          # Standard audio codec
                "-r", "24",             # Force 24fps for Kling Omni requirement
                trimmed_file_path       # Output file path
            ])
            
            try:
                logger.info(f"Running FFmpeg: {' '.join(command)}")
                subprocess.run(command, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                logger.info("FFmpeg processing complete.")
            except subprocess.CalledProcessError as e:
                logger.error(f"FFmpeg failed: {e.stderr.decode('utf-8', errors='ignore')}")
                raise Exception("Video trimming failed during FFmpeg processing.")
            
            final_upload_path = trimmed_file_path

        logger.info(f"Uploading local file {final_upload_path} to Fal...")
        
        # Convert to relative path to prevent fal_client SDK from treating 'c:\' as a URL scheme
        rel_upload_path = os.path.relpath(final_upload_path, start=os.getcwd())
        fal_url = fal_client.upload_file(rel_upload_path)
            
        logger.info(f"Successfully uploaded to Fal: {fal_url}")
        return fal_url
    finally:
        if is_temp_raw and os.path.exists(raw_file_path):
            os.remove(raw_file_path)
        if trimmed_file_path and os.path.exists(trimmed_file_path):
            os.remove(trimmed_file_path)

async def submit_kling_omni_v2v(
    video_url: str,
    reference_png_url: str,
    target_product: str,
    start_time: Optional[float] = None,
    end_time: Optional[float] = None
) -> str:
    """
    Submits a Video-to-Video task to Kling Omni O1.
    Uses the @image / @video prompt syntax for precise replacement.
    
    Returns:
        str: The generated video URL.
    """
    _ensure_fal_key()
    
    # Precise prompt structure as requested:
    # Combining the requested prompt with the mapping required by Kling.
    prompt = f"Replace the {target_product} in @Video1 with the exact design from @Image1 for the entire clip."
    
    logger.info(f"Submitting Kling Omni V2V: {prompt}")

    try:
        # Proxy upload: Download from source, optionally trim, and upload to Fal
        import asyncio
        loop = asyncio.get_event_loop()
        
        safe_video_url = await loop.run_in_executor(
            None,
            lambda: upload_url_to_fal(video_url, is_video=True, start_time=start_time, end_time=end_time)
        )
        safe_image_url = await loop.run_in_executor(
            None,
            lambda: upload_url_to_fal(reference_png_url, is_video=False)
        )

        # fal_client.subscribe is often synchronous in this SDK version
        result = await loop.run_in_executor(
            None,
            lambda: fal_client.subscribe(
                FAL_MODEL_V2V,
                arguments={
                    "prompt": prompt,
                    "video_url": safe_video_url,
                    "image_urls": [safe_image_url]
                }
            )
        )
        
        video_url_result = None
        if isinstance(result, dict) and "video" in result:
            video_url_result = result["video"].get("url")
        elif hasattr(result, "video"):
            video_url_result = getattr(result.video, "url", None)

        if not video_url_result:
            raise RuntimeError("Fal.ai finished but no video URL was found in the response.")

        logger.info(f"Kling Omni V2V Success | output_url={video_url_result}")
        return video_url_result

    except Exception as e:
        logger.error(f"Kling V2V failed: {str(e)}")
        raise RuntimeError(f"Kling V2V generation failed: {str(e)}")


async def get_job_status(job_id: str) -> dict:
    """
    Poll the current status of a Fal request.
    (Kept for backward compatibility if needed by the router's status endpoint)
    """
    _ensure_fal_key()
    # Note: This is still using the old model for now, but we can update to FAL_MODEL_V2V 
    # if we want to poll jobs submitted via submit_async (which we aren't using for V2V right now).
    try:
        status = await fal_client.status_async(FAL_MODEL_V2V, job_id, with_logs=False)
        status_str = str(getattr(status, "status", status))
        
        response = {"job_id": job_id, "status": "processing"}

        if "COMPLETED" in status_str.upper():
            result = await fal_client.result_async(FAL_MODEL_V2V, job_id)
            
            output_url = None
            if isinstance(result, dict) and "video" in result:
                output_url = result["video"].get("url")
            elif hasattr(result, "video"):
                output_url = getattr(result.video, "url", None)
                
            response["status"] = "completed"
            response["output_video_url"] = output_url
            logger.info(f"Kling job completed | job_id={job_id} | url={output_url}")

        elif any(x in status_str.upper() for x in ["FAILED", "ERROR"]):
            response["status"] = "failed"
            response["error"] = f"Job failed: {status_str}"
            logger.error(f"Kling job failed | job_id={job_id} | status={status_str}")

        return response

    except Exception as e:
        logger.error(f"Fal.ai status poll failed ({job_id}): {str(e)}")
        raise RuntimeError(f"Fal.ai status poll failed: {str(e)}")

