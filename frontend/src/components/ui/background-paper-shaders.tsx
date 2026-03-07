"use client";

import { MeshGradient } from "@paper-design/shaders-react";

export function PaperShadersBackground() {
    return (
        <div className="absolute inset-0 w-full h-full bg-black z-0 pointer-events-none opacity-80">
            {/* Base Fluid Mesh */}
            <MeshGradient
                className="w-full h-full absolute inset-0"
                colors={["#000000", "#042f2e", "#0f766e", "#14b8a6"]}
                speed={0.5}
            />

            {/* Fade Out Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none z-10" />
        </div>
    );
}
