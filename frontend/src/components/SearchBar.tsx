"use client";

import { useState } from "react";

interface SearchBarProps {
    onSearch: (query: string) => void;
    loading?: boolean;
}

export default function SearchBar({ onSearch, loading }: SearchBarProps) {
    const [query, setQuery] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(query);
    };

    return (
        <form className="search-wrapper" onSubmit={handleSubmit}>
            <input
                id="movie-search"
                type="text"
                className="input"
                placeholder="Search movies by title (e.g. Inception, The Matrix)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={loading}
            />
            <button
                type="submit"
                className="btn btn-primary"
                style={{
                    position: "absolute",
                    right: "4px",
                    top: "4px",
                    bottom: "4px",
                    borderRadius: "6px",
                }}
                disabled={loading}
            >
                {loading ? "Searching…" : "🔍 Search"}
            </button>
        </form>
    );
}
