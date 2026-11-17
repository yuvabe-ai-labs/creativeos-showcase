"use client";

import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  createShowcaseReelAction,
  discardShowcaseDraftAction,
  prepareShowcaseUploadAction,
} from "@/lib/actions/showcase";
import { SHOWCASE_VIDEO_MAX_BYTES } from "@/lib/showcase/constants";
import type { ShowcaseCategory } from "@/lib/showcase/types";
import { putWithProgress } from "@/lib/uploads/put";
import { ShowcaseReelForm } from "./showcase-reel-form";
import { ShowcaseUploadPicker } from "./showcase-upload-picker";

type Draft = {
  reelId: string;
  videoPath: string;
  /** The local file, so the cover frame can be read back without a round trip. */
  videoSrc: string;
};

// Two steps: upload the video, then title it. The video is already stored after step one,
// so closing the dialog before saving cleans it up.
export function AddShowcaseReelDialog({ categories }: { categories: ShowcaseCategory[] }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const extra = useRef<{ durationMs: number | null; posterPaths: string[] }>({ durationMs: null, posterPaths: [] });

  function reset(discard: boolean) {
    if (discard && draft) {
      void discardShowcaseDraftAction({ reelId: draft.reelId, paths: [draft.videoPath, ...extra.current.posterPaths] });
    }
    if (draft) URL.revokeObjectURL(draft.videoSrc);
    setDraft(null);
    setProgress(null);
    extra.current = { durationMs: null, posterPaths: [] };
  }

  async function upload(file: File) {
    if (file.type !== "video/mp4") return void toast.error("Upload an MP4 video.");
    if (file.size > SHOWCASE_VIDEO_MAX_BYTES) return void toast.error("This video is over 300 MB. Export a smaller copy.");
    setProgress(0);
    const res = await prepareShowcaseUploadAction({ contentType: file.type, sizeBytes: file.size });
    if (!res.ok) {
      setProgress(null);
      return void toast.error(res.error);
    }
    const ok = await putWithProgress(res.signedUrl, file, file.type, setProgress);
    setProgress(null);
    if (!ok) return void toast.error("The upload didn't finish. Check your connection and try again.");
    setDraft({ reelId: res.reelId, videoPath: res.videoPath, videoSrc: URL.createObjectURL(file) });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset(true);
        setOpen(next);
      }}
    >
      <Button onClick={() => setOpen(true)}>
        <Plus strokeWidth={1.5} />
        Add reel
      </Button>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add a reel</DialogTitle>
          <DialogDescription>
            {draft ? "Give it a title and a category, and pick its cover." : "Upload the finished video."}
          </DialogDescription>
        </DialogHeader>

        {draft ? (
          <ShowcaseReelForm
            reelId={draft.reelId}
            videoSrc={draft.videoSrc}
            categories={categories}
            initial={{ title: "", categoryIds: [], isPublished: true }}
            requireCover
            submitLabel="Add to showcase"
            onDuration={(ms) => (extra.current.durationMs = ms > 0 ? ms : null)}
            onPosterPath={(p) => extra.current.posterPaths.push(p)}
            onCancel={() => {
              reset(true);
              setOpen(false);
            }}
            onSubmit={async (values) => {
              const res = await createShowcaseReelAction({
                reelId: draft.reelId,
                videoPath: draft.videoPath,
                posterPath: values.posterPath ?? null,
                durationMs: extra.current.durationMs,
                title: values.title,
                categoryIds: values.categoryIds,
                isPublished: values.isPublished,
              });
              if (!res.ok) return res.error;
              toast.success(values.isPublished ? "Added and showing on the page" : "Added, hidden from the page");
              reset(false);
              setOpen(false);
              return null;
            }}
          />
        ) : (
          <ShowcaseUploadPicker progress={progress} onFile={upload} />
        )}
      </DialogContent>
    </Dialog>
  );
}
