"use client";

import { Uploader } from "@/components/file-uploader/Uploader";
import { toast } from "sonner";
import { useState } from "react";
import { saveVerificationDocument } from "@/app/actions/teacher-verification";
import { useRouter } from "next/navigation";
import { FileIcon, Trash2, Loader2, LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { constructS3Url } from "@/lib/s3-helper";

interface DocumentUploadProps {
    label: string;
    type: "identity" | "qualification" | "experience";
    existingUrls: string | string[] | null | undefined;
    acceptedFileTypes: "image" | "pdf";
}

export function DocumentUpload({
    label,
    type,
    existingUrls,
    acceptedFileTypes,
}: DocumentUploadProps) {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);

    // Normalize existing URLs to array for consistent rendering
    const urls = Array.isArray(existingUrls)
        ? existingUrls
        : existingUrls
            ? [existingUrls]
            : [];

    // For 'identity', we typically only want ONE file.
    // For others, we might accept multiple.
    // Uploader component handles single file upload per instance.
    // So we show Uploader if we haven't reached max files.

    const maxFiles = type === "identity" ? 1 : 5;
    const canUpload = urls.length < maxFiles;

    const handleUpload = async (key: string) => {
        if (!key) return; // Empty string usually means removal in Uploader, but we handle it separately

        setIsSaving(true);
        try {
            // Key is from Uploader (which calls /api/s3/upload), so it is a partial key or full key? 
            // The Uploader returns "key". The existing code constructs URL: 
            // `https://${env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES}.fly.storage.tigris.dev/${uniqueKey}`
            // But for PDF (via s3/upload endpoint), it returns "key".
            // We should probably save the FULL URL in DB if that's what we do.
            // But let's check what Uploader onChange receives.
            // In Uploader.tsx: onChange?.(key);

            // If we look at `saveVerificationDocument` in actions, it takes `urls`.
            // We should probably convert `key` to `URL` before saving if the existing logic expects URLs.
            // Or we should update the `useConstructUrl` hook dependency?

            // Let's assume we save the Key and reconstruct URL on read, OR we save the full URL.
            // `api/upload/proxy` returns `url` too. `api/s3/upload` returns `key`.
            // Let's handle this by just saving the KEY in the DB if that's the convention, OR 
            // check `Uploader.tsx`. 

            // Re-reading Uploader.tsx:
            // const fileUrl = useConstructUrl(value || ""); // this suggests `value` is a KEY.

            // So we should save the KEY.

            await saveVerificationDocument(type, key);
            toast.success("Document saved successfully");
            router.refresh();
        } catch (error) {
            toast.error("Failed to save document");
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    // Uploader's onChange is called with the KEY when upload is done.
    // If we pass `onChange={handleUpload}`, it will save the new key.

    return (
        <div className="space-y-4">
            {/* Existing Files List */}
            {urls.length > 0 && (
                <div className="space-y-2">
                    {urls.map((url, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-md border">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <FileIcon className="h-4 w-4 shrink-0" />
                                <span className="text-sm truncate max-w-[200px]">{url.split('/').pop() || url}</span>
                            </div>
                            {/* For now, removal is tricky if we don't have a removal action or if we use local state.
                        We added `removeVerificationDocument` logic? Not yet. 
                        Let's just show them for now. If we need remove, we need that action.
                    */}
                            <Button variant="ghost" size="sm" asChild>
                                <a href={constructS3Url(url)} target="_blank" rel="noreferrer">
                                    <LinkIcon className="h-4 w-4" />
                                </a>
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            {canUpload && (
                <div className="mt-2">
                    <Uploader
                        fileTypeAccepted={acceptedFileTypes === "image" ? "image" : "pdf"}
                        onChange={handleUpload}
                    />
                </div>
            )}
        </div>
    );
}
