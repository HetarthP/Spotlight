import pytest
import os
from unittest.mock import AsyncMock, patch

# Mock environment before importing app (which initializes clients)
with patch.dict(os.environ, {"GEMINI_API_KEY": "fake_key", "FAL_KEY": "fake_key"}):
    from app.main import app
    from fastapi.testclient import TestClient

client = TestClient(app)

@patch("app.routers.render.analyze_scene_for_replacement")
@patch("app.routers.render.submit_kling_omni_v2v")
def test_agentic_placement_v2v_flow(mock_submit_v2v, mock_analyze_scene):
    # Setup mocks
    mock_analyze_scene.return_value = {
        "specific_description": "the black hoodie the guy is wearing",
        "start_time": 2.0,
        "end_time": 7.0
    }
    mock_submit_v2v.return_value = "https://fal.ai/outputs/generated_video.mp4"
    
    # We use a Cloudinary-style URL to test the clipping logic
    source_url = "https://res.cloudinary.com/dtmyvjdff/video/upload/v1234/source_video.mp4"
    expected_clipped_url = "https://res.cloudinary.com/dtmyvjdff/video/upload/so_2.0,eo_7.0/v1234/source_video.mp4"
    
    payload = {
        "video_url": source_url,
        "reference_png_url": "https://example.com/brand_logo.png",
        "general_target": "the shirt"
    }
    
    # Execute request
    response = client.post("/api/v1/render/agentic-placement", json=payload)
    
    # Assertions
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "completed"
    assert "segment 2.0s - 7.0s" in data["message"]
    
    # Verify Gemini was called correctly
    mock_analyze_scene.assert_called_once_with(source_url, "the shirt")
    
    # Verify Fal (Kling) was called with the CLIPPED URL and the specific description
    mock_submit_v2v.assert_called_once_with(
        video_url=expected_clipped_url,
        reference_png_url="https://example.com/brand_logo.png",
        target_product="the black hoodie the guy is wearing"
    )

if __name__ == "__main__":
    # If run directly, we can try a simple execution check if the server is up
    # but the mocks won't work this way. This file is intended for pytest.
    print("Run this test with: pytest backend/tests/test_agentic_pipeline.py")
