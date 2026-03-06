"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadCloud, X, Loader2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

interface FileUploadProps {
    value?: string;
    onChange: (url: string) => void;
    label?: string;
    disabled?: boolean;
    onFileSelect?: (file: File) => Promise<File>;
}

    export function FileUpload({ value, onChange, label = "Upload Image", disabled, onFileSelect }: FileUploadProps) {
    const [isUploading, setIsUploading] = useState(false);

    // Author: Sanket - Use S3 presigned URLs for direct upload (no server proxy)
    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        let file = e.target.files?.[0];
        if (!file) return;

        // Force 500MB Limit (Increased from 5MB)
        const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
        if (file.size > MAX_FILE_SIZE) {
            toast.error("File size exceeds 500MB limit. Please upload a smaller file.");
            e.target.value = "";
            return;
        }

        if (onFileSelect) {
            try {
                file = await onFileSelect(file);
            } catch (error) {
                console.error("File selection cancelled or invalid:", error);
                // Clear the input so the user can try again with a valid file
                e.target.value = ""; 
                return;
            }
        }


        setIsUploading(true);
        try {
            // Check if we should use proxy (if endpoint is http and site is https)
            const isSecure = window.location.protocol === "https:";
            const s3Endpoint = process.env.NEXT_PUBLIC_S3_LOCAL_ENDPOINT || "";
            const useProxy = isSecure && s3Endpoint.startsWith("http://");

            if (useProxy) {
                const formData = new FormData();
                formData.append("file", file);

                const proxyResponse = await fetch("/api/upload/proxy", {
                    method: "POST",
                    body: formData,
                });

                if (!proxyResponse.ok) {
                    const error = await proxyResponse.json();
                    throw new Error(error.error || "Proxy upload failed");
                }

                const { url } = await proxyResponse.json();
                onChange(url);
            } else {
                // Step 1: Get presigned URL from API
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

                const { presignedUrl, publicUrl, contentType } = await presignResponse.json();

                // Step 2: Upload directly to S3 using presigned URL
                const uploadResponse = await fetch(presignedUrl, {
                    method: "PUT",
                    body: file,
                    headers: {
                        "Content-Type": contentType,
                    },
                });

                if (!uploadResponse.ok) {
                    const errorText = await uploadResponse.text();
                    throw new Error(`Upload failed with status ${uploadResponse.status}: ${errorText}`);
                }

                onChange(publicUrl);
            }
            toast.success("File uploaded successfully");
        } catch (error: any) {
            console.error("Upload error:", error);
            toast.error(error.message || "Failed to upload file");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            {value ? (
                <div className="relative w-32 h-32 overflow-hidden rounded-md border">
                    {/* Check if video or image for preview */}
                    {value.match(/\.(mp4|webm|ogg)$/i) ? (
                         <video src={value} className="object-cover w-full h-full" controls />
                    ) : (
                        <Image
                            src={value}
                            alt="Upload"
                            fill
                            className="object-contain"
                        />
                    )}
                    <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute right-2 top-2 h-6 w-6"
                        onClick={() => onChange("")}
                        disabled={disabled}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <div className="flex items-center gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        disabled={disabled || isUploading}
                        className="w-full max-w-[200px]"
                        onClick={() => document.getElementById("file-upload")?.click()}
                    >
                        {isUploading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <UploadCloud className="mr-2 h-4 w-4" />
                        )}
                        {isUploading ? "Uploading..." : label || "Select File"}
                    </Button>
                    <Input
                        id="file-upload"
                        type="file"
                        accept="image/*,video/*,application/pdf"
                        className="hidden"
                        onChange={handleUpload}
                        disabled={disabled || isUploading}
                    />
                </div>
            )}
        </div>
    );
}
