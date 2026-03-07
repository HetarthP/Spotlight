"use client";

import { CldVideoPlayer } from "next-cloudinary";
import "next-cloudinary/dist/cld-video-player.css";

interface VideoPlayerProps {
    publicId: string;
    transformations?: object;
}

/**
 * Wraps <CldVideoPlayer /> for streaming processed videos.
 * Requirement 5: All display passes through this component.
 */
export default function VideoPlayer({
    publicId,
    transformations,
}: VideoPlayerProps) {
    return (
        <div style={{ borderRadius: "var(--radius)", overflow: "hidden" }}>
            <CldVideoPlayer
                id={`vpp-player-${publicId}`}
                width="1920"
                height="1080"
                src={publicId}
                colors={{
                    accent: "#6c63ff",
                    base: "#0a0a0f",
                    text: "#f0f0f5",
                }}
                {...transformations}
            />
        </div>
    );
}
