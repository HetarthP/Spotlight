"""
VPP Backend — FastAPI entry point.
Run: uvicorn app.main:app --reload
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import movies, videos, placements

app = FastAPI(
    title="VPP API",
    description="Virtual Product Placement — API for AI-powered ad slot detection and VFX composition.",
    version="0.1.0",
)

# ── CORS ──────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────
app.include_router(movies.router, prefix="/api/movies", tags=["Movies"])
app.include_router(videos.router, prefix="/api/videos", tags=["Videos"])
app.include_router(placements.router, prefix="/api/placements", tags=["Placements"])


@app.get("/")
async def root():
    return {
        "service": "VPP API",
        "version": "0.1.0",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    return {"status": "ok"}
