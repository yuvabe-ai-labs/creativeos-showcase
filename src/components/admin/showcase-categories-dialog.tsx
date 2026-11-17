"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Pencil, Plus, Tags, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  createShowcaseCategoryAction,
  deleteShowcaseCategoryAction,
  moveShowcaseCategoryAction,
  updateShowcaseCategoryAction,
  type ShowcaseResult,
} from "@/lib/actions/showcase";
import type { ShowcaseCategory } from "@/lib/showcase/types";
import { ShowcaseCategoryEditor } from "./showcase-category-editor";

// Categories are the chips and sections on the page, in this order. A category with no reels
// on the page is left off it. Renaming keeps the category's link (?category=…) working.
export function ShowcaseCategoriesDialog({
  categories,
  reelCounts,
}: {
  categories: ShowcaseCategory[];
  reelCounts: Record<string, number>;
}) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(work: () => Promise<ShowcaseResult>): Promise<boolean> {
    setBusy(true);
    const res = await work();
    setBusy(false);
    if (!res.ok) toast.error(res.error);
    return res.ok;
  }

  return (
    <Dialog open={open} onOpenChange={(next) => {
        setOpen(next);
        setEditingId(null);
      }}>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Tags strokeWidth={1.5} />
        Categories
      </Button>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Categories</DialogTitle>
          <DialogDescription>
            The page shows them in this order. One with nothing switched on stays off the page.
          </DialogDescription>
        </DialogHeader>

        <ul className="max-h-[55dvh] divide-y divide-border overflow-y-auto">
          {categories.map((c, i) =>
            editingId === c.id ? (
              <li key={c.id} className="py-2">
                <ShowcaseCategoryEditor
                  initial={{ name: c.name, description: c.description ?? "" }}
                  submitLabel="Save"
                  onCancel={() => setEditingId(null)}
                  onSubmit={(v) => run(() => updateShowcaseCategoryAction({ id: c.id, ...v }))}
                />
              </li>
            ) : (
              <li key={c.id} className="flex items-center gap-2 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{c.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {reelCounts[c.id] ? `${reelCounts[c.id]} in the admin` : "No reels yet"}
                    {c.description ? ` · ${c.description}` : ""}
                  </p>
                </div>
                <Button variant="ghost" size="icon-sm" aria-label="Move up" disabled={busy || i === 0} onClick={() => run(() => moveShowcaseCategoryAction({ id: c.id, direction: -1 }))}>
                  <ArrowUp strokeWidth={1.5} />
                </Button>
                <Button variant="ghost" size="icon-sm" aria-label="Move down" disabled={busy || i === categories.length - 1} onClick={() => run(() => moveShowcaseCategoryAction({ id: c.id, direction: 1 }))}>
                  <ArrowDown strokeWidth={1.5} />
                </Button>
                <Button variant="ghost" size="icon-sm" aria-label="Rename" disabled={busy} onClick={() => setEditingId(c.id)}>
                  <Pencil strokeWidth={1.5} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Delete"
                  // A category with reels can't go (the database refuses too): move them first.
                  disabled={busy || (reelCounts[c.id] ?? 0) > 0}
                  title={(reelCounts[c.id] ?? 0) > 0 ? "Move or delete its reels first" : undefined}
                  onClick={() => run(() => deleteShowcaseCategoryAction({ id: c.id }))}
                >
                  <Trash2 strokeWidth={1.5} />
                </Button>
              </li>
            ),
          )}
        </ul>

        {editingId === "new" ? (
          <ShowcaseCategoryEditor
            initial={{ name: "", description: "" }}
            submitLabel="Add category"
            onCancel={() => setEditingId(null)}
            onSubmit={(v) => run(() => createShowcaseCategoryAction(v))}
          />
        ) : (
          <Button
            variant="outline"
            className="self-start border-dashed border-primary/40 text-primary hover:bg-primary/5"
            onClick={() => setEditingId("new")}
          >
            <Plus strokeWidth={1.5} />
            Add a category
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
