"""
Celery tasks — GPU worker pipeline.
Stages 2-4: Frame extraction → 3D intelligence → Temporal smoothing → VFX.
"""

import logging

from app.workers.celery_app import celery_app
from app.services.cloudinary import extract_frame_url
from app.services.gemini import detect_ad_slots

logger = logging.getLogger(__name__)

# Frame extraction interval in seconds
FRAME_INTERVAL = 2.0


@celery_app.task(bind=True, name="vpp.process_video")
def process_video_task(self, video_id: str):
    """
    Full pipeline for a single video:
    1. If video > 45 mins, chunk into 30-minute segments via FFmpeg.
    2. Extract keyframes from Cloudinary (Stage 2)
    3. Run Gemini 3D grounding on each chunk in parallel (Stage 2)
    4. Stream coordinates to Backboard.io for smoothing (Stage 3)
    5. Build VFX composition URLs (Stage 4)
    """
    logger.info(f"[Task {self.request.id}] Starting pipeline for video: {video_id}")

    self.update_state(state="EXTRACTING_FRAMES", meta={"video_id": video_id})

    # ── Stage 2a: Segmenting & Frame Extraction ─
    # TODO: Query video duration. If > 45 mins, use FFmpeg (Heavy Compute Node)
    # to slice into 30-minute chunks for parallel Gemini processing.
    
    # Placeholder: Assuming single chunk for now, extract first 10s of frames
    frame_times = [i * FRAME_INTERVAL for i in range(5)]
    frame_urls = [extract_frame_url(video_id, t) for t in frame_times]

    logger.info(f"  Extracted {len(frame_urls)} frame URLs")

    # ── Stage 2b: 3D Grounding (Gemini) ────────
    self.update_state(state="DETECTING_SLOTS", meta={"video_id": video_id})

    detections = []
    for i, url in enumerate(frame_urls):
        try:
            # Note: detect_ad_slots is async — run in sync context for Celery
            import asyncio
            detection = asyncio.run(detect_ad_slots(url))
            detections.append({
                "frame": i,
                "time": frame_times[i],
                "slots": [s.model_dump() for s in detection.slots],
                "kelvin": detection.kelvin,
                "scene_intent": detection.scene_intent,
            })
        except Exception as e:
            logger.warning(f"  Frame {i} detection failed: {e}")

    logger.info(f"  Detected slots in {len(detections)} frames")

    # ── Stage 3: Temporal Smoothing ────────────
    self.update_state(state="SMOOTHING", meta={"video_id": video_id})

    # TODO: Stream raw coordinates to Backboard.io
    # Anti-jitter: if coordinate shift < 2%, pin to previous position
    smoothed = detections  # placeholder

    # ── Stage 4: VFX Composition URLs ──────────
    self.update_state(state="COMPOSITING", meta={"video_id": video_id})

    # TODO: For each smoothed slot, build Cloudinary VFX URL
    # using build_vfx_url() with the matched brand asset

    logger.info(f"[Task {self.request.id}] Pipeline complete for video: {video_id}")

    return {
        "video_id": video_id,
        "frames_processed": len(frame_urls),
        "slots_detected": sum(len(d["slots"]) for d in detections),
        "detections": detections,
    }
