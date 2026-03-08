import os
from dotenv import load_dotenv
import cloudinary
import cloudinary.api

env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path=env_path)

# Clear any CLOUDINARY_URL conflict that might override explicitly passed config
if "CLOUDINARY_URL" in os.environ:
    del os.environ["CLOUDINARY_URL"]

cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
api_key = os.getenv("CLOUDINARY_API_KEY")
api_secret = os.getenv("CLOUDINARY_API_SECRET")

print("--- CLOUDINARY PING TEST ---")
print(f"Cloud Name: {cloud_name}")
print(f"API Key: {api_key}")
print(f"Secret Length: {len(api_secret) if api_secret else 0}")

cloudinary.config(
    cloud_name=cloud_name,
    api_key=api_key,
    api_secret=api_secret,
    secure=True
)

try:
    res = cloudinary.api.ping()
    print("\nSUCCESS! Ping Response:")
    print(res)
except Exception as e:
    print("\nFAILED! Error:")
    import traceback
    traceback.print_exc()
