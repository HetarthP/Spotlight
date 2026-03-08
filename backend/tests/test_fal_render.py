"""
End-to-End Fal.ai Test: Pepsi -> Coke replacement.

Pipeline:
  1. Gemini 2.5 Flash: Full-video analysis -> best timestamp + inpainting prompt
  2. Cloudinary: Clip URL for the target 4-second window
  3. Fal.ai wan-vace (task=inpainting): video-to-video Pepsi -> Coke
  4. Poll until COMPLETED, print output URL
"""

import os, time, json
from dotenv import load_dotenv

load_dotenv()

import cloudinary
import cloudinary.utils
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True,
)

from google import genai
from google.genai import types
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

import fal_client
os.environ["FAL_KEY"] = os.getenv("FAL_KEY", "")

VIDEO_PUB_ID = "vpp_test/pepsi_test"
VIDEO_PATH   = r"c:\Users\ryann\OneDrive\Desktop\projects\VPP\HackCanada\backend\tests\data\pepsi.mp4"
FAL_MODEL    = "fal-ai/wan-vace"

print("\n" + "=" * 60)
print("GHOST-MERCHANT: Fal.ai wan-vace Pepsi -> Coke Test")
print("=" * 60)

# ── Stage 1: Cloudinary source URL ───────────────────────────────────────────
video_url, _ = cloudinary.utils.cloudinary_url(VIDEO_PUB_ID, resource_type="video", format="mp4", secure=True)
print(f"\n[1] Source: {video_url}")

# ── Stage 2: Gemini full-video analysis ──────────────────────────────────────
print("\n[2] Uploading to Gemini File API...")
with open(VIDEO_PATH, "rb") as f:
    gfile = client.files.upload(file=f, config=types.UploadFileConfig(mime_type="video/mp4", display_name="pepsi_test"))

for _ in range(20):
    s = client.files.get(name=gfile.name)
    if s.state.name == "ACTIVE":
        break
    print("  Waiting...")
    time.sleep(3)

print("  Analyzing with Gemini...")
resp = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=[gfile, """
Watch this video. Find the BEST single moment where someone is clearly drinking from a Pepsi can (21-26s window preferred).

Return ONLY this JSON (no markdown, no extra text):
{
  "best_timestamp": <float seconds>,
  "clip_start": <float, best_timestamp - 2.0, min 0>,
  "clip_end": <float, best_timestamp + 2.0>,
  "inpainting_prompt": "<A vivid, specific prompt for AI video inpainting to replace the Pepsi can with a Coca-Cola glass bottle. Include: hand position, drinking motion, lighting match, realistic integration. Example: 'Replace the Pepsi can being drunk by the woman with a glass Coca-Cola bottle. The woman continues the same drinking motion. The bottle label faces camera. Realistic lighting and shadows matching the scene.'>",
  "score": <int 0-100>
}
"""],
    config=types.GenerateContentConfig(response_mime_type="application/json", temperature=0.1),
)
try:
    client.files.delete(name=gfile.name)
except Exception:
    pass

analysis = json.loads(resp.text)
best_ts    = float(analysis["best_timestamp"])
clip_start = float(analysis.get("clip_start", max(0, best_ts - 2.0)))
clip_end   = float(analysis.get("clip_end", best_ts + 2.0))
prompt     = analysis["inpainting_prompt"]
score      = analysis.get("score", 0)

print(f"  Best: {best_ts}s (score {score}/100)")
print(f"  Clip: {clip_start}s -> {clip_end}s")
# Truncate prompt for display
print(f"  Prompt: {prompt[:150]}...")

# ── Stage 3: Cloudinary clip URL ─────────────────────────────────────────────
clip_url, _ = cloudinary.utils.cloudinary_url(
    VIDEO_PUB_ID,
    resource_type="video",
    format="mp4",
    start_offset=clip_start,
    end_offset=clip_end,
    secure=True,
)
print(f"\n[3] Clip URL ({clip_start}s-{clip_end}s):\n  {clip_url}")

# ── Stage 4: Submit to Fal.ai wan-vace (inpainting task) ─────────────────────
payload = {
    "video_url": clip_url,
    "prompt": prompt,
    "task": "inpainting",           # Use inpainting mode for object replacement
    "resolution": "720p",
    "aspect_ratio": "16:9",
    "num_inference_steps": 30,
    "enable_safety_checker": False,
    "enable_prompt_expansion": False,
}

print(f"\n[4] Submitting to Fal.ai ({FAL_MODEL}) ...")
handler = fal_client.submit(FAL_MODEL, arguments=payload)
request_id = handler.request_id
print(f"  Job ID: {request_id}")

# ── Stage 5: Poll for completion ─────────────────────────────────────────────
print(f"\n[5] Polling (up to 5 minutes)...")
for i in range(72):
    time.sleep(5)
    try:
        status = fal_client.status(FAL_MODEL, request_id, with_logs=False)
        status_str = str(getattr(status, "status", status))
        print(f"  t+{(i+1)*5}s | {status_str}")

        if "COMPLETED" in status_str.upper():
            result = fal_client.result(FAL_MODEL, request_id)
            # Extract output URL — wan-vace returns result.video.url
            output_url = None
            if hasattr(result, "video"):
                output_url = getattr(result.video, "url", None)
            elif isinstance(result, dict):
                output_url = (
                    (result.get("video") or {}).get("url")
                    or result.get("output_url")
                    or result.get("url")
                )

            print(f"\n{'='*60}")
            print(f"SUCCESS!")
            print(f"Output URL: {output_url}")
            print(f"{'='*60}")
            print(f"\nFull result: {result}")
            break

        if any(x in status_str.upper() for x in ["FAILED", "ERROR"]):
            print(f"\nFal.ai job FAILED: {status}")
            break
    except Exception as e:
        print(f"  Poll error: {e}")
else:
    print(f"\nTimed out. Job ID for manual check: {request_id}")
