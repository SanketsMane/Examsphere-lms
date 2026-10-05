"use client";

import { Uploader } from "@/components/file-uploader/Uploader";
import { toast } from "sonner";
import { useState } from "react";
import { saveVerificationDocument, removeVerificationDocument } from "@/app/actions/teacher-verification";
import { useRouter } from "next/navigation";
import { FileIcon, Trash2, Loader2, LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { constructS3Url } from "@/lib/s3-helper";

interface DocumentUploadProps {
    label: string;
    type: "identity" | "qualification" | "experience";
    existingUrls: string | string[] | null | undefined;
    disabled?: boolean;
}

type FileKind = "pdf" | "image";

export function DocumentUpload({
    label,
    type,
    existingUrls,
    disabled = false,
}: DocumentUploadProps) {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [removingUrl, setRemovingUrl] = useState<string | null>(null);
    // The shared Uploader accepts one MIME family at a time, so the teacher picks PDF or photo.
    const [fileKind, setFileKind] = useState<FileKind>("pdf");

    const urls = Array.isArray(existingUrls)
        ? existingUrls
        : existingUrls
            ? [existingUrls]
            : [];

    const maxFiles = type === "identity" ? 1 : 5;
    const canUpload = !disabled && urls.length < maxFiles;

    // Uploader hands back the S3 key; keys are stored and turned into URLs on read.
    const handleUpload = async (key: string) => {
        if (!key) return;

        setIsSaving(true);
        try {
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

    const handleRemove = async (url: string) => {
        setRemovingUrl(url);
        try {
            const result = await removeVerificationDocument(type, url);
            if (!result?.success) {
                toast.error("Could not remove document");
                return;
            }
            toast.success("Document removed");
            router.refresh();
        } catch (error) {
            toast.error("Could not remove document");
            console.error(error);
        } finally {
            setRemovingUrl(null);
        }
    };

    return (
        <div className="space-y-4">
            {urls.length > 0 && (
                <div className="space-y-2">
                    {urls.map((url) => (
                        <div key={url} className="flex items-center justify-between p-3 bg-muted rounded-md border">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <FileIcon className="h-4 w-4 shrink-0" />
                                <span className="text-sm truncate max-w-[200px]">{url.split('/').pop() || url}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm" asChild>
                                    <a href={constructS3Url(url)} target="_blank" rel="noreferrer" aria-label={`View ${label}`}>
                                        <LinkIcon className="h-4 w-4" />
                                    </a>
                                </Button>
                                {!disabled && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemove(url)}
                                        disabled={removingUrl === url}
                                        aria-label={type === "identity" ? "Remove to replace document" : "Remove document"}
                                    >
                                        {removingUrl === url
                                            ? <Loader2 className="h-4 w-4 animate-spin" />
                                            : <Trash2 className="h-4 w-4 text-destructive" />}
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                    {type === "identity" && !disabled && (
                        <p className="text-xs text-muted-foreground">To replace your ID, remove it and upload a new one.</p>
                    )}
                </div>
            )}

            {canUpload && (
                <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">File type:</span>
                        <Button
                            type="button"
                            size="sm"
                            variant={fileKind === "pdf" ? "default" : "outline"}
                            onClick={() => setFileKind("pdf")}
                        >
                            PDF
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant={fileKind === "image" ? "default" : "outline"}
                            onClick={() => setFileKind("image")}
                        >
                            Photo (JPG/PNG)
                        </Button>
                    </div>
                    <Uploader
                        key={fileKind}
                        fileTypeAccepted={fileKind}
                        onChange={handleUpload}
                    />
                    {isSaving && (
                        <p className="flex items-center text-xs text-muted-foreground">
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Saving document...
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
