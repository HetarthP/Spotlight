import asyncio
import httpx
import json

async def test_brand_aware_placement():
    print("[*] Testing Brand-Aware Placement Logic...")
    
    # 1. Update Brand Profile to "Liquid Death"
    print("[*] Updating Brand Profile to Liquid Death...")
    async with httpx.AsyncClient() as client:
        resp = await client.put(
            "http://localhost:8000/api/brand/auth0|default",
            json={
                "brand_name": "Liquid Death",
                "industry": "Beverage",
                "tone": "Edgy, irreverent, dark humor",
                "goals": "Find high-energy or intense scenes to place our mountain water.",
                "product_image_url": "https://example.com/liquid_death_can.png"
            }
        )
        print(f"Profile Update Status: {resp.status_code}")
        print(f"Profile Data: {resp.json()}")

    # 2. Trigger Agentic Placement
    print("\n[*] Triggering Agentic Placement (Simulating Gemini Analysis)...")
    async with httpx.AsyncClient() as client:
        # Note: This will actually call Gemini if the server is running and API keys are set.
        # We'll just check if the backend handles the request without crashing.
        try:
            resp = await client.post(
                "http://localhost:8000/api/render/agentic-placement",
                json={
                    "video_url": "https://res.cloudinary.com/demo/video/upload/v1642157523/sample.mp4",
                    "reference_png_url": "https://example.com/liquid_death_can.png",
                    "general_target": "beverage container",
                    "user_id": "auth0|default"
                },
                timeout=120
            )
            print(f"Placement Request Status: {resp.status_code}")
            if resp.status_code == 200:
                print(f"Response: {resp.json()}")
            else:
                print(f"Error: {resp.text}")
        except Exception as e:
            print(f"Request failed (as expected if credentials missing): {e}")

if __name__ == "__main__":
    asyncio.run(test_brand_aware_placement())
