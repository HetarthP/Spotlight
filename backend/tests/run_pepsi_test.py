"""
Integration Test: WaveSpeed AI Pepsi -> Coke Replacement (Full Video Output)

Pipeline:
  1. Upload pepsi.mp4 to Cloudinary -> get public URL
  2. Gemini 2.5 Flash: Full-video analysis -> best timestamp + edit prompt
  3. Cloudinary: Extract a clip URL for the target window
  4. WaveSpeed AI (wan-2.2/video-edit): Send clip for Pepsi -> Coke editing
  5. Poll until COMPLETED, download the edited clip
  6. Merge: before + edited + after -> full seamless output video

Goal: Replace the Pepsi can with Coke at ~23s, output the ENTIRE video.
"""
import sys
import os
import json
import time
import subprocess
import tempfile
import shutil

from dotenv import load_dotenv

# ── Setup paths & environment ────────────────────────────────────────────────
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
load_dotenv(dotenv_path=env_path)

import httpx
import cloudinary
import cloudinary.uploader
import cloudinary.utils

from google import genai
from google.genai import types

from app.workers.tasks import convert_3d_to_2d_bbox

# ── Configuration ────────────────────────────────────────────────────────────
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True,
)

gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
WAVESPEED_API_KEY = os.getenv("WAVESPEED_API_KEY", "")

# ── Constants ────────────────────────────────────────────────────────────────
VIDEO_PATH   = os.path.join(os.path.dirname(__file__), "data", "pepsi.mp4")
VIDEO_PUB_ID = "vpp_test/pepsi_test"
OUTPUT_DIR   = os.path.join(os.path.dirname(__file__), "output")

# WaveSpeed API
WAVESPEED_BASE      = "https://api.wavespeed.ai/api/v3"
WAVESPEED_MODEL     = "wavespeed-ai/wan-2.2/video-edit"
WAVESPEED_SUBMIT    = f"{WAVESPEED_BASE}/{WAVESPEED_MODEL}"
WAVESPEED_RESULT    = f"{WAVESPEED_BASE}/predictions"

# Clip window (seconds before/after best timestamp)
CLIP_HALF_WINDOW = 2.5

# Polling config
POLL_INTERVAL_S  = 5
POLL_MAX_RETRIES = 72  # 72 * 5s = 6 minutes

def get_ffmpeg_path():
    """Attempt to find ffmpeg on PATH, or fallback to imageio_ffmpeg."""
    if shutil.which("ffmpeg"):
        return "ffmpeg"
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        print("  ❌ ERROR: ffmpeg not found. Please install ffmpeg or run: pip install imageio-ffmpeg")
        sys.exit(1)


def wavespeed_headers():
    return {
        "Authorization": f"Bearer {WAVESPEED_API_KEY}",
        "Content-Type": "application/json",
    }


def main():
    print("\n" + "=" * 60)
    print("GHOST-MERCHANT: WaveSpeed AI — Pepsi -> Coke (Full Video)")
    print("=" * 60)

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    if not os.path.exists(VIDEO_PATH):
        print(f"  ERROR: Video not found at {VIDEO_PATH}")
        return

    if not WAVESPEED_API_KEY:
        print("  ERROR: WAVESPEED_API_KEY not set in .env")
        return

    # ── Stage 1: Upload video to Cloudinary ──────────────────────────────────
    print("\n[1] Uploading pepsi.mp4 to Cloudinary...")
    upload_res = cloudinary.uploader.upload(
        VIDEO_PATH,
        resource_type="video",
        public_id=VIDEO_PUB_ID,
        overwrite=True,
    )
    duration = upload_res.get("duration", 30.0)
    vw = upload_res.get("width", 1280)
    vh = upload_res.get("height", 720)
    print(f"  ✅ Uploaded: {VIDEO_PUB_ID} ({vw}x{vh}, {duration:.1f}s)")

    # Full video URL (no transformations)
    full_video_url, _ = cloudinary.utils.cloudinary_url(
        VIDEO_PUB_ID, resource_type="video", format="mp4", secure=True
    )
    print(f"  📎 Full URL: {full_video_url}")

    # ── Stage 2: Gemini full-video analysis ──────────────────────────────────
    print("\n[2] Analyzing video with Gemini 2.5 Flash...")
    print("  📤 Uploading to Gemini File API...")
    with open(VIDEO_PATH, "rb") as f:
        gfile = gemini_client.files.upload(
            file=f,
            config=types.UploadFileConfig(
                mime_type="video/mp4", display_name="pepsi_test"
            ),
        )

    for _ in range(20):
        s = gemini_client.files.get(name=gfile.name)
        if s.state.name == "ACTIVE":
            break
        print("    ⏳ Processing...")
        time.sleep(3)

    print("  🔍 Analyzing for best Pepsi drinking moment...")
    analysis_prompt = f"""
Watch this video carefully ({duration:.1f}s, {vw}x{vh}).

Find the BEST single moment where someone is clearly drinking from a Pepsi can.
Focus on the 21-26 second window where the woman is drinking.

Return ONLY this JSON (no markdown):
{{
  "best_timestamp": <float seconds, the single best frame>,
  "clip_start": <float, best_timestamp - 2.5, minimum 0>,
  "clip_end": <float, best_timestamp + 2.5, maximum {duration}>,
  "edit_prompt": "<A highly specific, concise prompt describing ONLY the target product to be inserted. Do NOT describe the actor, the action, the background, or the lighting. Wait exactly what the object should look like. e.g., 'A classic glass Coca-Cola bottle with condensation'.>",
  "bounding_box": {{"x": <float 0-1>, "y": <float 0-1>, "w": <float 0-1>, "h": <float 0-1>}},
  "score": <int 0-100>
}}
"""
    resp = gemini_client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[gfile, analysis_prompt],
        config=types.GenerateContentConfig(
            response_mime_type="application/json", temperature=0.1
        ),
    )
    try:
        gemini_client.files.delete(name=gfile.name)
    except Exception:
        pass

    analysis = json.loads(resp.text)
    best_ts    = float(analysis["best_timestamp"])
    clip_start = float(analysis.get("clip_start", max(0, best_ts - CLIP_HALF_WINDOW)))
    clip_end   = float(analysis.get("clip_end", min(duration, best_ts + CLIP_HALF_WINDOW)))
    edit_prompt = analysis.get("edit_prompt", "A glass Coca-Cola bottle")
    score = analysis.get("score", 0)
    
    # Extract the bounding box and convert to WaveSpeed format
    raw_box = analysis.get("bounding_box", {"x": 0.5, "y": 0.5, "w": 0.2, "h": 0.2})
    wavespeed_bbox = convert_3d_to_2d_bbox(raw_box)

    print(f"  ✅ Best timestamp: {best_ts:.2f}s (score: {score}/100)")
    print(f"  📐 Clip window: {clip_start:.2f}s → {clip_end:.2f}s")
    print(f"  ✏️  Prompt: {edit_prompt[:120]}...")
    print(f"  📦 Bounding Box: {wavespeed_bbox}")

    # ── Stage 3: Build Cloudinary clip URL ───────────────────────────────────
    print("\n[3] Building clip URL for WaveSpeed...")
    clip_url, _ = cloudinary.utils.cloudinary_url(
        VIDEO_PUB_ID,
        resource_type="video",
        format="mp4",
        start_offset=clip_start,
        end_offset=clip_end,
        secure=True,
    )
    print(f"  📎 Clip URL ({clip_start:.1f}s-{clip_end:.1f}s): {clip_url}")

    # ── Stage 4: Submit to WaveSpeed AI ──────────────────────────────────────
    print(f"\n[4] Submitting to WaveSpeed AI ({WAVESPEED_MODEL})...")
    payload = {
        "video": clip_url,
        "prompt": edit_prompt,
        "resolution": "720p",
        "seed": 42,
        "boundingBox": wavespeed_bbox,
        "track_object": True,
        # Apply the explicit constraints the user gave us right in the test script:
        "preserve_background": True,
        "denoising_strength": 0.6,
        "negative_prompt": (
            "changing background, morphing, altering environment, redrawing actor, "
            "shifting lighting, temporal jitter, modifying original pixels outside "
            "the product, hallucination, changing camera angle"
        )
    }
    
    # We must explicitly pre-pend the strict prompt here too as we are hitting the WaveSpeed API directly, 
    # totally bypassing the `app/routers/render.py` router in this test script!
    sys_prefix = (
        "Isolated product placement. Replace ONLY the target object. "
        "The background environment, lighting, shadows, and actor features "
        "must remain 100% identical to the original video. "
    )
    payload["prompt"] = f"{sys_prefix}{edit_prompt}"

    with httpx.Client(timeout=30) as client:
        resp = client.post(WAVESPEED_SUBMIT, json=payload, headers=wavespeed_headers())
        if resp.status_code not in (200, 201, 202):
            print(f"  ❌ Submit failed [{resp.status_code}]: {resp.text}")
            return
        submit_data = resp.json()

    print(f"  [Debug] Submit response: {submit_data}")
    # WaveSpeed uses various formats; look inside nested "data" just in case
    job_id = (
        submit_data.get("id") or submit_data.get("request_id") or submit_data.get("prediction_id") or
        submit_data.get("data", {}).get("id") or submit_data.get("data", {}).get("taskId") or 
        submit_data.get("data", {}).get("task_id") or submit_data.get("data", {}).get("prediction_id") or 
        submit_data.get("uuid")
    )
    status = submit_data.get("status") or submit_data.get("data", {}).get("status") or "processing"
    print(f"  ✅ Job submitted! ID: {job_id} | Status: {status}")

    if not job_id:
        print("  ❌ ERROR: Could not extract job ID from response. Aborting.")
        return

    # ── Stage 5: Poll for completion ─────────────────────────────────────────
    spinner = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]
    max_wait = POLL_INTERVAL_S * POLL_MAX_RETRIES
    print(f"\n[5] Waiting for WaveSpeed to render (up to {max_wait // 60}min)...")
    print(f"    ℹ️  Phase: processing → completed")

    edited_clip_url = None
    last_status = None
    start_time = time.time()

    for i in range(POLL_MAX_RETRIES):
        time.sleep(POLL_INTERVAL_S)
        elapsed = time.time() - start_time
        mm, ss = int(elapsed) // 60, int(elapsed) % 60
        spin = spinner[i % len(spinner)]

        try:
            with httpx.Client(timeout=15) as client:
                poll_resp = client.get(
                    f"{WAVESPEED_RESULT}/{job_id}/result",
                    headers=wavespeed_headers(),
                )
                if poll_resp.status_code not in (200, 201, 202):
                    print(f"    ⚠️  [{mm:02d}:{ss:02d}] Poll error: {poll_resp.status_code}")
                    continue
                poll_data = poll_resp.json()

            poll_status = poll_data.get("status") or poll_data.get("data", {}).get("status") or "unknown"

            if poll_status != last_status:
                icon = {"processing": "🔄", "completed": "✅", "failed": "❌", "created": "🕐"}.get(poll_status, "❓")
                print(f"  {icon} Status: {poll_status}")
                last_status = poll_status

            print(f"    {spin} [{mm:02d}:{ss:02d}] {poll_status}")

            if poll_status == "completed":
                # Extract output URL
                output = poll_data.get("output", {}) or poll_data.get("data", {})
                edited_clip_url = (
                    output.get("video_url") or output.get("url")
                    or poll_data.get("video_url") or poll_data.get("url")
                )
                # Check for list-style outputs
                if not edited_clip_url:
                    outputs = poll_data.get("outputs") or output.get("outputs", [])
                    if isinstance(outputs, list) and len(outputs) > 0:
                        first = outputs[0]
                        # In the wan-2.2 endpoint, 'outputs' is just a list of URL strings
                        edited_clip_url = first.get("url") if isinstance(first, dict) else first

                print(f"\n  🎉 WaveSpeed render complete! ({mm}m {ss}s)")
                print(f"  📎 Edited clip URL: {edited_clip_url}")
                break

            if poll_status == "failed":
                err = poll_data.get("error") or poll_data.get("message") or "Unknown"
                print(f"\n  ❌ WaveSpeed job FAILED: {err}")
                print(f"  Full response: {json.dumps(poll_data, indent=2)}")
                return

        except Exception as e:
            print(f"    ⚠️  [{mm:02d}:{ss:02d}] Poll error: {e}")
    else:
        print(f"\n  ⏰ Timed out after {max_wait // 60}min. Job ID: {job_id}")
        return

    if not edited_clip_url:
        print("  ❌ No output URL in the completed response.")
        print(f"  Full response: {json.dumps(poll_data, indent=2)}")
        return

    # ── Stage 6: Download generated segment ──────────────────────────────────
    print(f"\n[6] Downloading edited clip...")

    output_path = os.path.join(OUTPUT_DIR, "edited_clip_only.mp4")
    with httpx.Client(timeout=120, follow_redirects=True) as client:
        r = client.get(edited_clip_url)
        r.raise_for_status()
        with open(output_path, "wb") as f:
            f.write(r.content)

    print(f"  ✅ Downloaded edited clip to {output_path}")

    # ── Done ─────────────────────────────────────────────────────────────────
    output_size = os.path.getsize(output_path) / (1024 * 1024)
    print(f"\n{'=' * 60}")
    print(f"🎉 SUCCESS — Video segment generated")
    print(f"{'=' * 60}")
    print(f"  📂 Output: {output_path}")
    print(f"  📏 Size:   {output_size:.2f} MB")
    print(f"  📐 Edit:   {clip_start:.1f}s → {clip_end:.1f}s (Target Object Only)")
    print(f"  🎯 Best:   {best_ts:.1f}s (score: {score}/100)")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
