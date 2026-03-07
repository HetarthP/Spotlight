"use client";

import VideoUploader from "@/components/VideoUploader";
import VideoPlayer from "@/components/VideoPlayer";
import { useState } from "react";

export default function DashboardPage() {
    const [uploadedId, setUploadedId] = useState<string | null>(null);

    return (
        <>
            <div className="page-header">
                <h1>Creator Dashboard</h1>
                <p>Upload your video content and detect 3D ad placement slots.</p>
            </div>

            {/* ── Upload Section ───────────────────── */}
            <section className="card" style={{ marginBottom: "2rem" }}>
                <h2 style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>
                    📤 Upload New Clip
                </h2>
                <VideoUploader
                    onUpload={(publicId: string) => setUploadedId(publicId)}
                />
            </section>

            {/* ── Preview Section ──────────────────── */}
            {uploadedId && (
                <section className="card">
                    <h2 style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>
                        🎬 Preview
                    </h2>
                    <VideoPlayer publicId={uploadedId} />
                    <div className="mt-4 flex gap-4">
                        <button className="btn btn-primary">
                            🧠 Detect Ad Slots (Gemini)
                        </button>
                        <button className="btn btn-secondary">
                            📊 View Placement Map
                        </button>
                    </div>
                </section>
            )}
        </>
    );
}
