export const SHOWCASE_TITLE_MAX = 80;
export const SHOWCASE_CATEGORY_NAME_MAX = 60;
export const SHOWCASE_CATEGORY_DESCRIPTION_MAX = 160;

/** Uploads are MP4 only: every browser plays it, which a .mov does not promise. */
export const SHOWCASE_VIDEO_TYPES = ["video/mp4"] as const;
export const SHOWCASE_VIDEO_MAX_BYTES = 300 * 1024 * 1024;

export const SHOWCASE_POSTER_TYPE = "image/jpeg";
/** Covers are scaled to this width; cards are at most ~300px wide, the player ~480px. */
export const SHOWCASE_POSTER_MAX_WIDTH = 720;

/** The public page is the site's root; the admin lives under /admin (signed in). */
export const SHOWCASE_PATH = "/";
export const SHOWCASE_ADMIN_PATH = "/admin";
