"use client";

import { useState } from "react";
import SearchBar from "@/components/SearchBar";
import MovieCard from "@/components/MovieCard";

interface Movie {
    imdbID: string;
    Title: string;
    Year: string;
    Poster: string;
    Type: string;
}

export default function HomePage() {
    const [movies, setMovies] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSearch = async (query: string) => {
        if (!query.trim()) return;

        setLoading(true);
        setError("");

        try {
            // Calls backend proxy or directly OMDb
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/movies/search?q=${encodeURIComponent(query)}`
            );
            const data = await res.json();

            if (data.Search) {
                setMovies(data.Search);
            } else {
                setMovies([]);
                setError(data.Error || "No results found.");
            }
        } catch {
            setError("Failed to fetch results. Is the backend running?");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="page-header text-center">
                <h1>Discover Films</h1>
                <p>Search for movies and unlock AI-powered ad placement slots.</p>
            </div>

            <SearchBar onSearch={handleSearch} loading={loading} />

            {error && (
                <p className="text-center" style={{ color: "var(--danger)" }}>
                    {error}
                </p>
            )}

            <div className="card-grid">
                {movies.map((movie) => (
                    <MovieCard key={movie.imdbID} movie={movie} />
                ))}
            </div>
        </>
    );
}
