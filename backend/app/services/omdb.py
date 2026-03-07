"""
OMDb API service.
Stage 1: Discovery — Netflix-style search via imdbID.
"""

import httpx

from app.config import settings

OMDB_BASE = "https://www.omdbapi.com"


async def search_movies(query: str, page: int = 1) -> dict:
    """Search OMDb by title. Returns up to 10 results per page."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            OMDB_BASE,
            params={"apikey": settings.omdb_api_key, "s": query, "page": page},
        )
        return resp.json()


async def get_movie_by_id(imdb_id: str) -> dict:
    """Get full details for a single movie by imdbID."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            OMDB_BASE,
            params={"apikey": settings.omdb_api_key, "i": imdb_id, "plot": "full"},
        )
        return resp.json()
