import requests
import sys
import time

# Configuration
BASE_URL = "http://localhost:8000/api/v1/render"
VIDEO_URL = r"c:\Users\ryann\OneDrive\Desktop\projects\VPP\HackCanada\backend\tests\data\espresso.mp4"
BRAND_IMAGE_URL = r"c:\Users\ryann\OneDrive\Desktop\projects\VPP\HackCanada\backend\tests\data\tims.png"
TARGET_PRODUCT = "the coffee cup (held directly in the hand like a paper cup, with no handle)"

def run_demo():
    print(f"[*] Starting Seamless Ad Integration Demo...")
    print(f"[*] Video: {VIDEO_URL}")
    print(f"[*] Brand: {BRAND_IMAGE_URL}")
    print(f"[*] Goal: Replace '{TARGET_PRODUCT}' with the brand asset.")
    
    payload = {
        "video_url": VIDEO_URL,
        "reference_png_url": BRAND_IMAGE_URL,
        "general_target": TARGET_PRODUCT
    }

    try:
        print("[*] Submitting job to Agentic Pipeline (Gemini + Kling V2V)...")
        start_time = time.time()
        
        # Loading spinner mechanism
        import threading
        done = False
        
        def spinner():
            chars = "|/-\\"
            i = 0
            while not done:
                sys.stdout.write(f"\r\033[93m[*] Waiting for Kling Omni to render (this usually takes 5-10 minutes)... {chars[i % 4]}\033[0m")
                sys.stdout.flush()
                time.sleep(0.1)
                i += 1
            # Clear the loading line
            sys.stdout.write("\r" + " " * 80 + "\r")
            sys.stdout.flush()

        t = threading.Thread(target=spinner)
        t.start()

        # Increased timeout to 20 minutes to accommodate Fal's V2V queue
        response = requests.post(f"{BASE_URL}/agentic-placement", json=payload, timeout=1200)
        
        # Stop spinner
        done = True
        t.join()
        
        if response.status_code == 200:
            data = response.json()
            duration = time.time() - start_time
            print(f"\n\033[92m✅ SUCCESS! (Took {duration:.1f}s)\033[0m")
            print(f"[*] Status: {data.get('status')}")
            print(f"[*] Message: {data.get('message')}")
            print(f"\033[1;96m[*] Result Video URL: {data.get('video_url')}\033[0m")
            print("\nCopy the URL above into your browser to see the seamless ad placement.")
        else:
            print(f"\n\033[91m❌ Error: {response.status_code}\033[0m")
            print(response.text)
            
    except Exception as e:
        done = True
        print(f"\n\033[91m❌ Execution failed: {str(e)}\033[0m")

if __name__ == "__main__":
    run_demo()
