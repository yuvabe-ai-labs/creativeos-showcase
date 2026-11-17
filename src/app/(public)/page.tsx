import { ShowcaseGallery } from "@/components/showcase/showcase-gallery";
import { ShowcaseShell } from "@/components/showcase/showcase-shell";
import { listPublishedShowcaseReels, listShowcaseCategories } from "@/lib/db/showcase";

// The public reel gallery sales send to prospects. No sign-in. Kept out of search results
// (root layout): some reels are not yet published by the brands themselves.
export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const [{ category }, categories, reels] = await Promise.all([
    searchParams,
    listShowcaseCategories(),
    listPublishedShowcaseReels(),
  ]);

  return (
    <ShowcaseShell>
      <ShowcaseGallery categories={categories} reels={reels} initialCategory={category} />
    </ShowcaseShell>
  );
}
