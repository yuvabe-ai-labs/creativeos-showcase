"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { captureFrameJpeg } from "@/lib/capture-frame";
import { prepareShowcasePosterAction } from "@/lib/actions/showcase";
import { SHOWCASE_POSTER_MAX_WIDTH } from "@/lib/showcase/constants";
import { putWithProgress } from "@/lib/uploads/put";

// The reel's cover : the frame on screen in the admin's player, captured as a JPEG and
// uploaded straight to storage. `posterPath` is set once a cover is uploaded in this session.
export function useShowcaseCover(reelId: string, videoRef: RefObject<HTMLVideoElement | null>) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [posterPath, setPosterPath] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const objectUrl = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    },
    [],
  );

  /** Uploads the frame on screen. Returns its stored path; throws a user-facing Error. */
  async function captureCover(): Promise<string> {
    const video = videoRef.current;
    if (!video || video.readyState < 2) throw new Error("Wait for the video to load, then try again.");
    setBusy(true);
    try {
      video.pause();
      const blob = await captureFrameJpeg(video, SHOWCASE_POSTER_MAX_WIDTH).catch(() => {
        throw new Error("This frame couldn't be captured. Try another moment in the video.");
      });
      const prepared = await prepareShowcasePosterAction({ reelId });
      if (!prepared.ok) throw new Error(prepared.error);
      const ok = await putWithProgress(prepared.signedUrl, blob, "image/jpeg", () => {});
      if (!ok) throw new Error("The cover didn't upload. Try again.");
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
      objectUrl.current = URL.createObjectURL(blob);
      setPreviewUrl(objectUrl.current);
      setPosterPath(prepared.posterPath);
      return prepared.posterPath;
    } finally {
      setBusy(false);
    }
  }

  return { previewUrl, posterPath, busy, captureCover };
}
