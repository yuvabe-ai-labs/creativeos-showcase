import { ShowcaseGallerySkeleton } from "@/components/showcase/showcase-gallery-skeleton";
import { ShowcaseShell } from "@/components/showcase/showcase-shell";

// The real logo and intro straight away; only the gallery waits.
export default function Loading() {
  return (
    <ShowcaseShell>
      <ShowcaseGallerySkeleton />
    </ShowcaseShell>
  );
}
