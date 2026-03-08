"""
Google Cloud Video Intelligence service.
Pre-screens videos to find the best candidate moments for ad placement
using shot detection, label detection, and logo detection.

This runs as a SINGLE API call on the entire video, returning:
- Shot boundaries (scene transitions)
- Labels with timestamps (e.g., "beverage", "person", "drinking")
- Logo detections with timestamps (e.g., "Pepsi" at 2.1s-9.4s)

The pipeline then sends only the top 3 candidate frames to Gemini
for precise bounding box detection.
"""
import os
from google.cloud import videointelligence
from google.oauth2 import service_account


def analyze_video(video_uri: str, features: list[str] | None = None) -> dict:
    """
    Analyze a video using Cloud Video Intelligence API.

    Args:
        video_uri: GCS URI (gs://bucket/video.mp4) or HTTPS URL of the video.
        features: List of features to detect. Defaults to shot changes + labels.

    Returns:
        dict with 'shots', 'labels', and 'logos' lists.
    """
    # Use API key auth (same Gemini project) or service account
    credentials = None
    sa_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if sa_path and os.path.exists(sa_path):
        credentials = service_account.Credentials.from_service_account_file(sa_path)

    client = videointelligence.VideoIntelligenceServiceClient(
        credentials=credentials
    )

    # Default features: shot detection + label detection + logo detection
    feature_types = [
        videointelligence.Feature.SHOT_CHANGE_DETECTION,
        videointelligence.Feature.LABEL_DETECTION,
        videointelligence.Feature.LOGO_RECOGNITION,
    ]

    # Configure label detection to get frame-level results
    config = videointelligence.VideoContext(
        label_detection_config=videointelligence.LabelDetectionConfig(
            label_detection_mode=videointelligence.LabelDetectionMode.SHOT_AND_FRAME_MODE,
            frame_confidence_threshold=0.5,
        )
    )

    print("  Sending video to Cloud Video Intelligence API...")
    operation = client.annotate_video(
        request={
            "input_uri": video_uri,
            "features": feature_types,
            "video_context": config,
        }
    )

    print("  Waiting for analysis (this takes ~15-30s)...")
    result = operation.result(timeout=300)

    annotation = result.annotation_results[0]

    # Parse shot changes
    shots = []
    for shot in annotation.shot_annotations:
        start = shot.start_time_offset.total_seconds()
        end = shot.end_time_offset.total_seconds()
        shots.append({"start": start, "end": end, "midpoint": (start + end) / 2})

    # Parse labels
    labels = []
    for label in annotation.shot_label_annotations:
        name = label.entity.description.lower()
        for segment in label.segments:
            start = segment.segment.start_time_offset.total_seconds()
            end = segment.segment.end_time_offset.total_seconds()
            confidence = segment.confidence
            labels.append({
                "name": name,
                "start": start,
                "end": end,
                "confidence": confidence,
            })

    # Parse logos
    logos = []
    if hasattr(annotation, 'logo_recognition_annotations'):
        for logo in annotation.logo_recognition_annotations:
            name = logo.entity.description.lower()
            for track in logo.tracks:
                start = track.segment.start_time_offset.total_seconds()
                end = track.segment.end_time_offset.total_seconds()
                confidence = track.confidence
                logos.append({
                    "name": name,
                    "start": start,
                    "end": end,
                    "confidence": confidence,
                })

    return {"shots": shots, "labels": labels, "logos": logos}


def find_best_ad_moments(analysis: dict, target_product: str = "pepsi", top_n: int = 3) -> list[float]:
    """
    Given Video Intelligence results, find the best timestamps for ad placement.

    Strategy:
    1. Find shots where the target product logo appears (highest priority)
    2. Find shots with beverage/drink-related labels (medium priority)
    3. Use shot midpoints for transitions (fallback)

    Args:
        analysis: Output from analyze_video()
        target_product: Product to look for (e.g., "pepsi")
        top_n: Number of candidate timestamps to return

    Returns:
        List of timestamps (seconds) sorted by quality, best first.
    """
    candidates = []

    # Priority 1: Logo detections of the target product
    for logo in analysis["logos"]:
        if target_product in logo["name"]:
            midpoint = (logo["start"] + logo["end"]) / 2
            candidates.append({
                "time": midpoint,
                "score": 100 * logo["confidence"],
                "reason": f"'{logo['name']}' logo detected ({logo['start']:.1f}s-{logo['end']:.1f}s)",
            })

    # Priority 2: Beverage/drink labels
    drink_keywords = ["beverage", "drink", "drinking", "can", "soda", "soft drink", "cola"]
    for label in analysis["labels"]:
        if any(kw in label["name"] for kw in drink_keywords):
            midpoint = (label["start"] + label["end"]) / 2
            candidates.append({
                "time": midpoint,
                "score": 70 * label["confidence"],
                "reason": f"'{label['name']}' detected ({label['start']:.1f}s-{label['end']:.1f}s)",
            })

    # Priority 3: Shot transitions (good for scene-change ad insertion)
    for shot in analysis["shots"]:
        candidates.append({
            "time": shot["midpoint"],
            "score": 30,
            "reason": f"shot change ({shot['start']:.1f}s-{shot['end']:.1f}s)",
        })

    # Sort by score descending, deduplicate nearby timestamps (within 2s)
    candidates.sort(key=lambda c: c["score"], reverse=True)

    selected = []
    for c in candidates:
        # Skip if too close to an already-selected timestamp
        if any(abs(c["time"] - s["time"]) < 2.0 for s in selected):
            continue
        selected.append(c)
        if len(selected) >= top_n:
            break

    return selected
