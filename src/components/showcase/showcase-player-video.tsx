"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PublicShowcaseReel } from "@/lib/showcase/types";

// The player's video, with a quiet spinner over the cover while it loads or re-buffers.
// Mounted per reel (keyed by the caller), so the loading state starts fresh on next/previous.
// No download item, no picture-in-picture, no right-click "Save video as" (D506).
export function ShowcasePlayerVideo({ reel }: { reel: PublicShowcaseReel }) {
  const [buffering, setBuffering] = useState(true);

  return (
    <>
      <video
        src={reel.videoUrl}
        poster={reel.posterUrl ?? undefined}
        controls
        autoPlay
        playsInline
        controlsList="nodownload noplaybackrate noremoteplayback"
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()}
        onWaiting={() => setBuffering(true)}
        onPlaying={() => setBuffering(false)}
        onCanPlay={() => setBuffering(false)}
        onPause={() => setBuffering(false)}
        className="size-full bg-black object-contain"
      />
      <span
        aria-hidden={!buffering}
        role="status"
        className={cn(
          "pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-200",
          buffering ? "opacity-100" : "opacity-0",
        )}
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-black/45 backdrop-blur-sm">
          <Loader2 className="size-5 animate-spin text-white" strokeWidth={1.5} />
          <span className="sr-only">Loading video</span>
        </span>
      </span>
    </>
  );
}
