import "server-only";
import { objectExists, publicUrlFor, removeObject, signPutUrl } from "./gcs";

// Each reel's own files live under showcase/<reel id>/ (CreativeOS D503), so deleting a reel
// removes exactly its files and nothing a CreativeOS canvas still uses.

const UPLOAD_EXPIRY_MS = 30 * 60 * 1000;
const POSTER_EXPIRY_MS = 5 * 60 * 1000;

export type SignedUpload = { signedUrl: string; path: string; url: string };

/** "video__2026-11-17T10-00-00-000Z.mp4": unique per write, so a replaced file is a new URL. */
function storedName(slug: string, ext: string): string {
  return `${slug}__${new Date().toISOString().replace(/:/g, "-").replace(".", "-")}.${ext}`;
}

export function pathForShowcaseVideo(reelId: string, ext: string): string {
  return `showcase/${reelId}/${storedName("video", ext)}`;
}

export function pathForShowcasePoster(reelId: string): string {
  return `showcase/${reelId}/${storedName("cover", "jpg")}`;
}

export async function signShowcaseVideoUpload(args: { reelId: string; contentType: string }): Promise<SignedUpload> {
  const path = pathForShowcaseVideo(args.reelId, "mp4");
  const signedUrl = await signPutUrl(path, args.contentType, UPLOAD_EXPIRY_MS);
  return { signedUrl, path, url: publicUrlFor(path) };
}

export async function signShowcasePosterUpload(args: { reelId: string }): Promise<SignedUpload> {
  const path = pathForShowcasePoster(args.reelId);
  const signedUrl = await signPutUrl(path, "image/jpeg", POSTER_EXPIRY_MS);
  return { signedUrl, path, url: publicUrlFor(path) };
}

export async function showcaseFileExists(path: string): Promise<boolean> {
  return objectExists(path);
}

/** Best effort: a file left behind costs a little storage, never a broken page. */
export async function removeShowcaseFiles(paths: (string | null | undefined)[]): Promise<void> {
  await Promise.allSettled(paths.filter((p): p is string => !!p).map((p) => removeObject(p)));
}
