"""
Movies router — OMDb discovery & movie index.
Stage 1: Discovery & Media Ingestion.
"""

from fastapi import APIRouter, HTTPException, Query

from app.services.omdb import search_movies, get_movie_by_id

router = APIRouter()


@router.get("/search")
async def search(q: str = Query(..., min_length=1, description="Movie title to search")):
    """Search OMDb for movies by title."""
    result = await search_movies(q)

    if result.get("Response") == "False":
        raise HTTPException(status_code=404, detail=result.get("Error", "Not found"))

    return result


@router.get("/{imdb_id}")
async def get_movie(imdb_id: str):
    """Get full movie details by imdbID."""
    movie = await get_movie_by_id(imdb_id)

    if movie.get("Response") == "False":
        raise HTTPException(status_code=404, detail=movie.get("Error", "Not found"))

    return movie
