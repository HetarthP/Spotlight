import requests
import os
import sys

def test_mime_type():
    url = "http://localhost:8000/api/video-stream/espresso.mp4"
    print(f"Testing MIME type for: {url}")
    try:
        response = requests.head(url)
        content_type = response.headers.get("Content-Type")
        print(f"Status Code: {response.status_code}")
        print(f"Content-Type: {content_type}")
        if response.status_code == 200 and content_type == "video/mp4":
            print("✅ MIME type test passed!")
        else:
            print("❌ MIME type test failed.")
    except Exception as e:
        print(f"❌ Connection error: {e}")

def test_analyze_endpoint():
    url = "http://localhost:8000/api/render/analyze"
    payload = {
        "video_url": "http://localhost:8000/static/espresso.mp4",
        "product_image_url": "http://localhost:8000/static/tims.png",
        "user_id": "auth0|default"
    }
    print(f"\nTesting Analysis Endpoint: {url}")
    try:
        response = requests.post(url, json=payload, timeout=60)
        data = response.json()
        print(f"Status Code: {response.status_code}")
        slots = data.get("detected_slots", [])
        print(f"Found {len(slots)} slots.")
        
        # Check if fallback or real
        is_fallback = any(s.get("id") == "fallback-1" for s in slots)
        if is_fallback:
            print("⚠️ Warning: System returned Fallback data. Check backend terminal for 'Direct Drive' logs.")
        elif len(slots) > 0:
            print("✅ Gemini Analysis returned real slots!")
        
        if len(slots) <= 5:
            print("✅ Top 5 Safety Slice verified.")
        else:
            print("❌ Top 5 Safety Slice failed (more than 5 slots).")
            
    except Exception as e:
        print(f"❌ Analysis error: {e}")

if __name__ == "__main__":
    test_mime_type()
    test_analyze_endpoint()
