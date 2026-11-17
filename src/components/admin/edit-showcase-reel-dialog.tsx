"use client";

import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { updateShowcaseReelAction } from "@/lib/actions/showcase";
import type { ShowcaseCategory, ShowcaseReel } from "@/lib/showcase/types";
import { ShowcaseReelForm } from "./showcase-reel-form";

export function EditShowcaseReelDialog({
  reel,
  categories,
  onClose,
}: {
  reel: ShowcaseReel | null;
  categories: ShowcaseCategory[];
  onClose: () => void;
}) {
  return (
    <Dialog open={reel !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit reel</DialogTitle>
          <DialogDescription>Changes show on the public page as soon as you save.</DialogDescription>
        </DialogHeader>
        {reel && (
          <ShowcaseReelForm
            key={reel.id}
            reelId={reel.id}
            videoSrc={`/api/media?url=${encodeURIComponent(reel.videoUrl)}`}
            categories={categories}
            initial={{ title: reel.title, categoryIds: reel.placements.map((p) => p.categoryId), isPublished: reel.isPublished }}
            existingPosterUrl={reel.posterUrl}
            requireCover={!reel.posterUrl}
            submitLabel="Save"
            onCancel={onClose}
            onSubmit={async (values) => {
              const res = await updateShowcaseReelAction({ id: reel.id, ...values });
              if (!res.ok) return res.error;
              toast.success("Saved");
              onClose();
              return null;
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
