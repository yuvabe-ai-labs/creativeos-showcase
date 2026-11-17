import "server-only";
import { createServerSupabase } from "@/lib/supabase/server";
import { publicUrlFor } from "@/lib/storage/gcs";
import type {
  PublicShowcaseReel,
  ReelPlacement,
  ShowcaseCategory,
  ShowcaseReel,
} from "@/lib/showcase/types";

// Showcase tables (CreativeOS migration 0063, D501–D506). Service-role reads and writes;
// callers gate on requireShowcaseAdmin() for everything except the two public reads.
// clients is CreativeOS's table: read only, for the brand-name check on titles.

const CATEGORY_COLUMNS = "id, slug, name, description, sort_order";
// A reel and its categories in one request (the link table is embedded).
const REEL_COLUMNS =
  "id, title, video_path, poster_path, duration_ms, is_published, showcase_reel_categories(category_id, sort_order)";

type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
};

export type ShowcaseReelRow = {
  id: string;
  title: string;
  video_path: string;
  poster_path: string | null;
  duration_ms: number | null;
  is_published: boolean;
  showcase_reel_categories: { category_id: string; sort_order: number }[];
};

function toCategory(r: CategoryRow): ShowcaseCategory {
  return { id: r.id, slug: r.slug, name: r.name, description: r.description, sortOrder: r.sort_order };
}

function toReel(r: ShowcaseReelRow): ShowcaseReel {
  return {
    id: r.id,
    title: r.title,
    videoUrl: publicUrlFor(r.video_path),
    posterUrl: r.poster_path ? publicUrlFor(r.poster_path) : null,
    durationMs: r.duration_ms,
    isPublished: r.is_published,
    placements: r.showcase_reel_categories.map((p) => ({ categoryId: p.category_id, sortOrder: p.sort_order })),
  };
}

export async function listShowcaseCategories(): Promise<ShowcaseCategory[]> {
  const { data, error } = await createServerSupabase()
    .from("showcase_categories")
    .select(CATEGORY_COLUMNS)
    .order("sort_order")
    .order("created_at");
  if (error) throw error;
  return (data as CategoryRow[]).map(toCategory);
}

/** Every reel, published or not, with its categories (admin). */
export async function listShowcaseReels(): Promise<ShowcaseReel[]> {
  const { data, error } = await createServerSupabase()
    .from("showcase_reels")
    .select(REEL_COLUMNS)
    .order("created_at");
  if (error) throw error;
  return (data as ShowcaseReelRow[]).map(toReel);
}

/** What the public page shows: published reels only. */
export async function listPublishedShowcaseReels(): Promise<PublicShowcaseReel[]> {
  const { data, error } = await createServerSupabase()
    .from("showcase_reels")
    .select(REEL_COLUMNS)
    .eq("is_published", true)
    .order("created_at");
  if (error) throw error;
  return (data as ShowcaseReelRow[]).map((r) => {
    const reel: PublicShowcaseReel & { isPublished?: boolean } = toReel(r);
    delete reel.isPublished;
    return reel;
  });
}

export async function getShowcaseReelRow(id: string): Promise<ShowcaseReelRow | null> {
  const { data, error } = await createServerSupabase()
    .from("showcase_reels")
    .select(REEL_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as ShowcaseReelRow | null;
}

/** A category's reels in display order, for appending and moving. `id` is the reel's id. */
export async function listCategoryReelOrders(categoryId: string): Promise<{ id: string; sortOrder: number }[]> {
  const { data, error } = await createServerSupabase()
    .from("showcase_reel_categories")
    .select("reel_id, sort_order")
    .eq("category_id", categoryId)
    .order("sort_order")
    .order("reel_id");
  if (error) throw error;
  return (data as { reel_id: string; sort_order: number }[]).map((r) => ({ id: r.reel_id, sortOrder: r.sort_order }));
}

export async function insertShowcaseReel(input: {
  id: string;
  title: string;
  videoPath: string;
  posterPath: string | null;
  durationMs: number | null;
  isPublished: boolean;
  placements: ReelPlacement[];
  createdBy: string;
}): Promise<void> {
  const supabase = createServerSupabase();
  const { error } = await supabase.from("showcase_reels").insert({
    id: input.id,
    title: input.title,
    video_path: input.videoPath,
    poster_path: input.posterPath,
    duration_ms: input.durationMs,
    is_published: input.isPublished,
    created_by: input.createdBy,
  });
  if (error) throw error;
  try {
    await addPlacements(input.id, input.placements);
  } catch (e) {
    // A reel with no category would sit nowhere: undo it.
    await supabase.from("showcase_reels").delete().eq("id", input.id);
    throw e;
  }
}

export async function addPlacements(reelId: string, placements: ReelPlacement[]): Promise<void> {
  if (placements.length === 0) return;
  const { error } = await createServerSupabase()
    .from("showcase_reel_categories")
    .insert(placements.map((p) => ({ reel_id: reelId, category_id: p.categoryId, sort_order: p.sortOrder })));
  if (error) throw error;
}

export async function removePlacements(reelId: string, categoryIds: string[]): Promise<void> {
  if (categoryIds.length === 0) return;
  const { error } = await createServerSupabase()
    .from("showcase_reel_categories")
    .delete()
    .eq("reel_id", reelId)
    .in("category_id", categoryIds);
  if (error) throw error;
}

export async function updateShowcaseReel(
  id: string,
  patch: Partial<{ title: string; posterPath: string | null; isPublished: boolean }>,
): Promise<void> {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.posterPath !== undefined) row.poster_path = patch.posterPath;
  if (patch.isPublished !== undefined) row.is_published = patch.isPublished;
  const { error } = await createServerSupabase().from("showcase_reels").update(row).eq("id", id);
  if (error) throw error;
}

/** Deletes the reel; its category links go with it (on delete cascade). */
export async function deleteShowcaseReel(id: string): Promise<void> {
  const { error } = await createServerSupabase().from("showcase_reels").delete().eq("id", id);
  if (error) throw error;
}

/** New orders for reels inside one category, written in parallel (one row each). */
export async function setPlacementOrders(categoryId: string, writes: { id: string; sortOrder: number }[]): Promise<void> {
  if (writes.length === 0) return;
  const supabase = createServerSupabase();
  const results = await Promise.all(
    writes.map((w) =>
      supabase
        .from("showcase_reel_categories")
        .update({ sort_order: w.sortOrder })
        .eq("category_id", categoryId)
        .eq("reel_id", w.id),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
}

/** New orders for categories, written in parallel (one row each). */
export async function setCategoryOrders(writes: { id: string; sortOrder: number }[]): Promise<void> {
  if (writes.length === 0) return;
  const supabase = createServerSupabase();
  const results = await Promise.all(
    writes.map((w) => supabase.from("showcase_categories").update({ sort_order: w.sortOrder }).eq("id", w.id)),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
}

export async function insertShowcaseCategory(input: {
  slug: string;
  name: string;
  description: string | null;
  sortOrder: number;
}): Promise<void> {
  const { error } = await createServerSupabase().from("showcase_categories").insert({
    slug: input.slug,
    name: input.name,
    description: input.description,
    sort_order: input.sortOrder,
  });
  if (error) throw error;
}

export async function updateShowcaseCategory(
  id: string,
  patch: { name: string; description: string | null },
): Promise<void> {
  const { error } = await createServerSupabase()
    .from("showcase_categories")
    .update({ name: patch.name, description: patch.description, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export class CategoryNotEmptyError extends Error {
  constructor() {
    super("Take the reels out of this category first.");
  }
}

export async function deleteShowcaseCategory(id: string): Promise<void> {
  const { error } = await createServerSupabase().from("showcase_categories").delete().eq("id", id);
  // 23503: reels are still linked to it (on delete restrict).
  if (error?.code === "23503") throw new CategoryNotEmptyError();
  if (error) throw error;
}

/** Every client's name across all orgs, for the brand-name check on titles (D505). */
export async function listAllClientNames(): Promise<string[]> {
  const { data, error } = await createServerSupabase().from("clients").select("name");
  if (error) throw error;
  return (data as { name: string }[]).map((r) => r.name);
}
