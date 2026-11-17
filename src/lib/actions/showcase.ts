"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import * as z from "zod";
import { requireShowcaseAdmin } from "@/lib/auth/require-showcase-admin";
import {
  CategoryNotEmptyError,
  deleteShowcaseCategory,
  deleteShowcaseReel,
  getShowcaseReelRow,
  insertShowcaseCategory,
  insertShowcaseReel,
  listAllClientNames,
  listCategoryReelOrders,
  listShowcaseCategories,
  addPlacements,
  removePlacements,
  setCategoryOrders,
  setPlacementOrders,
  updateShowcaseCategory,
  updateShowcaseReel,
} from "@/lib/db/showcase";
import {
  removeShowcaseFiles,
  showcaseFileExists,
  signShowcasePosterUpload,
  signShowcaseVideoUpload,
} from "@/lib/storage/showcase-files";
import {
  SHOWCASE_ADMIN_PATH,
  SHOWCASE_CATEGORY_DESCRIPTION_MAX,
  SHOWCASE_CATEGORY_NAME_MAX,
  SHOWCASE_PATH,
  SHOWCASE_TITLE_MAX,
  SHOWCASE_VIDEO_MAX_BYTES,
  SHOWCASE_VIDEO_TYPES,
} from "@/lib/showcase/constants";
import {
  findBrandInTitle,
  isShowcasePathForReel,
  moveWrites,
  nextSortOrder,
  slugifyCategoryName,
  uniqueSlug,
} from "@/lib/showcase/utils";

// Showcase administration (CreativeOS D501–D506). Every action is requireShowcaseAdmin()-gated:
// a server action is a public POST endpoint, so the check lives here, not only in proxy.ts.

export type ShowcaseResult<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const Id = z.string().uuid();
const Title = z.string().trim().min(1, "Give the reel a title.").max(SHOWCASE_TITLE_MAX);
// D504: a reel sits in one or more categories (no duplicates).
const CategoryIds = z
  .array(Id)
  .min(1, "Pick at least one category.")
  .transform((ids) => [...new Set(ids)]);

function fail(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

function refresh() {
  revalidatePath(SHOWCASE_ADMIN_PATH);
  revalidatePath(SHOWCASE_PATH);
}

async function brandError(title: string): Promise<string | null> {
  const brand = findBrandInTitle(title, await listAllClientNames());
  return brand ? `Titles can't name a brand, and "${brand}" is a client. Describe the reel instead.` : null;
}

// ── Getting a video in ───────────────────────────────────────────────────────────────────

/** Step 1 of an upload: a new reel id and where the browser sends the file. */
export async function prepareShowcaseUploadAction(input: {
  contentType: string;
  sizeBytes: number;
}): Promise<ShowcaseResult<{ reelId: string; videoPath: string; signedUrl: string }>> {
  await requireShowcaseAdmin();
  if (!(SHOWCASE_VIDEO_TYPES as readonly string[]).includes(input.contentType)) {
    return fail("Upload an MP4 video.");
  }
  if (!(input.sizeBytes > 0) || input.sizeBytes > SHOWCASE_VIDEO_MAX_BYTES) {
    return fail("This video is over 300 MB. Export a smaller copy and try again.");
  }
  const reelId = randomUUID();
  const signed = await signShowcaseVideoUpload({ reelId, contentType: input.contentType });
  return { ok: true, reelId, videoPath: signed.path, signedUrl: signed.signedUrl };
}

/** Where the browser sends the cover frame it captured. */
export async function prepareShowcasePosterAction(input: {
  reelId: string;
}): Promise<ShowcaseResult<{ posterPath: string; signedUrl: string }>> {
  await requireShowcaseAdmin();
  if (!Id.safeParse(input.reelId).success) return fail("Something went wrong. Try again.");
  const signed = await signShowcasePosterUpload({ reelId: input.reelId });
  return { ok: true, posterPath: signed.path, signedUrl: signed.signedUrl };
}

/** Cancelled before saving: remove the files of a reel that was never created. */
export async function discardShowcaseDraftAction(input: {
  reelId: string;
  paths: string[];
}): Promise<void> {
  await requireShowcaseAdmin();
  if (!Id.safeParse(input.reelId).success) return;
  if (await getShowcaseReelRow(input.reelId)) return;
  await removeShowcaseFiles(input.paths.filter((p) => isShowcasePathForReel(p, input.reelId)));
}

// ── Reels ────────────────────────────────────────────────────────────────────────────────

/** Where a reel goes when it joins categories: at the end of each, looked up in parallel. */
async function endPlacements(categoryIds: string[]) {
  const orders = await Promise.all(categoryIds.map(listCategoryReelOrders));
  return categoryIds.map((categoryId, i) => ({ categoryId, sortOrder: nextSortOrder(orders[i]) }));
}

const CreateReel = z.object({
  reelId: Id,
  videoPath: z.string(),
  posterPath: z.string().nullable(),
  durationMs: z.number().int().positive().nullable(),
  title: Title,
  categoryIds: CategoryIds,
  isPublished: z.boolean(),
});

export async function createShowcaseReelAction(
  input: z.input<typeof CreateReel>,
): Promise<ShowcaseResult> {
  const caller = await requireShowcaseAdmin();
  const parsed = CreateReel.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Check the details and try again.");
  const r = parsed.data;

  // Paths come from the browser: they must be this reel's own files, and really there.
  const paths = [r.videoPath, r.posterPath].filter((p): p is string => !!p);
  if (!paths.every((p) => isShowcasePathForReel(p, r.reelId))) return fail("Something went wrong. Try again.");
  const [exists, brand, placements] = await Promise.all([
    Promise.all(paths.map(showcaseFileExists)),
    brandError(r.title),
    endPlacements(r.categoryIds),
  ]);
  if (!exists.every(Boolean)) return fail("The video didn't finish uploading. Try again.");
  if (brand) return fail(brand);

  await insertShowcaseReel({
    id: r.reelId,
    title: r.title,
    videoPath: r.videoPath,
    posterPath: r.posterPath,
    durationMs: r.durationMs,
    isPublished: r.isPublished,
    placements,
    createdBy: caller.userId,
  });
  refresh();
  return { ok: true };
}

const UpdateReel = z.object({
  id: Id,
  title: Title,
  categoryIds: CategoryIds,
  isPublished: z.boolean(),
  /** A new cover, already uploaded; undefined keeps the current one. */
  posterPath: z.string().optional(),
});

export async function updateShowcaseReelAction(
  input: z.input<typeof UpdateReel>,
): Promise<ShowcaseResult> {
  await requireShowcaseAdmin();
  const parsed = UpdateReel.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Check the details and try again.");
  const r = parsed.data;

  const current = await getShowcaseReelRow(r.id);
  if (!current) return fail("This reel no longer exists.");
  if (r.posterPath !== undefined) {
    if (!isShowcasePathForReel(r.posterPath, r.id) || !(await showcaseFileExists(r.posterPath))) {
      return fail("The cover didn't finish uploading. Try again.");
    }
  }
  const brand = await brandError(r.title);
  if (brand) return fail(brand);

  // Categories it joins get it at the end; categories it leaves drop it; the rest keep its place.
  const before = new Set(current.showcase_reel_categories.map((p) => p.category_id));
  const added = r.categoryIds.filter((id) => !before.has(id));
  const removed = [...before].filter((id) => !r.categoryIds.includes(id));

  await updateShowcaseReel(r.id, {
    title: r.title,
    isPublished: r.isPublished,
    ...(r.posterPath !== undefined ? { posterPath: r.posterPath } : {}),
  });
  // Add before removing, so the reel is never left in no category if one step fails.
  await addPlacements(r.id, await endPlacements(added));
  await removePlacements(r.id, removed);
  if (r.posterPath !== undefined && current.poster_path && current.poster_path !== r.posterPath) {
    await removeShowcaseFiles([current.poster_path]);
  }
  refresh();
  return { ok: true };
}

export async function setShowcaseReelPublishedAction(input: {
  id: string;
  isPublished: boolean;
}): Promise<ShowcaseResult> {
  await requireShowcaseAdmin();
  if (!Id.safeParse(input.id).success) return fail("This reel no longer exists.");
  await updateShowcaseReel(input.id, { isPublished: input.isPublished === true });
  refresh();
  return { ok: true };
}

/** Moves a reel one place up or down inside one category; its place in others is untouched. */
export async function moveShowcaseReelAction(input: {
  id: string;
  categoryId: string;
  direction: -1 | 1;
}): Promise<ShowcaseResult> {
  await requireShowcaseAdmin();
  if (!Id.safeParse(input.id).success || !Id.safeParse(input.categoryId).success) {
    return fail("This reel no longer exists.");
  }
  const orders = await listCategoryReelOrders(input.categoryId);
  await setPlacementOrders(input.categoryId, moveWrites(orders, input.id, input.direction === -1 ? -1 : 1));
  refresh();
  return { ok: true };
}

export async function deleteShowcaseReelAction(input: { id: string }): Promise<ShowcaseResult> {
  await requireShowcaseAdmin();
  if (!Id.safeParse(input.id).success) return fail("This reel no longer exists.");
  const current = await getShowcaseReelRow(input.id);
  if (!current) return { ok: true };
  await deleteShowcaseReel(input.id);
  await removeShowcaseFiles([current.video_path, current.poster_path]);
  refresh();
  return { ok: true };
}

// ── Categories ───────────────────────────────────────────────────────────────────────────

const CategoryFields = z.object({
  name: z.string().trim().min(1, "Give the category a name.").max(SHOWCASE_CATEGORY_NAME_MAX),
  description: z
    .string()
    .trim()
    .max(SHOWCASE_CATEGORY_DESCRIPTION_MAX)
    .transform((d) => (d === "" ? null : d)),
});

export async function createShowcaseCategoryAction(
  input: z.input<typeof CategoryFields>,
): Promise<ShowcaseResult> {
  await requireShowcaseAdmin();
  const parsed = CategoryFields.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Check the details and try again.");
  const categories = await listShowcaseCategories();
  if (categories.some((c) => c.name.toLowerCase() === parsed.data.name.toLowerCase())) {
    return fail("There's already a category with that name.");
  }
  await insertShowcaseCategory({
    slug: uniqueSlug(slugifyCategoryName(parsed.data.name), new Set(categories.map((c) => c.slug))),
    name: parsed.data.name,
    description: parsed.data.description,
    sortOrder: nextSortOrder(categories),
  });
  refresh();
  return { ok: true };
}

export async function updateShowcaseCategoryAction(
  input: { id: string } & z.input<typeof CategoryFields>,
): Promise<ShowcaseResult> {
  await requireShowcaseAdmin();
  const parsed = CategoryFields.safeParse(input);
  if (!Id.safeParse(input.id).success || !parsed.success) {
    return fail(parsed.success ? "This category no longer exists." : (parsed.error.issues[0]?.message ?? "Check the details."));
  }
  const categories = await listShowcaseCategories();
  if (categories.some((c) => c.id !== input.id && c.name.toLowerCase() === parsed.data.name.toLowerCase())) {
    return fail("There's already a category with that name.");
  }
  // The slug stays: links already sent keep working after a rename.
  await updateShowcaseCategory(input.id, parsed.data);
  refresh();
  return { ok: true };
}

export async function moveShowcaseCategoryAction(input: {
  id: string;
  direction: -1 | 1;
}): Promise<ShowcaseResult> {
  await requireShowcaseAdmin();
  if (!Id.safeParse(input.id).success) return fail("This category no longer exists.");
  const categories = await listShowcaseCategories();
  await setCategoryOrders(moveWrites(categories, input.id, input.direction === -1 ? -1 : 1));
  refresh();
  return { ok: true };
}

export async function deleteShowcaseCategoryAction(input: { id: string }): Promise<ShowcaseResult> {
  await requireShowcaseAdmin();
  if (!Id.safeParse(input.id).success) return fail("This category no longer exists.");
  try {
    await deleteShowcaseCategory(input.id);
  } catch (e) {
    if (e instanceof CategoryNotEmptyError) return fail(e.message);
    throw e;
  }
  refresh();
  return { ok: true };
}
