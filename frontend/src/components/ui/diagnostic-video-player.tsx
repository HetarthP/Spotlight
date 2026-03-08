"use client";

import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, Volume1, VolumeX, Maximize, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import { cn } from "@/lib/utils";

const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const CustomSlider = ({
    value,
    onChange,
    className,
    isEditing = false,
    showPlacement = false,
    placementStartPct,
    placementWidthPct,
    onPlacementClick,
}: {
    value: number;
    onChange: (value: number) => void;
    className?: string;
    isEditing?: boolean;
    showPlacement?: boolean;
    placementStartPct?: number;
    placementWidthPct?: number;
    onPlacementClick?: () => void;
}) => {
    return (
        <motion.div
            className={cn(
                "relative w-full h-1.5 bg-white/20 rounded-full cursor-pointer hover:h-2 transition-all",
                isEditing && "animate-pulse shadow-[0_0_15px_rgba(45,212,191,0.5)] bg-teal-900/40",
                className
            )}
            onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const percentage = (x / rect.width) * 100;
                onChange(Math.min(Math.max(percentage, 0), 100));
            }}
        >
            <motion.div
                className={cn("absolute top-0 left-0 h-full rounded-full z-10", isEditing ? "bg-teal-400" : "bg-white")}
                style={{ width: `${value}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />

            {/* Placement Bar Sync - REMOVED for clean diagnostic view */}
        </motion.div>
    );
};

export type DiagnosticVideoPlayerRef = {
    seekToTime: (time: number) => void;
};

const DiagnosticVideoPlayer = React.forwardRef<DiagnosticVideoPlayerRef, {
    src: string;
    placementStart?: number;
    placementEnd?: number;
    onTimeUpdate?: (time: number) => void;
    onCanPlay?: () => void;
    onLoadedMetadata?: () => void;
    onError?: () => void;
    markers?: Array<{ timestamp: number; id: string }>;
}>(({
    src,
    placementStart,
    placementEnd,
    onTimeUpdate,
    onCanPlay,
    onLoadedMetadata,
    onError,
    markers = []
}, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(1);
    const [progress, setProgress] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [showControls, setShowControls] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const [isEditing, setIsEditing] = useState(true);
    const [showPlacement, setShowPlacement] = useState(false);

    const GREEN_DOT_TIMESTAMPS = [5, 264, 434]; // 0:05, 4:24, 7:14

    React.useImperativeHandle(ref, () => ({
        seekToTime: (time: number) => {
            handleSeekToTime(time);
        }
    }));

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.muted = true;
            setIsMuted(true);
            videoRef.current.play().then(() => setIsPlaying(true)).catch(() => { });
        }

        const timer = setTimeout(() => {
            setIsEditing(false);
            setShowPlacement(true);
        }, 10000);

        return () => clearTimeout(timer);
    }, []);

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleVolumeChange = (value: number) => {
        if (videoRef.current) {
            const newVolume = value / 100;
            videoRef.current.volume = newVolume;
            setVolume(newVolume);
            setIsMuted(newVolume === 0);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const progress =
                (videoRef.current.currentTime / videoRef.current.duration) * 100;
            setProgress(isFinite(progress) ? progress : 0);
            setCurrentTime(videoRef.current.currentTime);
            setDuration(videoRef.current.duration);
            onTimeUpdate?.(videoRef.current.currentTime);
        }
    };

    const handleSeek = (value: number) => {
        if (videoRef.current && videoRef.current.duration) {
            const time = (value / 100) * videoRef.current.duration;
            if (isFinite(time)) {
                videoRef.current.currentTime = time;
                setProgress(value);
            }
        }
    };

    const handleSeekToTime = (timeInSeconds: number) => {
        if (videoRef.current && videoRef.current.duration) {
            const safeTime = Math.max(0, Math.min(timeInSeconds, videoRef.current.duration));
            videoRef.current.currentTime = safeTime;
            setProgress((safeTime / videoRef.current.duration) * 100);
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
            if (!isMuted) {
                setVolume(0);
            } else {
                setVolume(1);
                videoRef.current.volume = 1;
            }
        }
    };

    const setSpeed = (speed: number) => {
        if (videoRef.current) {
            videoRef.current.playbackRate = speed;
            setPlaybackSpeed(speed);
        }
    };

    const toggleFullscreen = () => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch((err) => {
                console.error("Error attempting to enable fullscreen:", err);
            });
        } else {
            document.exitFullscreen();
        }
    };

    return (
        <motion.div
            ref={containerRef}
            className="relative w-full mx-auto aspect-video rounded-2xl overflow-hidden bg-[#11111198] shadow-[0_0_20px_rgba(0,0,0,0.2)] backdrop-blur-sm flex items-center justify-center group/player"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
        >
            <video
                ref={videoRef}
                className="w-full"
                onTimeUpdate={handleTimeUpdate}
                onCanPlay={onCanPlay}
                onLoadedMetadata={onLoadedMetadata}
                onError={onError}
                src={src}
                onClick={togglePlay}
            />

            {/* AI Placement Button - REMOVED for clean diagnostic view */}

            {/* ALWAYS VISIBLE TIMELINE */}
            <div className="absolute inset-x-0 bottom-0 p-6 z-40 bg-gradient-to-t from-black/90 via-black/40 to-transparent pt-12">
                <div className="flex items-center gap-4 mb-2">
                    <span className="text-white text-[10px] font-mono w-10 opacity-70">
                        {formatTime(currentTime)}
                    </span>
                    <div className="relative flex-1 h-1.5 flex items-center">
                        <CustomSlider
                            value={progress}
                            onChange={handleSeek}
                            className="flex-1"
                            isEditing={isEditing}
                            showPlacement={showPlacement}
                            placementStartPct={placementStart !== undefined ? (placementStart / (duration || 1)) * 100 : undefined}
                            placementWidthPct={placementStart !== undefined && placementEnd !== undefined ? ((placementEnd - placementStart) / (duration || 1)) * 100 : undefined}
                        />

                        {/* Green Dots for Strategic Slots */}
                        {duration > 0 && GREEN_DOT_TIMESTAMPS.map((ts, idx) => {
                            const pct = (ts / duration) * 100;
                            return (
                                <div
                                    key={idx}
                                    className="absolute w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.9)] border-2 border-white z-20 -ml-1.5 cursor-pointer hover:scale-150 transition-transform"
                                    style={{ left: `${pct}%` }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSeekToTime(ts);
                                    }}
                                >
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-emerald-600 text-[9px] font-bold text-white px-1.5 py-0.5 rounded opacity-0 group-hover/player:opacity-100 transition-opacity whitespace-nowrap">
                                        SLOT {idx + 1}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <span className="text-white text-[10px] font-mono w-10 text-right opacity-70">{formatTime(duration)}</span>
                </div>
            </div>

            <AnimatePresence>
                {showControls && (
                    <motion.div
                        className="absolute bottom-20 mx-auto w-fit px-6 py-3 bg-[#0a0a0aee] backdrop-blur-xl rounded-2xl border border-white/10 shadow-3xl z-50"
                        initial={{ y: 20, opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 20, opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.4, ease: "circOut" }}
                    >
                        <div className="flex items-center justify-center gap-8">
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={togglePlay}
                                className="text-white hover:text-emerald-400 transition-colors"
                            >
                                {isPlaying ? <Pause className="h-6 w-6 fill-current" /> : <Play className="h-6 w-6 fill-current" />}
                            </motion.button>

                            <div className="flex items-center gap-3">
                                <button onClick={toggleMute} className="text-white/70 hover:text-white transition-colors">
                                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                                </button>
                                <div className="w-20">
                                    <CustomSlider value={volume * 100} onChange={handleVolumeChange} />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {[0.5, 1, 1.5, 2].map((speed) => (
                                    <button
                                        key={speed}
                                        onClick={() => setSpeed(speed)}
                                        className={cn(
                                            "text-[10px] font-bold px-2 py-1 rounded-md transition-all",
                                            playbackSpeed === speed ? "bg-emerald-500 text-black" : "text-white/50 hover:text-white"
                                        )}
                                    >
                                        {speed}x
                                    </button>
                                ))}
                            </div>

                            <button onClick={toggleFullscreen} className="text-white/70 hover:text-white transition-colors">
                                <Maximize className="h-4 w-4" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
});

DiagnosticVideoPlayer.displayName = "DiagnosticVideoPlayer";

export default DiagnosticVideoPlayer;
