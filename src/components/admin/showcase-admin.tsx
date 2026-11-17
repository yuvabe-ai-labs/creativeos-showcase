"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SHOWCASE_PATH } from "@/lib/showcase/constants";
import type { ShowcaseCategory, ShowcaseReel } from "@/lib/showcase/types";
import { reelsInCategory } from "@/lib/showcase/utils";
import { AddShowcaseReelDialog } from "./add-showcase-reel-dialog";
import { AdminFrame } from "./admin-frame";
import { EditShowcaseReelDialog } from "./edit-showcase-reel-dialog";
import { ShowcaseCategoriesDialog } from "./showcase-categories-dialog";
import { ShowcaseReelRow } from "./showcase-reel-row";

export function ShowcaseAdmin({
  email,
  categories,
  reels,
}: {
  email: string | null;
  categories: ShowcaseCategory[];
  reels: ShowcaseReel[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  // A reel in several categories is listed under each, in that category's order (D504).
  const byCategory = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, reelsInCategory(reels, c.id)])),
    [categories, reels],
  );
  const nameOf = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);
  const reelCounts = useMemo(
    () => Object.fromEntries(Object.entries(byCategory).map(([id, list]) => [id, list.length])),
    [byCategory],
  );

  const actions = (
    <>
      <Button
        variant="ghost"
        nativeButton={false}
        render={
          <Link href={SHOWCASE_PATH} target="_blank" rel="noopener">
            <ExternalLink strokeWidth={1.5} />
            Open the page
          </Link>
        }
      />
      <ShowcaseCategoriesDialog categories={categories} reelCounts={reelCounts} />
      <AddShowcaseReelDialog categories={categories} />
    </>
  );

  return (
    <AdminFrame email={email} actions={actions}>
      <div className="space-y-6">
        {categories.map((c) => {
          const list = byCategory[c.id] ?? [];
          const live = list.filter((r) => r.isPublished).length;
          return (
            <section key={c.id} className="rounded-xl border border-border bg-card px-4 pt-3 pb-1 shadow-card">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-medium">{c.name}</h2>
                <span className="text-xs text-muted-foreground">
                  {live > 0 ? "On the page" : "Not on the page"}
                </span>
              </div>
              {list.length === 0 ? (
                <p className="py-3 text-sm text-muted-foreground">No reels yet.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {list.map((r, i) => (
                    <ShowcaseReelRow
                      // The switch is local state; a change saved elsewhere (Edit) remounts it.
                      key={`${r.id}:${r.isPublished}`}
                      reel={r}
                      categoryId={c.id}
                      alsoIn={r.placements
                        .filter((p) => p.categoryId !== c.id)
                        .map((p) => nameOf.get(p.categoryId))
                        .filter((n): n is string => !!n)}
                      isFirst={i === 0}
                      isLast={i === list.length - 1}
                      onEdit={() => setEditingId(r.id)}
                    />
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      <EditShowcaseReelDialog
        reel={reels.find((r) => r.id === editingId) ?? null}
        categories={categories}
        onClose={() => setEditingId(null)}
      />
    </AdminFrame>
  );
}
