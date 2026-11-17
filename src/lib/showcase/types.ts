// The showcase: a public page of sample reels, curated by showcase admins.
// Tables and decisions: CreativeOS migration 0063, ADR D501–D506.

export type ShowcaseCategory = {
  id: string;
  /** Set once from the first name; never follows a rename (links keep working). */
  slug: string;
  name: string;
  description: string | null;
  sortOrder: number;
};

/** A reel's place in one category: a reel can be in several (D504). */
export type ReelPlacement = { categoryId: string; sortOrder: number };

/** A reel as the admin sees it. */
export type ShowcaseReel = {
  id: string;
  title: string;
  videoUrl: string;
  posterUrl: string | null;
  durationMs: number | null;
  isPublished: boolean;
  placements: ReelPlacement[];
};

/** A reel as the public page sees it: only what it shows. */
export type PublicShowcaseReel = Omit<ShowcaseReel, "isPublished">;
