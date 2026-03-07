import Image from "next/image";

interface MovieCardProps {
    movie: {
        imdbID: string;
        Title: string;
        Year: string;
        Poster: string;
        Type: string;
    };
}

export default function MovieCard({ movie }: MovieCardProps) {
    const posterSrc =
        movie.Poster !== "N/A" ? movie.Poster : "/placeholder-poster.png";

    return (
        <div className="card movie-card" id={`movie-${movie.imdbID}`}>
            <Image
                src={posterSrc}
                alt={`${movie.Title} poster`}
                width={260}
                height={360}
                style={{ width: "100%", height: "360px", objectFit: "cover" }}
                unoptimized
            />
            <div className="movie-card-body">
                <h3>{movie.Title}</h3>
                <p>
                    {movie.Year} · {movie.Type}
                </p>
                <p
                    style={{
                        fontSize: "0.7rem",
                        color: "var(--text-secondary)",
                        marginTop: "0.25rem",
                    }}
                >
                    {movie.imdbID}
                </p>
            </div>
        </div>
    );
}
