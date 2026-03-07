"use client";

import { CldUploadWidget } from "next-cloudinary";

interface VideoUploaderProps {
    onUpload: (publicId: string) => void;
}

/**
 * Wraps the Cloudinary UploadWidget for video ingestion.
 * Requirement: All creator uploads go through this widget.
 */
export default function VideoUploader({ onUpload }: VideoUploaderProps) {
    return (
        <CldUploadWidget
            uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "vpp_unsigned"}
            options={{
                sources: ["local", "url", "camera"],
                resourceType: "video",
                maxFileSize: 500_000_000, // 500 MB
                clientAllowedFormats: ["mp4", "mov", "avi", "webm"],
            }}
            onSuccess={(result: any) => {
                if (result?.info?.public_id) {
                    onUpload(result.info.public_id);
                }
            }}
        >
            {({ open }) => (
                <div className="upload-zone" onClick={() => open()}>
                    <p style={{ fontSize: "2rem" }}>🎞️</p>
                    <p>
                        <strong>Click to upload</strong> or drag and drop
                    </p>
                    <p style={{ fontSize: "0.75rem" }}>
                        MP4, MOV, AVI, WebM · Max 500 MB
                    </p>
                </div>
            )}
        </CldUploadWidget>
    );
}
