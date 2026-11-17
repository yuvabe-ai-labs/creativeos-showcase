"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  deleteShowcaseReelAction,
  moveShowcaseReelAction,
  setShowcaseReelPublishedAction,
} from "@/lib/actions/showcase";
import { formatReelDuration } from "@/lib/showcase/utils";
import type { ShowcaseReel } from "@/lib/showcase/types";

export function ShowcaseReelRow({
  reel,
  categoryId,
  alsoIn,
  isFirst,
  isLast,
  onEdit,
}: {
  reel: ShowcaseReel;
  /** The category this row is listed under: moving up/down happens inside it. */
  categoryId: string;
  /** The reel's other categories, by name. */
  alsoIn: string[];
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
}) {
  // Optimistic, reverted on failure; the server action refreshes the page with the truth.
  const [published, setPublished] = useState(reel.isPublished);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function run(work: () => Promise<{ ok: boolean; error?: string }>, onFail?: () => void) {
    setBusy(true);
    const res = await work();
    setBusy(false);
    if (!res.ok) {
      onFail?.();
      toast.error(res.error ?? "Something went wrong. Try again.");
    }
  }

  return (
    <li className="flex items-center gap-3 py-2.5">
      <span className="relative aspect-[9/16] w-11 shrink-0 overflow-hidden rounded-md border border-border bg-neutral-900">
        {reel.posterUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- a stored cover on our bucket
          <img src={reel.posterUrl} alt="" className="size-full object-cover" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{reel.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {[
            reel.durationMs ? formatReelDuration(reel.durationMs) : null,
            published ? "On the page" : "Hidden",
            alsoIn.length ? `Also in ${alsoIn.join(", ")}` : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
      <Switch
        checked={published}
        disabled={busy}
        aria-label={published ? "Hide from the page" : "Show on the page"}
        onCheckedChange={(v) => {
          const next = Boolean(v);
          setPublished(next);
          void run(() => setShowcaseReelPublishedAction({ id: reel.id, isPublished: next }), () => setPublished(!next));
        }}
      />
      <div className="flex shrink-0 items-center">
        <Button variant="ghost" size="icon-sm" aria-label="Move up" disabled={busy || isFirst} onClick={() => run(() => moveShowcaseReelAction({ id: reel.id, categoryId, direction: -1 }))}>
          <ArrowUp strokeWidth={1.5} />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Move down" disabled={busy || isLast} onClick={() => run(() => moveShowcaseReelAction({ id: reel.id, categoryId, direction: 1 }))}>
          <ArrowDown strokeWidth={1.5} />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Edit" disabled={busy} onClick={onEdit}>
          <Pencil strokeWidth={1.5} />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Delete" disabled={busy} onClick={() => setConfirming(true)}>
          <Trash2 strokeWidth={1.5} />
        </Button>
      </div>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this reel?</AlertDialogTitle>
            <AlertDialogDescription>
              It comes off the public page, from every category it&apos;s in, and its video is deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                setConfirming(false);
                void run(() => deleteShowcaseReelAction({ id: reel.id }));
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  );
}
