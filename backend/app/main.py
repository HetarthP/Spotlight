"""
VPP Backend — FastAPI entry point.
Run: uvicorn app.main:app --reload
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import db

from app.config import settings
from app.routers import movies, videos, placements, chat, render, brand
from fastapi.staticfiles import StaticFiles
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Connect to the database on startup
    await db.connect()
    yield
    # Disconnect from the database on shutdown
    await db.disconnect()

app = FastAPI(
    title="VPP API",
    description="Virtual Product Placement — API for AI-powered ad slot detection and VFX composition.",
    version="0.1.0",
    lifespan=lifespan,
    lifespan_handler=None, # Fix for potential type error in some versions
)
# Note: Above lifespan_handler is a placeholder if needed, usually just 'lifespan' works.

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
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(render.router, prefix="/api/render", tags=["Render"])
app.include_router(brand.router, prefix="/api/brand", tags=["Brand"])

# Serve local assets (video/images) for development/demo
static_path = r"c:\Users\ryann\OneDrive\Desktop\projects\VPP\HackCanada\backend\tests\data"
app.mount("/static", StaticFiles(directory=static_path), name="static")

import os
from fastapi import Request, HTTPException
from fastapi.responses import StreamingResponse

def range_requests_response(request: Request, file_path: str, content_type: str):
    file_size = os.stat(file_path).st_size
    range_header = request.headers.get("range")

    if not range_header:
        headers = {
            "Content-Length": str(file_size),
            "Accept-Ranges": "bytes",
            "Content-Type": content_type,
        }
        def file_iterator():
            with open(file_path, "rb") as f:
                yield from f
        return StreamingResponse(file_iterator(), headers=headers, media_type=content_type)

    try:
        byte_range = range_header.replace("bytes=", "").split("-")
        start = int(byte_range[0])
        end = int(byte_range[1]) if byte_range[1] else file_size - 1
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid range")

    if start >= file_size or end >= file_size:
        headers = {"Content-Range": f"bytes */{file_size}"}
        return StreamingResponse(iter([]), status_code=416, headers=headers)

    content_length = end - start + 1
    headers = {
        "Content-Range": f"bytes {start}-{end}/{file_size}",
        "Accept-Ranges": "bytes",
        "Content-Length": str(content_length),
        "Content-Type": content_type,
    }

    def file_iterator_range():
        with open(file_path, "rb") as f:
            f.seek(start)
            bytes_left = content_length
            chunk_size = 8192
            while bytes_left > 0:
                data = f.read(min(chunk_size, bytes_left))
                if not data:
                    break
                bytes_left -= len(data)
                yield data

    return StreamingResponse(file_iterator_range(), status_code=206, headers=headers, media_type=content_type)

@app.get("/api/video-stream/{filename}")
async def stream_video(request: Request, filename: str):
    file_path = os.path.join(static_path, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Video not found")
    return range_requests_response(request, file_path, "video/mp4")


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


@app.get("/video/{imdb_id}")
async def get_video_slots(imdb_id: str):
    # Fetch movie placements from OMDb linked data
    video = await db.video.find_unique(
        where={'imdbId': imdb_id},
        include={'slots': True}
    )
    return video
