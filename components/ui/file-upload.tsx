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

    // Author: Sanket - Use S3 presigned URLs for direct upload (no server proxy, no size limits)
    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        let file = e.target.files?.[0];
        if (!file) return;

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
            // Step 1: Get presigned URL from API
            const presignResponse = await fetch("/api/s3/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fileName: file.name,
                    contentType: file.type,
                    size: file.size,
                    isImage: true,
                }),
            });

            if (!presignResponse.ok) {
                const error = await presignResponse.json();
                throw new Error(error.error || "Failed to get upload URL");
            }

            const { presignedUrl, key, contentType } = await presignResponse.json();

            // Step 2: Upload directly to S3 using presigned URL
            // IMPORTANT: Use the contentType from API response to match presigned URL signature
            const uploadResponse = await fetch(presignedUrl, {
                method: "PUT",
                body: file,
                headers: {
                    "Content-Type": contentType, // Use exact contentType from API
                },
            });

            if (!uploadResponse.ok) {
                // Log the actual S3 error for debugging
                const errorText = await uploadResponse.text();
                console.error("S3 Upload Error:", {
                    status: uploadResponse.status,
                    statusText: uploadResponse.statusText,
                    body: errorText,
                    headers: Object.fromEntries(uploadResponse.headers.entries())
                });
                throw new Error(`Upload failed with status ${uploadResponse.status}: ${errorText}`);
            }

            // Construct the S3 URL from the key
            const s3Url = `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES}.s3.${process.env.NEXT_PUBLIC_AWS_REGION || 'eu-north-1'}.amazonaws.com/${key}`;
            onChange(s3Url);
            toast.success("Image uploaded successfully");
        } catch (error: any) {
            console.error("Upload error:", error);
            toast.error(error.message || "Failed to upload image");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            {value ? (
                <div className="relative aspect-video w-full max-w-[200px] overflow-hidden rounded-md border">
                    <Image
                        src={value}
                        alt="Upload"
                        fill
                        className="object-cover"
                    />
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
                        {isUploading ? "Uploading..." : "Select Image"}
                    </Button>
                    <Input
                        id="file-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleUpload}
                        disabled={disabled || isUploading}
                    />
                </div>
            )}
        </div>
    );
}
