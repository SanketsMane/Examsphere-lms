"use client";

import { useRef } from "react";
import { UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { constructS3Url } from "@/lib/s3-helper";
import { toast } from "sonner";

interface SettingsImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
}

// Compress image: resize to max 1200x1200, quality 0.8, returns base64
async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const maxSize = 1200;
      let width = img.width;
      let height = img.height;

      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      const dataUri = canvas.toDataURL("image/webp", 0.8);
      resolve(dataUri);
    };
    img.onerror = () => reject(new Error("Could not load image"));
  });
}

export function SettingsImageUpload({ value, onChange, label = "Image" }: SettingsImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit file size to 2MB before compression
    if (file.size > 2 * 1024 * 1024) {
      toast.error(`File too large. Max 2MB, got ${(file.size / 1024 / 1024).toFixed(1)}MB.`);
      e.target.value = "";
      return;
    }

    try {
      const compressedUri = await compressImage(file);
      
      // Warn if result is still large
      if (compressedUri.length > 5 * 1024 * 1024) {
        toast.warning("Image compressed but base64 is still large. Settings save may be slow.");
      }
      
      onChange(compressedUri);
      toast.success("Image uploaded and compressed");
    } catch (error) {
      toast.error(`Failed to process image: ${error instanceof Error ? error.message : "Unknown error"}`);
    }

    // Reset input so the same file can be re-selected later
    e.target.value = "";
  };

  const previewSrc = value ? constructS3Url(value) : null;

  return (
    <div className="space-y-2">
      {previewSrc && (
        <div className="relative inline-block">
          <div className="relative w-32 h-20 overflow-hidden rounded border bg-muted flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewSrc} alt={label} className="w-full h-full object-contain" />
          </div>
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5 hover:opacity-80"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
      >
        <UploadCloud className="h-4 w-4 mr-2" />
        {value ? `Change ${label}` : `Upload ${label}`}
      </Button>
    </div>
  );
}
