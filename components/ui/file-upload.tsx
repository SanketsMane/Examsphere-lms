"use client";

import { useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { UploadCloud, X, Loader2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { constructS3Url } from "@/lib/s3-helper";
import { cn } from "@/lib/utils";

interface FileUploadProps {
    value?: string;
    onChange: (url: string) => void;
    label?: string;
    disabled?: boolean;
    onFileSelect?: (file: File) => Promise<File>;
}

/**
 * Author: Sanket
 * Uses HTML-native label[for] → input[id] connection so the browser
 * directly opens the correct file picker — no JS click() calls needed.
 * Each instance gets a unique stable ID via useRef.
 */
export function FileUpload({ value, onChange, label = "Upload Image", disabled, onFileSelect }: FileUploadProps) {
    const [isUploading, setIsUploading] = useState(false);

    // Generate a stable unique ID for the input so the label[for] can target it precisely.
    // useRef ensures the ID never changes across re-renders - Author: Sanket
    const inputId = useRef<string>(`fu-${Math.random().toString(36).slice(2, 10)}`);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        let file = e.target.files?.[0];
        if (!file) return;

        // Force 500MB Limit - Author: Sanket
        const MAX_FILE_SIZE = 500 * 1024 * 1024;
        if (file.size > MAX_FILE_SIZE) {
            toast.error("File size exceeds 500MB limit. Please upload a smaller file.");
            e.target.value = "";
            return;
        }

        if (onFileSelect) {
            try {
                file = await onFileSelect(file);
            } catch (error) {
                // Validation failed — clear the input and abort silently (caller shows toast)
                e.target.value = "";
                return;
            }
        }

        setIsUploading(true);
        try {
            const isSecure = window.location.protocol === "https:";
            const s3Endpoint = process.env.NEXT_PUBLIC_S3_LOCAL_ENDPOINT || "";
            const useProxy = isSecure && s3Endpoint.startsWith("http://");

            if (useProxy) {
                const formData = new FormData();
                formData.append("file", file);
                const proxyResponse = await fetch("/api/upload/proxy", { method: "POST", body: formData });
                if (!proxyResponse.ok) {
                    const error = await proxyResponse.json();
                    throw new Error(error.error || "Proxy upload failed");
                }
                const { key } = await proxyResponse.json();
                onChange(key);
            } else {
                // Get presigned URL from API - Author: Sanket
                const presignResponse = await fetch("/api/s3/upload", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        fileName: file.name,
                        contentType: file.type,
                        size: file.size,
                        isImage: file.type.startsWith("image/"),
                    }),
                });
                if (!presignResponse.ok) {
                    const error = await presignResponse.json();
                    throw new Error(error.error || "Failed to get upload URL");
                }
                const { presignedUrl, key, contentType } = await presignResponse.json();

                // Upload directly to S3 using presigned URL - Author: Sanket
                const uploadResponse = await fetch(presignedUrl, {
                    method: "PUT",
                    body: file,
                    headers: { "Content-Type": contentType },
                });
                if (!uploadResponse.ok) {
                    const errorText = await uploadResponse.text();
                    throw new Error(`Upload failed with status ${uploadResponse.status}: ${errorText}`);
                }
                onChange(key);
            }
            toast.success("File uploaded successfully");
        } catch (error: any) {
            console.error("Upload error:", error);
            toast.error(error.message || "Failed to upload file");
        } finally {
            setIsUploading(false);
        }
    };

    const buttonLabel = isUploading ? "Uploading..." : (value ? `Replace ${label}` : (label || "Select File"));

    return (
        <div className="space-y-2">
            <Label>{label}</Label>

            {/* Image / Video preview — Author: Sanket */}
            {value && (
                <div className="relative w-32 h-24 overflow-hidden rounded-md border">
                    {value.match(/\.(mp4|webm|ogg)$/i) ? (
                        <video src={constructS3Url(value)} className="object-cover w-full h-full" controls />
                    ) : (
                        <Image src={constructS3Url(value)} alt="Preview" fill className="object-contain" />
                    )}
                    <button
                        type="button"
                        className="absolute right-1 top-1 h-5 w-5 rounded-sm bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90"
                        onClick={() => onChange("")}
                        disabled={disabled}
                        aria-label="Remove file"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </div>
            )}

            {/* Upload button implemented as a styled label — clicking it opens the correct file picker
                via the browser's native label[for] mechanism. No JS click() needed. - Author: Sanket */}
            <label
                htmlFor={inputId.current}
                className={cn(
                    "inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors cursor-pointer",
                    "hover:bg-accent hover:text-accent-foreground",
                    (disabled || isUploading) && "pointer-events-none opacity-50 cursor-not-allowed"
                )}
            >
                {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <UploadCloud className="h-4 w-4" />
                )}
                {buttonLabel}
            </label>

            {/* Hidden native file input — ID matches label[for] above - Author: Sanket */}
            <input
                id={inputId.current}
                type="file"
                accept="image/*,video/*,application/pdf"
                className="hidden"
                onChange={handleUpload}
                disabled={disabled || isUploading}
            />
        </div>
    );
}
