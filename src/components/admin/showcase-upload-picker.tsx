"use client";

import { useRef } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

// The file goes straight from the browser to storage.
export function ShowcaseUploadPicker({
  progress,
  onFile,
}: {
  /** 0–100 while uploading, null when idle. */
  progress: number | null;
  onFile: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  if (progress !== null) {
    return (
      <div className="flex h-80 flex-col items-center justify-center gap-3 rounded-lg border border-border p-6">
        <p className="text-sm font-medium">Uploading… {progress}%</p>
        <Progress value={progress} className="w-full max-w-xs" aria-label="Upload progress" />
      </div>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => inputRef.current?.click()}
        className="h-80 w-full flex-col gap-2 border-dashed border-primary/40 text-primary hover:bg-primary/5"
      >
        <Upload className="size-5" strokeWidth={1.5} />
        <span className="text-sm font-semibold">Choose a video</span>
        <span className="text-xs font-normal text-muted-foreground">MP4, up to 300 MB</span>
      </Button>
      <Input
        ref={inputRef}
        type="file"
        accept="video/mp4"
        className="hidden"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
    </>
  );
}
