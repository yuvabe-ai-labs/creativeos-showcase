"use client";

import { useRef, useState } from "react";
import { ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SHOWCASE_TITLE_MAX } from "@/lib/showcase/constants";
import type { ShowcaseCategory } from "@/lib/showcase/types";
import { ShowcaseCategoryPicker } from "./showcase-category-picker";
import { useShowcaseCover } from "./use-showcase-cover";

export type ShowcaseReelFormValues = {
  title: string;
  categoryIds: string[];
  isPublished: boolean;
  /** A cover uploaded in this form; undefined when the admin kept the existing one. */
  posterPath?: string;
};

// Shared by Add and Edit. The video plays from a same-origin source (a local file, or the
// stored file through /api/media) so its frame can become the cover.
export function ShowcaseReelForm({
  reelId,
  videoSrc,
  categories,
  initial,
  existingPosterUrl,
  requireCover,
  submitLabel,
  onDuration,
  onPosterPath,
  onSubmit,
  onCancel,
}: {
  reelId: string;
  videoSrc: string;
  categories: ShowcaseCategory[];
  initial: { title: string; categoryIds: string[]; isPublished: boolean };
  existingPosterUrl?: string | null;
  /** New reels always get a cover: the frame on screen is used if none was picked. */
  requireCover: boolean;
  submitLabel: string;
  onDuration?: (ms: number) => void;
  onPosterPath?: (path: string) => void;
  onSubmit: (values: ShowcaseReelFormValues) => Promise<string | null>;
  onCancel: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cover = useShowcaseCover(reelId, videoRef);
  const [title, setTitle] = useState(initial.title);
  const [categoryIds, setCategoryIds] = useState(initial.categoryIds);
  const [isPublished, setIsPublished] = useState(initial.isPublished);
  const [saving, setSaving] = useState(false);
  const coverUrl = cover.previewUrl ?? existingPosterUrl ?? null;

  async function pickCover() {
    try {
      onPosterPath?.(await cover.captureCover());
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function submit() {
    setSaving(true);
    try {
      let posterPath = cover.posterPath ?? undefined;
      if (!posterPath && requireCover) {
        posterPath = await cover.captureCover();
        onPosterPath?.(posterPath);
      }
      const error = await onSubmit({ title: title.trim(), categoryIds, isPublished, posterPath });
      if (error) toast.error(error);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-5 sm:grid-cols-[220px_1fr]">
      <div className="space-y-2">
        <video
          ref={videoRef}
          src={videoSrc}
          controls
          playsInline
          preload="auto"
          // A new reel opens a second in, so the first frame isn't a black fade-in.
          onLoadedMetadata={(e) => {
            const v = e.currentTarget;
            onDuration?.(Math.round(v.duration * 1000));
            if (requireCover && v.currentTime === 0 && v.duration > 2) v.currentTime = 1;
          }}
          className="aspect-[9/16] w-full rounded-xl bg-black object-contain"
        />
        <Button variant="outline" size="sm" className="w-full" onClick={pickCover} disabled={cover.busy || saving}>
          <ImageIcon strokeWidth={1.5} />
          {cover.busy ? "Saving cover…" : "Use this frame as the cover"}
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="showcase-title">Title</Label>
          <Input
            id="showcase-title"
            value={title}
            maxLength={SHOWCASE_TITLE_MAX}
            placeholder="e.g. A South Indian breakfast"
            onChange={(e) => setTitle(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Describe the reel. Never use the brand or product name: the page is public.
          </p>
        </div>

        <ShowcaseCategoryPicker categories={categories} value={categoryIds} onChange={setCategoryIds} />

        <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
          <div>
            <Label htmlFor="showcase-published">Show on the page</Label>
            <p className="text-xs text-muted-foreground">Off keeps it here, hidden from prospects.</p>
          </div>
          <Switch id="showcase-published" checked={isPublished} onCheckedChange={(v) => setIsPublished(Boolean(v))} />
        </div>

        <div className="space-y-1.5">
          <Label>Cover</Label>
          <div className="flex items-center gap-3">
            {coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- a local preview or stored cover
              <img src={coverUrl} alt="" className="aspect-[9/16] w-14 rounded-md border border-border object-cover" />
            ) : (
              <span className="flex aspect-[9/16] w-14 items-center justify-center rounded-md border border-dashed border-border text-muted-foreground">
                <ImageIcon className="size-4" strokeWidth={1.5} />
              </span>
            )}
            <p className="text-xs text-muted-foreground">
              {coverUrl
                ? "Pause on another moment and use that frame to change it."
                : "Pause on a good moment and use that frame. If you skip this, the frame on screen is used."}
            </p>
          </div>
        </div>

        <div className="mt-auto flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving || cover.busy || title.trim() === "" || categoryIds.length === 0}>
            {saving ? "Saving…" : submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
