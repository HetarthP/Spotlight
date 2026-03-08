"use client";

import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, Volume1, VolumeX } from "lucide-react";
import { motion } from "framer-motion";
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
}: {
  value: number;
  onChange: (value: number) => void;
  className?: string;
}) => {
  return (
    <motion.div
      className={cn(
        "relative w-full h-1 bg-white/20 rounded-full cursor-pointer",
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
        className="absolute top-0 left-0 h-full bg-white/80 rounded-full"
        style={{ width: `${value}%` }}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />
    </motion.div>
  );
};

const VideoPlayer = React.forwardRef(({
  src,
  markers = [],
  onCanPlay,
  onLoadedMetadata,
  onError,
  onTimeUpdate
}: {
  src: string;
  markers?: { timestamp: number, id: string }[];
  onCanPlay?: () => void;
  onLoadedMetadata?: () => void;
  onError?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
}, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Expose methods to parent components
  React.useImperativeHandle(ref, () => ({
    seekToTimestamp: (seconds: number) => {
      if (videoRef.current) {
        videoRef.current.currentTime = seconds;
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  }));

  const seekToTimestamp = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

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
      const currentPos = videoRef.current.currentTime;
      const totalDur = videoRef.current.duration;
      const progressPercent = (currentPos / totalDur) * 100;

      setProgress(isFinite(progressPercent) ? progressPercent : 0);
      setCurrentTime(currentPos);
      setDuration(isFinite(totalDur) ? totalDur : 0);

      if (onTimeUpdate) {
        onTimeUpdate(currentPos);
      }
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

  return (
    <motion.div
      className="relative w-full max-w-4xl mx-auto rounded-xl overflow-hidden bg-black shadow-[0_0_20px_rgba(0,0,0,0.2)] backdrop-blur-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        onTimeUpdate={handleTimeUpdate}
        onCanPlay={onCanPlay}
        onLoadedMetadata={onLoadedMetadata}
        onError={onError}
        src={src}
        onClick={togglePlay}
      />

      {/* Permanently Visible Controls */}
      <motion.div
        className="absolute bottom-0 mx-auto max-w-xl left-0 right-0 p-4 m-2 bg-[#11111198] backdrop-blur-md rounded-2xl z-40 border border-white/5"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "circInOut", type: "spring" }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-white text-sm tabular-nums">
            {formatTime(currentTime)}
          </span>
          <div className="flex-1 relative">
            <CustomSlider
              value={progress}
              onChange={handleSeek}
              className="w-full"
            />
            {/* Ad Placement Markers (Blue Dots) */}
            {markers.map((marker) => (
              <button
                key={marker.id}
                className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white shadow-[0_0_10px_rgba(59,130,246,1)] z-30 transform hover:scale-150 transition-all duration-200"
                style={{
                  left: `calc(${(marker.timestamp / duration) * 100}% - 5px)`,
                  display: duration > 0 ? 'block' : 'none'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  seekToTimestamp(marker.timestamp);
                }}
                title={`Ad Slot at ${formatTime(marker.timestamp)}`}
              />
            ))}
          </div>
          <span className="text-white text-sm tabular-nums">{formatTime(duration)}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                onClick={togglePlay}
                variant="ghost"
                size="icon"
                className="text-white hover:bg-teal-500/20 hover:text-white"
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>
            </motion.div>
            <div className="flex items-center gap-x-1">
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  onClick={toggleMute}
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-teal-500/20 hover:text-white"
                >
                  {isMuted ? (
                    <VolumeX className="h-5 w-5" />
                  ) : volume > 0.5 ? (
                    <Volume2 className="h-5 w-5" />
                  ) : (
                    <Volume1 className="h-5 w-5" />
                  )}
                </Button>
              </motion.div>
              <div className="w-24">
                <CustomSlider value={volume * 100} onChange={handleVolumeChange} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {[0.5, 1, 1.5, 2].map((speed) => (
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} key={speed}>
                <Button
                  onClick={() => setSpeed(speed)}
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "text-white hover:bg-teal-500/20 hover:text-white text-[10px]",
                    playbackSpeed === speed && "bg-teal-500/30"
                  )}
                >
                  {speed}x
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
});

VideoPlayer.displayName = "VideoPlayer";

export default VideoPlayer;
