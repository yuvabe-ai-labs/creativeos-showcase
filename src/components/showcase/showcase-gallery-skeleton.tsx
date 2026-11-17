import { Skeleton } from "@/components/ui/skeleton";

const CHIP_WIDTHS = ["w-24", "w-36", "w-36", "w-40", "w-28", "w-32"];

/** One reel card's placeholder, the same shape and spacing as ShowcaseReelCard. */
export function ShowcaseReelCardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="aspect-[9/16] w-full rounded-2xl" />
      <Skeleton className="mx-0.5 h-4 w-3/4" />
    </div>
  );
}

// The gallery while the reels load: chips, then two sections of cards, laid out exactly like
// ShowcaseGallery so nothing jumps when the real page arrives.
export function ShowcaseGallerySkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading reels">
      <div className="flex gap-2 overflow-hidden py-3">
        {CHIP_WIDTHS.map((w, i) => (
          <Skeleton key={i} className={`h-9 shrink-0 rounded-full ${w}`} />
        ))}
      </div>
      <div className="space-y-12">
        {[0, 1].map((section) => (
          <div key={section} className="pt-8">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="mt-2 h-4 w-72 max-w-full" />
            <div className="mt-5 grid grid-cols-2 gap-x-3.5 gap-y-7 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 5 }, (_, i) => (
                <ShowcaseReelCardSkeleton key={i} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
