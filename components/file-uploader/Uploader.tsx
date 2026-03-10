"use client";

import { useCallback, useEffect, useState } from "react";
import { FileRejection, useDropzone } from "react-dropzone";
import { Card, CardContent } from "../ui/card";
import { cn } from "@/lib/utils";
import {
  RenderEmptyState,
  RenderErrorState,
  RenderUploadedState,
  RenderUploadingState,
} from "./RenderState";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { useConstructUrl } from "@/hooks/use-construct-url";

interface UploaderState {
  id: string | null;
  file: File | null;
  uploading: boolean;
  progress: number;
  key?: string;
  isDeleting: boolean;
  error: boolean;
  objectUrl?: string;
  fileType: "image" | "video" | "pdf";
}

interface iAppProps {
  value?: string;
  onChange?: (value: string) => void;
  fileTypeAccepted: "image" | "video" | "pdf";
}

export function Uploader({ onChange, value, fileTypeAccepted }: iAppProps) {
  const fileUrl = useConstructUrl(value || "");
  const [fileState, setFileState] = useState<UploaderState>({
    error: false,
    file: null,
    id: null,
    uploading: false,
    progress: 0,
    isDeleting: false,
    fileType: fileTypeAccepted,
    key: value,
    objectUrl: value ? fileUrl : undefined,
  });

  const uploadFile = useCallback(
    async (file: File) => {
      setFileState((prev) => ({
        ...prev,
        uploading: true,
        progress: 0,
      }));

      // Author: Sanket - Real S3 upload using presigned URLs or Proxy for insecure endpoints
      try {
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

          const { key } = await proxyResponse.json();
          setFileState((prev) => ({
            ...prev,
            progress: 100,
            uploading: false,
            key: key,
          }));
          onChange?.(key);
        } else {
          // Step 1: Get presigned URL from our API
          setFileState((prev) => ({ ...prev, progress: 10 }));

          const presignResponse = await fetch("/api/s3/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileName: file.name,
              contentType: file.type,
              size: file.size,
              isImage: fileTypeAccepted === "image",
            }),
          });

          if (!presignResponse.ok) {
            const error = await presignResponse.json();
            throw new Error(error.error || "Failed to get upload URL");
          }

          const { presignedUrl, key, contentType } = await presignResponse.json();
          setFileState((prev) => ({ ...prev, progress: 20 }));

          // Step 2: Upload file directly to S3 using presigned URL
          const uploadResponse = await fetch(presignedUrl, {
            method: "PUT",
            body: file,
            headers: {
              "Content-Type": contentType,
            },
          });

          if (!uploadResponse.ok) {
            throw new Error(`S3 upload failed with status ${uploadResponse.status}`);
          }

          setFileState((prev) => ({
            ...prev,
            progress: 100,
            uploading: false,
            key: key,
          }));

          // Return the S3 key (not the full URL) to maintain consistency - Author: Sanket
          onChange?.(key);
        }
        toast.success("File uploaded successfully");
      } catch (error) {
        console.error("Upload error:", error);
        toast.error(error instanceof Error ? error.message : "Upload failed");
        setFileState((prev) => ({
          ...prev,
          uploading: false,
          progress: 0,
          error: true,
        }));
      }
    },
    [fileTypeAccepted, onChange]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];

        if (fileState.objectUrl && !fileState.objectUrl.startsWith("http")) {
          URL.revokeObjectURL(fileState.objectUrl);
        }
        setFileState({
          file: file,
          uploading: false,
          progress: 0,
          objectUrl: URL.createObjectURL(file), // Create object URL for preview (PDFs work too for iframe/embed or icon)
          error: false,
          id: uuidv4(),
          isDeleting: false,
          fileType: fileTypeAccepted,
        });

        uploadFile(file);
      }
    },
    [fileState.objectUrl, uploadFile, fileTypeAccepted]
  );

  async function handleRemoveFile() {
    if (fileState.isDeleting || !fileState.objectUrl) return;

    try {
      setFileState((prev) => ({
        ...prev,
        isDeleting: true,
      }));

      const response = await fetch("/api/s3/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: fileState.key,
        }),
      });

      if (!response.ok) {
        toast.error("Failed to remove file from storage");

        setFileState((prev) => ({
          ...prev,
          isDeleting: true,
          error: true,
        }));

        return;
      }

      if (fileState.objectUrl && !fileState.objectUrl.startsWith("http")) {
        URL.revokeObjectURL(fileState.objectUrl);
      }

      onChange?.("");

      setFileState(() => ({
        file: null,
        uploading: false,
        progress: 0,
        objectUrl: undefined,
        error: false,
        fileType: fileTypeAccepted,
        id: null,
        isDeleting: false,
      }));

      toast.success("File removed successfully");
    } catch {
      toast.error("Error removing file. please try again");

      setFileState((prev) => ({
        ...prev,
        isDeleting: false,
        error: true,
      }));
    }
  }

  function rejectedFiles(fileRejection: FileRejection[]) {
    if (fileRejection.length) {
      const tooManyFiles = fileRejection.find(
        (rejection) => rejection.errors[0].code === "too-many-files"
      );

      const fileSizeToBig = fileRejection.find(
        (rejection) => rejection.errors[0].code === "file-too-large"
      );

      if (fileSizeToBig) {
        toast.error("File Size exceeds the limit");
      }

      if (tooManyFiles) {
        toast.error("Too many files selected, max is 1");
      }
    }
  }

  function renderContent() {
    if (fileState.uploading) {
      return (
        <RenderUploadingState
          file={fileState.file as File}
          progress={fileState.progress}
        />
      );
    }

    if (fileState.error) {
      return <RenderErrorState />;
    }

    if (fileState.objectUrl) {
      return (
        <RenderUploadedState
          handleRemoveFile={handleRemoveFile}
          previewUrl={fileState.objectUrl}
          isDeleting={fileState.isDeleting}
          fileType={fileState.fileType}
        />
      );
    }

    return <RenderEmptyState isDragActive={isDragActive} />;
  }

  useEffect(() => {
    return () => {
      if (fileState.objectUrl && !fileState.objectUrl.startsWith("http")) {
        URL.revokeObjectURL(fileState.objectUrl);
      }
    };
  }, [fileState.objectUrl]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept:
      fileTypeAccepted === "video"
        ? { "video/*": [] }
        : fileTypeAccepted === "pdf"
          ? { "application/pdf": [] }
          : { "image/*": [] },
    maxFiles: 1,
    multiple: false,
    maxSize:
      fileTypeAccepted === "image" ? 5 * 1024 * 1024 :
        fileTypeAccepted === "pdf" ? 10 * 1024 * 1024 : // 10MB for PDFs
          5000 * 1024 * 1024, // 5GB for Videos
    onDropRejected: rejectedFiles,
    disabled: fileState.uploading,
  });
  return (
    <Card
      {...getRootProps()}
      className={cn(
        "relative border-2 border-dashed transition-colors duration-200 ease-in-out w-full h-64",
        isDragActive
          ? "border-primary bg-primary/10 border-solid"
          : "border-border hover:border-primary"
      )}
    >
      <CardContent className="flex items-center justify-center h-full w-full p-4">
        <input {...getInputProps()} />
        {renderContent()}
      </CardContent>
    </Card>
  );
}

