"use client";

import { useCallback, useMemo, useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { PublicShowcaseReel, ShowcaseCategory } from "@/lib/showcase/types";
import { featuredSections, reelsInCategory } from "@/lib/showcase/utils";
import { ShowcaseReelCard } from "./showcase-reel-card";
import { ShowcasePlayer } from "./showcase-player";
import { useStuck } from "./use-stuck";

const FEATURED = "featured";

// The public gallery: "Featured" (every reel once, under its first category) or one category
// (every reel in it), chosen by chip. A reel can be in several categories (D504).
// The chosen category goes in the address (?category=<slug>) so sales can send a link that
// opens on, say, Food & beverage. No counts anywhere (D504): they would read as "this is all
// we have done".
export function ShowcaseGallery({
  categories,
  reels,
  initialCategory,
}: {
  categories: ShowcaseCategory[];
  reels: PublicShowcaseReel[];
  initialCategory?: string;
}) {
  // Only categories with something published get a chip.
  const groups = useMemo(
    () =>
      categories
        .map((c) => ({ category: c, reels: reelsInCategory(reels, c.id) }))
        .filter((g) => g.reels.length > 0),
    [categories, reels],
  );
  const featured = useMemo(() => featuredSections(categories, reels), [categories, reels]);
  const [filter, setFilter] = useState<string>(
    groups.some((g) => g.category.slug === initialCategory) ? initialCategory! : FEATURED,
  );
  const [openId, setOpenId] = useState<string | null>(null);
  const { sentinel, stuck } = useStuck();

  const shown = filter === FEATURED ? featured : groups.filter((g) => g.category.slug === filter);
  // Next/previous walk the reels in the order they are on screen.
  const order = useMemo(() => shown.flatMap((g) => g.reels), [shown]);
  const openReel = order.find((r) => r.id === openId) ?? null;

  const choose = (value: string) => {
    setFilter(value);
    const url = value === FEATURED ? window.location.pathname : `?category=${value}`;
    window.history.replaceState(null, "", url);
  };
  const step = useCallback(
    (dir: -1 | 1) => {
      const i = order.findIndex((r) => r.id === openId);
      if (i < 0) return;
      setOpenId(order[(i + dir + order.length) % order.length].id);
    },
    [order, openId],
  );

  if (groups.length === 0) {
    return <p className="mt-6 text-muted-foreground">New reels are on their way. Check back soon.</p>;
  }

  return (
    <>
      {/* Once the chips stick to the top, a frosted backdrop fades in behind them, spanning the
          whole window (::before) so it has no edge. The row scrolls sideways and fades at the
          right to show there's more. */}
      <div ref={sentinel} aria-hidden className="h-px" />
      <div
        data-stuck={stuck || undefined}
        className="sticky top-0 z-10 -mx-4 py-3 before:pointer-events-none before:absolute before:inset-y-0 before:left-1/2 before:-z-10 before:w-screen before:-translate-x-1/2 before:border-b before:border-border before:bg-background/85 before:opacity-0 before:backdrop-blur before:transition-opacity before:duration-200 data-stuck:before:opacity-100 sm:-mx-8"
      >
        <div className="overflow-x-auto px-4 [mask-image:linear-gradient(to_right,black_calc(100%-3rem),transparent)] [scrollbar-width:none] sm:px-8">
          <ToggleGroup
            value={[filter]}
            onValueChange={(v) => v[0] && choose(v[0])}
            aria-label="Filter by category"
            className="w-max"
          >
            {[{ value: FEATURED, label: "Featured" }, ...groups.map((g) => ({ value: g.category.slug, label: g.category.name }))].map(
              (chip) => (
                <ToggleGroupItem
                  key={chip.value}
                  value={chip.value}
                  variant="outline"
                  className="h-9 rounded-full bg-card px-4 text-sm text-neutral-700 aria-pressed:border-foreground aria-pressed:bg-foreground aria-pressed:text-background hover:aria-pressed:bg-foreground"
                >
                  {chip.label}
                </ToggleGroupItem>
              ),
            )}
          </ToggleGroup>
        </div>
      </div>

      <div className="space-y-12">
        {shown.map((g) => (
          <section key={g.category.id} className="animate-rise pt-8">
            <h2 className="font-display text-xl font-semibold tracking-tight">{g.category.name}</h2>
            {g.category.description && <p className="mt-1 text-sm text-muted-foreground">{g.category.description}</p>}
            <div className="mt-5 grid grid-cols-2 gap-x-3.5 gap-y-7 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-4 xl:grid-cols-5">
              {g.reels.map((r) => (
                <ShowcaseReelCard key={r.id} reel={r} onOpen={() => setOpenId(r.id)} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <ShowcasePlayer
        reel={openReel}
        categoryName={shown.find((g) => g.reels.some((r) => r.id === openReel?.id))?.category.name}
        onClose={() => setOpenId(null)}
        onStep={step}
      />
    </>
  );
}
