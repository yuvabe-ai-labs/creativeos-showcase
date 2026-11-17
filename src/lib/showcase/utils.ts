/** A category's link name: "Food & beverage" → "food-beverage". */
export function slugifyCategoryName(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50)
    .replace(/-+$/g, "");
  return slug || "category";
}

/** The first of `base`, `base-2`, `base-3`, … that isn't taken. */
export function uniqueSlug(base: string, taken: ReadonlySet<string>): string {
  if (!taken.has(base)) return base;
  for (let n = 2; ; n++) {
    const candidate = `${base}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * D505: the page never names a brand. Returns the first client name found in `title` as a
 * whole word (case-insensitive), or null. Names shorter than 3 characters are skipped: they
 * match ordinary words too often.
 */
export function findBrandInTitle(title: string, clientNames: readonly string[]): string | null {
  const text = title.toLowerCase();
  for (const raw of clientNames) {
    const name = raw.trim().toLowerCase();
    if (name.length < 3) continue;
    const re = new RegExp(`(^|[^a-z0-9])${escapeRegExp(name)}($|[^a-z0-9])`);
    if (re.test(text)) return raw.trim();
  }
  return null;
}

/**
 * Moves the item with `id` one place up or down, then numbers the list 10, 20, 30, … Returns
 * only the writes whose order changed ([] when the item is already at that end). Renumbering,
 * rather than swapping two values, also untangles rows that ended up with the same order.
 * `items` must be in display order.
 */
export function moveWrites<T extends { id: string; sortOrder: number }>(
  items: readonly T[],
  id: string,
  direction: -1 | 1,
): { id: string; sortOrder: number }[] {
  const i = items.findIndex((item) => item.id === id);
  const j = i + direction;
  if (i < 0 || j < 0 || j >= items.length) return [];
  const next = [...items];
  [next[i], next[j]] = [next[j], next[i]];
  return next
    .map((item, index) => ({ id: item.id, sortOrder: (index + 1) * 10, before: item.sortOrder }))
    .filter((w) => w.sortOrder !== w.before)
    .map(({ id: wid, sortOrder }) => ({ id: wid, sortOrder }));
}

/** The order for an item added at the end of a list. */
export function nextSortOrder(items: readonly { sortOrder: number }[]): number {
  return items.reduce((max, item) => Math.max(max, item.sortOrder), 0) + 10;
}

/** "0:22", "1:05". */
export function formatReelDuration(ms: number): string {
  const total = Math.round(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/** A stored file belongs to this reel only when it sits under showcase/<reel id>/. */
export function isShowcasePathForReel(path: string, reelId: string): boolean {
  return path.startsWith(`showcase/${reelId}/`) && !path.includes("..") && !path.includes("//");
}

type Placed = { id: string; placements: { categoryId: string; sortOrder: number }[] };

/** The reels in one category, in that category's order (a reel can be in several, D504). */
export function reelsInCategory<T extends Placed>(reels: readonly T[], categoryId: string): T[] {
  const orderOf = (r: T) => r.placements.find((p) => p.categoryId === categoryId)?.sortOrder ?? 0;
  return reels
    .filter((r) => r.placements.some((p) => p.categoryId === categoryId))
    .sort((a, b) => orderOf(a) - orderOf(b) || a.id.localeCompare(b.id));
}

/**
 * "Featured" shows every reel once, under the first of its categories in page order, so a reel
 * in Founder-led and Food & beverage isn't shown twice. Returns sections in category order,
 * empty ones dropped.
 */
export function featuredSections<C extends { id: string }, T extends Placed>(
  categories: readonly C[],
  reels: readonly T[],
): { category: C; reels: T[] }[] {
  const position = new Map(categories.map((c, i) => [c.id, i]));
  const primary = new Map<string, string>();
  for (const r of reels) {
    const first = r.placements
      .filter((p) => position.has(p.categoryId))
      .sort((a, b) => position.get(a.categoryId)! - position.get(b.categoryId)!)[0];
    if (first) primary.set(r.id, first.categoryId);
  }
  return categories
    .map((category) => ({
      category,
      reels: reelsInCategory(reels, category.id).filter((r) => primary.get(r.id) === category.id),
    }))
    .filter((s) => s.reels.length > 0);
}
