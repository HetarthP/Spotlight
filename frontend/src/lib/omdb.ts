/**
 * OMDb API helper.
 * Server-side only — keep the API key private.
 */

const OMDB_BASE = "https://www.omdbapi.com";

export interface OMDbMovie {
    imdbID: string;
    Title: string;
    Year: string;
    Poster: string;
    Type: string;
    Plot?: string;
    Genre?: string;
}

export interface OMDbSearchResult {
    Search?: OMDbMovie[];
    totalResults?: string;
    Response: string;
    Error?: string;
}

/**
 * Search OMDb by title. Returns up to 10 results per page.
 */
export async function searchMovies(
    query: string,
    page = 1
): Promise<OMDbSearchResult> {
    const apiKey = process.env.OMDB_API_KEY;
    if (!apiKey) throw new Error("OMDB_API_KEY is not configured.");

    const url = `${OMDB_BASE}/?apikey=${apiKey}&s=${encodeURIComponent(query)}&page=${page}`;
    const res = await fetch(url);
    return res.json();
}

/**
 * Get full details for a single movie by imdbID.
 */
export async function getMovieById(imdbID: string): Promise<OMDbMovie> {
    const apiKey = process.env.OMDB_API_KEY;
    if (!apiKey) throw new Error("OMDB_API_KEY is not configured.");

    const url = `${OMDB_BASE}/?apikey=${apiKey}&i=${imdbID}&plot=full`;
    const res = await fetch(url);
    return res.json();
}
