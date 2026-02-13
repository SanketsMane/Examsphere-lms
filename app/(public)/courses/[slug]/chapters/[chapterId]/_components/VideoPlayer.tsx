"use client";

import { Loader2, Lock } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { constructS3Url } from "@/lib/s3-helper";

interface VideoPlayerProps {
    videoKey?: string | null;
    videoUrl?: string | null;
    title: string;
    isLocked?: boolean;
    onEnded?: () => void;
    autoPlay?: boolean;
}

export function VideoPlayer({
    videoKey,
    videoUrl,
    title,
    isLocked = false,
    onEnded,
    autoPlay = false,
}: VideoPlayerProps) {
    const [isReady, setIsReady] = useState(false);

    // Determine source
    // If videoKey exists, it could be either:
    // 1. UploadThing key (starts with specific pattern)
    // 2. S3 key (UUID-like pattern)
    // If videoUrl exists (External/Vimeo/Youtube), use it

    let sourceUrl: string | null = null;
    
    if (videoKey) {
        // Check if it's an UploadThing key (typically shorter, alphanumeric)
        if (videoKey.length < 40 && !videoKey.includes('-')) {
            sourceUrl = `https://utfs.io/f/${videoKey}`;
        } else {
            // Assume it's an S3 key
            sourceUrl = constructS3Url(videoKey);
        }
    } else if (videoUrl) {
        sourceUrl = videoUrl;
    }

    if (isLocked) {
        return (
            <div className="relative aspect-video bg-slate-900 flex flex-col items-center justify-center text-secondary gap-4 rounded-xl overflow-hidden">
                <Lock className="h-12 w-12" />
                <p className="text-sm font-medium">This lesson is locked.</p>
            </div>
        );
    }

    if (!sourceUrl) {
        return (
            <div className="relative aspect-video bg-slate-900 flex flex-col items-center justify-center text-secondary gap-4 rounded-xl overflow-hidden text-white/50">
                No video available for this lesson.
            </div>
        )
    }

    return (
        <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 shadow-xl">
            {!isReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10">
                    <Loader2 className="h-8 w-8 animate-spin text-secondary" />
                </div>
            )}

            {/* Standard HTML5 Video for UploadThing/S3/MP4 */}
            <video
                src={sourceUrl}
                className={cn("w-full h-full", !isReady && "opacity-0")}
                controls
                autoPlay={autoPlay}
                preload="metadata"
                playsInline
                crossOrigin="anonymous"
                onLoadedData={() => setIsReady(true)}
                onEnded={onEnded}
            />
        </div>
    );
}
