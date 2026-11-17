import { cn } from "@/lib/utils";

/**
 * Skeleton — the single shimmer placeholder primitive. A neutral rounded block
 * with a sweeping highlight driven by the existing `animate-shimmer` keyframe
 * (globals.css). Neutral-only by design: no brand purple. Server-safe.
 *
 * `as="span"` for use inside phrasing content, e.g. a card that is a <button>.
 */
function Skeleton({
  className,
  as: Tag = "div",
  ...props
}: React.HTMLAttributes<HTMLElement> & { as?: "div" | "span" }) {
  return (
    <Tag
      data-slot="skeleton"
      className={cn("relative block overflow-hidden rounded-md bg-muted", className)}
      {...props}
    >
      <span
        aria-hidden
        className="animate-shimmer absolute inset-y-0 left-0 block w-1/2 bg-gradient-to-r from-transparent via-white/55 to-transparent"
      />
    </Tag>
  );
}

export { Skeleton };
