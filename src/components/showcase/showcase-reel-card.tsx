"use client";

import { useRef, useState } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatReelDuration } from "@/lib/showcase/utils";
import type { PublicShowcaseReel } from "@/lib/showcase/types";

// A 9:16 reel card. It shows the cover image; the video itself is only fetched when a mouse
// hovers it (a muted preview), so a page of reels doesn't start a download per card.
export function ShowcaseReelCard({
  reel,
  onOpen,
}: {
  reel: PublicShowcaseReel;
  onOpen: () => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [previewing, setPreviewing] = useState(false);
  const [armed, setArmed] = useState(false);
  // A shimmer until the cover has loaded. The ref callback also catches a cover that loaded
  // (from cache) before React attached onLoad.
  const [coverReady, setCoverReady] = useState(false);

  const start = () => {
    setArmed(true);
    // The src lands on the next render; play once it can.
    requestAnimationFrame(() => {
      ref.current
        ?.play()
        .then(() => setPreviewing(true))
        .catch(() => {});
    });
  };
  const stop = () => {
    ref.current?.pause();
    setPreviewing(false);
  };

  return (
    <Button
      variant="ghost"
      onClick={onOpen}
      onPointerEnter={(e) => e.pointerType === "mouse" && start()}
      onPointerLeave={stop}
      aria-label={`Play ${reel.title}`}
      className="group/reel h-auto w-full min-w-0 flex-col items-stretch justify-start self-start gap-3 rounded-2xl p-0 text-left font-normal whitespace-normal hover:bg-transparent"
    >
      <span className="relative block aspect-[9/16] overflow-hidden rounded-2xl border border-border bg-muted shadow-card transition-transform duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/reel:-translate-y-0.5 group-hover/reel:scale-[1.006]">
        {reel.posterUrl && !coverReady && <Skeleton as="span" className="absolute inset-0 rounded-none" />}
        {reel.posterUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- a stored file on our bucket; next/image would proxy every cover
          <img
            ref={(img) => {
              if (img?.complete && img.naturalWidth > 0) setCoverReady(true);
            }}
            src={reel.posterUrl}
            alt=""
            loading="lazy"
            onLoad={() => setCoverReady(true)}
            className={cn(
              "absolute inset-0 size-full object-cover transition-opacity duration-200",
              coverReady ? "opacity-100" : "opacity-0",
            )}
          />
        )}
        <video
          ref={ref}
          src={armed || !reel.posterUrl ? reel.videoUrl + (reel.posterUrl ? "" : "#t=0.5") : undefined}
          muted
          loop
          playsInline
          preload={reel.posterUrl ? "none" : "metadata"}
          disablePictureInPicture
          onContextMenu={(e) => e.preventDefault()}
          className={cn(
            "pointer-events-none absolute inset-0 size-full object-cover transition-opacity duration-200",
            previewing || !reel.posterUrl ? "opacity-100" : "opacity-0",
          )}
        />
        <span className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/55 to-transparent" />
        <span
          className={cn(
            "absolute bottom-3 left-3 flex size-9 items-center justify-center rounded-full bg-white/90 text-neutral-900 transition-opacity duration-200",
            previewing && "opacity-0",
          )}
        >
          <Play className="size-4 translate-x-px" strokeWidth={1.5} />
        </span>
        {reel.durationMs && (
          <span className="absolute right-2.5 bottom-3.5 text-xs font-medium text-white [text-shadow:0_1px_2px_rgba(0,0,0,.4)]">
            {formatReelDuration(reel.durationMs)}
          </span>
        )}
      </span>
      <span className="block px-0.5 leading-snug font-medium text-foreground">{reel.title}</span>
    </Button>
  );
}
