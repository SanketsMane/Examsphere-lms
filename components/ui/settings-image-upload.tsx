"use client";

import { useRef } from "react";
import { UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { constructS3Url } from "@/lib/s3-helper";

interface SettingsImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
}

export function SettingsImageUpload({ value, onChange, label = "Image" }: SettingsImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUri = ev.target?.result as string;
      onChange(dataUri);
    };
    reader.readAsDataURL(file);

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
