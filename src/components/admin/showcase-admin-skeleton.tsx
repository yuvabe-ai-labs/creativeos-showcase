import { Skeleton } from "@/components/ui/skeleton";

const SECTIONS = [3, 2, 2];

/** Category cards with reel rows, shaped like ShowcaseAdmin's list and ShowcaseReelRow. */
export function ShowcaseAdminSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading reels">
      {SECTIONS.map((rows, s) => (
        <div key={s} className="rounded-xl border border-border bg-card px-4 pt-3 pb-1 shadow-card">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: rows }, (_, i) => (
              <div key={i} className="flex items-center gap-3 py-2.5">
                <Skeleton className="aspect-[9/16] w-11 shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-5 w-9 rounded-full" />
                <Skeleton className="h-7 w-28" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
