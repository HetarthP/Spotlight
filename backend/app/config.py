"""
VPP Backend — Application settings.
Reads from environment variables / .env file.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ── Cloudinary ────────────────────────────
    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""

    # ── OMDb ──────────────────────────────────
    omdb_api_key: str = ""

    # ── Google Gemini ─────────────────────────
    gemini_api_key: str = ""

    # ── Backboard.io ──────────────────────────
    backboard_api_key: str = ""
    backboard_project_id: str = ""

    # ── Vultr ─────────────────────────────────
    vultr_api_key: str = ""

    # ── Auth0 ─────────────────────────────────
    auth0_domain: str = ""
    auth0_audience: str = ""

    # ── Database ──────────────────────────────
    database_url: str = "postgresql://user:password@localhost:5432/vpp"

    # ── Redis / Celery ────────────────────────
    redis_url: str = "redis://localhost:6379/0"

    # ── CORS ──────────────────────────────────
    cors_origins: str = "http://localhost:3000"

    model_config = {
        "env_file": ".env", 
        "env_file_encoding": "utf-8",
        "extra": "ignore"
    }


settings = Settings()
