"use client";

import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { PublicShowcaseReel } from "@/lib/showcase/types";
import { ShowcasePlayerVideo } from "./showcase-player-video";

// The full player (D506): no share or copy-link button, and the video itself offers no
// download (ShowcasePlayerVideo). Next/previous by button,
// arrow keys or (on a phone) a swipe up or down.
export function ShowcasePlayer({
  reel,
  categoryName,
  onClose,
  onStep,
}: {
  reel: PublicShowcaseReel | null;
  categoryName?: string;
  onClose: () => void;
  onStep: (dir: -1 | 1) => void;
}) {
  const touchY = useRef<number | null>(null);

  useEffect(() => {
    if (!reel) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") onStep(1);
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") onStep(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [reel, onStep]);

  const navButton = "hidden size-11 rounded-full border border-white/15 bg-white/10 text-white hover:bg-white/20 hover:text-white sm:inline-flex";

  return (
    <Dialog open={reel !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        // A dark backdrop: the player's light controls sit on it, and the video reads better.
        overlayClassName="bg-neutral-950/85 supports-backdrop-filter:backdrop-blur-sm"
        className="h-dvh max-h-dvh w-screen max-w-none gap-0 rounded-none bg-transparent p-0 ring-0 sm:flex sm:h-auto sm:w-auto sm:max-w-none sm:items-center sm:gap-5"
        // Our own close button sits inside the video, top right (see below).
        showCloseButton={false}
      >
        {reel && (
          <>
            <Button variant="ghost" size="icon" aria-label="Previous reel" onClick={() => onStep(-1)} className={navButton}>
              <ChevronLeft strokeWidth={1.5} />
            </Button>
            <div
              className="relative h-full w-full overflow-hidden bg-black shadow-lg sm:aspect-[9/16] sm:h-[min(86dvh,calc((100vw-2rem)*16/9))] sm:w-auto sm:rounded-2xl"
              onTouchStart={(e) => (touchY.current = e.touches[0].clientY)}
              onTouchEnd={(e) => {
                if (touchY.current === null) return;
                const dy = e.changedTouches[0].clientY - touchY.current;
                touchY.current = null;
                if (Math.abs(dy) > 60) onStep(dy < 0 ? 1 : -1);
              }}
            >
              <ShowcasePlayerVideo key={reel.id} reel={reel} />
              <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/55 to-transparent px-4 pt-3.5 pb-8 pr-16 text-white">
                <DialogTitle className="font-medium text-white">{reel.title}</DialogTitle>
                {categoryName && <p className="text-sm text-white/75">{categoryName}</p>}
                <p className="mt-2 flex items-center gap-1.5 font-display text-xs font-semibold text-white/75">
                  {/* eslint-disable-next-line @next/next/no-img-element -- a 64px static mark */}
                  <img src="/brand/yuvabe-studios-mark.png" alt="" className="size-5" />
                  Yuvabe Studios
                </p>
              </div>
              {/* Inside the video, opposite the title: the same place on a phone and a desktop. */}
              <DialogClose
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Close"
                    className="absolute top-3 right-3 size-10 rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60 hover:text-white"
                  />
                }
              >
                <X strokeWidth={1.5} />
              </DialogClose>
            </div>
            <Button variant="ghost" size="icon" aria-label="Next reel" onClick={() => onStep(1)} className={navButton}>
              <ChevronRight strokeWidth={1.5} />
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
