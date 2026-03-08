"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";
import { Play, TrendingUp, Star, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { GlowingEffect } from "@/components/ui/glowing-effect";

export default function CatalogPage() {
    const [activeMovieId, setActiveMovieId] = useState<string | null>(null);
    const [activeType, setActiveType] = useState<string>("movie"); // 'movie' or 'tv'

    const movies = [
        {
            id: "tt0144084", // American Psycho
            title: "American Psycho",
            year: "2000",
            duration: "1h 42m",
            type: "movie",
            rating: "7.6",
            poster: "https://img.omdbapi.com/?apikey=d8fce21c&i=tt0144084",
            banner: "https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?auto=format&fit=crop&q=80&w=2000",
            description: "A wealthy New York investment banking executive, Patrick Bateman, hides his alternate psychopathic ego from his co-workers and friends as he delves deeper into his violent, hedonistic fantasies.",
            tags: ["Crime", "Drama", "Horror"],
            isHero: true
        },
        {
            id: "tt0133093", // The Matrix
            title: "The Matrix",
            year: "1999",
            duration: "2h 16m",
            type: "movie",
            rating: "8.7",
            poster: "https://img.omdbapi.com/?apikey=d8fce21c&i=tt0133093",
            description: "A computer hacker learns from mysterious rebels about the true nature of his reality.",
            tags: ["Action", "Sci-Fi"],
            isHero: false
        },
        {
            id: "tt0816692", // Interstellar
            title: "Interstellar",
            year: "2014",
            duration: "2h 49m",
            type: "movie",
            rating: "8.6",
            poster: "https://img.omdbapi.com/?apikey=d8fce21c&i=tt0816692",
            description: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
            tags: ["Adventure", "Sci-Fi"],
            isHero: false
        },
        {
            id: "tt0111161", // The Shawshank Redemption
            title: "The Shawshank Redemption",
            year: "1994",
            duration: "2h 22m",
            type: "movie",
            rating: "9.3",
            poster: "https://img.omdbapi.com/?apikey=d8fce21c&i=tt0111161",
            description: "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
            tags: ["Drama"],
            isHero: false
        },
        {
            id: "tt0903747", // Breaking Bad
            title: "Breaking Bad",
            year: "2008-2013",
            duration: "5 Seasons",
            type: "tv",
            rating: "9.5",
            poster: "https://img.omdbapi.com/?apikey=d8fce21c&i=tt0903747",
            description: "A chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine.",
            tags: ["Crime", "Drama", "Thriller"],
            isHero: false
        },
        {
            id: "tt4158110", // Mr. Robot
            title: "Mr. Robot",
            year: "2015-2019",
            duration: "4 Seasons",
            type: "tv",
            rating: "8.5",
            poster: "https://img.omdbapi.com/?apikey=d8fce21c&i=tt4158110",
            description: "Elliot, a brilliant but highly unstable young cyber-security engineer and vigilante hacker, becomes a key figure in a complex game of global dominance.",
            tags: ["Crime", "Drama", "Thriller"],
            isHero: false
        },
        {
            id: "tt0468569", // The Dark Knight
            title: "The Dark Knight",
            year: "2008",
            duration: "2h 32m",
            type: "movie",
            rating: "9.0",
            poster: "https://img.omdbapi.com/?apikey=d8fce21c&i=tt0468569",
            description: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
            tags: ["Action", "Crime", "Drama"],
            isHero: false
        },
        {
            id: "tt1375666", // Inception
            title: "Inception",
            year: "2010",
            duration: "2h 28m",
            type: "movie",
            rating: "8.8",
            poster: "https://img.omdbapi.com/?apikey=d8fce21c&i=tt1375666",
            description: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
            tags: ["Action", "Adventure", "Sci-Fi"],
            isHero: false
        },
        {
            id: "tt0944947", // Game of Thrones
            title: "Game of Thrones",
            year: "2011-2019",
            duration: "8 Seasons",
            type: "tv",
            rating: "9.2",
            poster: "https://img.omdbapi.com/?apikey=d8fce21c&i=tt0944947",
            description: "Nine noble families fight for control over the lands of Westeros, while an ancient enemy returns after being dormant for millennia.",
            tags: ["Action", "Adventure", "Drama"],
            isHero: false
        },
        {
            id: "tt2467372", // Brooklyn Nine-Nine
            title: "Brooklyn Nine-Nine",
            year: "2013-2021",
            duration: "8 Seasons",
            type: "tv",
            rating: "8.4",
            poster: "https://img.omdbapi.com/?apikey=d8fce21c&i=tt2467372",
            description: "Jake Peralta, an immature, but talented N.Y.P.D. detective in Brooklyn's 99th Precinct, comes into immediate conflict with his new commanding officer.",
            tags: ["Comedy", "Crime"],
            isHero: false
        },
        {
            id: "tt0108052", // Schindler's List
            title: "Schindler's List",
            year: "1993",
            duration: "3h 15m",
            type: "movie",
            rating: "9.0",
            poster: "https://img.omdbapi.com/?apikey=d8fce21c&i=tt0108052",
            description: "In German-occupied Poland during World War II, industrialist Oskar Schindler gradually becomes concerned for his Jewish workforce.",
            tags: ["Biography", "Drama", "History"],
            isHero: false
        },
        {
            id: "tt0109830", // Forrest Gump
            title: "Forrest Gump",
            year: "1994",
            duration: "2h 22m",
            type: "movie",
            rating: "8.8",
            poster: "https://img.omdbapi.com/?apikey=d8fce21c&i=tt0109830",
            description: "The presidencies of Kennedy and Johnson, the Vietnam War, the Watergate scandal and other historical events unfold from the perspective of an Alabama man.",
            tags: ["Drama", "Romance"],
            isHero: false
        },
        {
            id: "tt0386676", // The Office
            title: "The Office",
            year: "2005-2013",
            duration: "9 Seasons",
            type: "tv",
            rating: "9.0",
            poster: "https://img.omdbapi.com/?apikey=d8fce21c&i=tt0386676",
            description: "A mockumentary on a group of typical office workers, where the workday consists of ego clashes, inappropriate behavior, and tedium.",
            tags: ["Comedy"],
            isHero: false
        },
        {
            id: "tt0110912", // Pulp Fiction
            title: "Pulp Fiction",
            year: "1994",
            duration: "2h 34m",
            type: "movie",
            rating: "8.9",
            poster: "https://img.omdbapi.com/?apikey=d8fce21c&i=tt0110912",
            description: "The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.",
            tags: ["Crime", "Drama"],
            isHero: false
        },
        {
            id: "tt0167260", // The Lord of the Rings: The Return of the King
            title: "The Lord of the Rings",
            year: "2003",
            duration: "3h 21m",
            type: "movie",
            rating: "9.0",
            poster: "https://img.omdbapi.com/?apikey=d8fce21c&i=tt0167260",
            description: "Gandalf and Aragorn lead the World of Men against Sauron's army to draw his gaze from Frodo and Sam as they approach Mount Doom with the One Ring.",
            tags: ["Action", "Adventure", "Drama"],
            isHero: false
        }
    ];

    const heroMovie = movies.find(m => m.isHero) || movies[0];

    return (
        <DashboardLayout>
            <div className="relative min-h-[calc(100vh-4rem)] w-full bg-black overflow-hidden flex flex-col">
                
                {/* Background Details */}
                <div className="absolute inset-0 z-0">
                    <BackgroundGradientAnimation
                        gradientBackgroundStart="rgb(5, 5, 5)"
                        gradientBackgroundEnd="rgb(10, 20, 30)"
                        firstColor="13, 148, 136"
                        secondColor="20, 184, 166"
                        thirdColor="30, 41, 59"
                        fourthColor="15, 118, 110"
                        fifthColor="2, 6, 23"
                        pointerColor="255, 255, 255"
                        size="100%"
                        blendingValue="hard-light"
                        interactive={false}
                        containerClassName="absolute inset-0 opacity-20"
                    />
                </div>

                {activeMovieId ? (
                    // FULL SCREEN EMBED PLAYER
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="relative z-10 w-full flex-1 flex flex-col items-center justify-center p-4 lg:p-12 animate-in fade-in zoom-in duration-500"
                    >
                        <button 
                            onClick={() => setActiveMovieId(null)}
                            className="absolute top-8 left-8 text-gray-400 hover:text-white transition-colors bg-black/50 px-4 py-2 rounded-full backdrop-blur-md border border-white/10 z-50 flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Catalog
                        </button>

                        <div className="w-full max-w-6xl aspect-video bg-black rounded-3xl overflow-hidden border border-gray-800 shadow-[0_0_50px_rgba(20,184,166,0.15)] relative group relative z-10">
                             <GlowingEffect
                                spread={30}
                                glow={true}
                                disabled={false}
                                proximity={64}
                                inactiveZone={0.01}
                                borderWidth={1}
                            />
                            {/* Fast Hackathon Video Embed Exploit using vidsrc */}
                            <iframe 
                                src={`https://vidsrc.net/embed/${activeType}?imdb=${activeMovieId}`}
                                className="absolute inset-0 w-full h-full z-10 rounded-3xl"
                                allowFullScreen
                                allow="autoplay"
                            />
                        </div>
                    </motion.div>
                ) : (
                    // CATALOG UX
                    <div className="relative z-10 w-full max-w-7xl mx-auto flex-1 overflow-y-auto pb-24 no-scrollbar">
                        {/* Hero Section */}
                        <div className="relative w-full h-[60vh] md:h-[70vh] rounded-b-[3rem] overflow-hidden mb-12 shadow-2xl border-b border-gray-800/50">
                            <div className="absolute inset-0 bg-black">
                                <img 
                                    src="https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?auto=format&fit=crop&w=2000&q=80" 
                                    alt="Hero Background"
                                    className="w-full h-full object-cover opacity-30 grayscale blur-[2px]"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
                            </div>
                            
                            <div className="absolute inset-0 flex items-center px-8 md:px-16 lg:px-24">
                                <div className="max-w-2xl">
                                    <div className="flex items-center gap-4 mb-4">
                                        <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-400 border border-teal-500/30 text-xs font-bold tracking-widest uppercase">
                                            Featured
                                        </span>
                                        <div className="flex items-center gap-1 text-yellow-500 text-sm font-semibold">
                                            <Star className="w-4 h-4 fill-yellow-500" />
                                            {heroMovie.rating}
                                        </div>
                                    </div>
                                    <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
                                        {heroMovie.title}
                                    </h1>
                                    <p className="text-lg text-gray-400 mb-8 line-clamp-3 max-w-xl leading-relaxed">
                                        {heroMovie.description}
                                    </p>

                                    <div className="flex items-center gap-4">
                                        <button 
                                            onClick={() => {
                                                setActiveMovieId(heroMovie.id);
                                                setActiveType(heroMovie.type);
                                            }}
                                            className="flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full font-bold text-lg transition-transform hover:scale-105"
                                        >
                                            <Play className="w-6 h-6 fill-black" />
                                            Play Movie
                                        </button>
                                        <button 
                                            className="flex items-center gap-2 bg-gray-600/30 text-white px-8 py-4 rounded-full font-bold text-lg backdrop-blur-md border border-gray-400/20 hover:bg-gray-600/50 transition-colors"
                                        >
                                            More Info
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Movies Grid */}
                        <div className="px-8 md:px-16 lg:px-24">
                            <div className="flex items-center gap-3 mb-8">
                                <TrendingUp className="w-6 h-6 text-teal-400" />
                                <h2 className="text-2xl font-bold text-white">Trending Movies</h2>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                                {movies.map((movie, idx) => (
                                    <motion.div 
                                        key={movie.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        onClick={() => {
                                            setActiveMovieId(movie.id);
                                            setActiveType(movie.type);
                                        }}
                                        className="relative group cursor-pointer"
                                    >
                                        <div className="relative aspect-[2/3] rounded-2xl overflow-hidden mb-3 border border-gray-800 shadow-xl">
                                            <img 
                                                src={movie.poster} 
                                                alt={movie.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                                <div className="w-12 h-12 rounded-full bg-teal-500 flex items-center justify-center transform translate-y-4 group-hover:translate-y-0 transition-all mx-auto mb-2 shadow-[0_0_20px_rgba(20,184,166,0.5)]">
                                                    <Play className="w-6 h-6 fill-black text-black ml-1" />
                                                </div>
                                            </div>
                                            {/* Duration badge */}
                                            <div className="absolute top-2 right-2 px-2 py-1 rounded bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-medium text-white flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {movie.duration}
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-white font-semibold text-sm truncate group-hover:text-teal-400 transition-colors">{movie.title}</h3>
                                            <div className="flex gap-2 text-xs text-gray-500 mt-1">
                                                <span>{movie.year}</span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-yellow-500 text-yellow-500" /> {movie.rating}</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
