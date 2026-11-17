"use client";

export class FrameCaptureError extends Error {}

// The paused frame as a JPEG no wider than `maxWidth` (the reel's cover). The video must be
// same-origin, or the canvas is "tainted" and can't be read: a local file's blob URL, or a
// stored file through /api/media (the bucket sends no CORS headers).
export function captureFrameJpeg(video: HTMLVideoElement, maxWidth: number): Promise<Blob> {
  const scale = Math.min(1, maxWidth / (video.videoWidth || maxWidth));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx || canvas.width === 0) return Promise.reject(new FrameCaptureError("This frame can't be captured."));
  try {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  } catch {
    return Promise.reject(new FrameCaptureError("This frame can't be captured."));
  }
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new FrameCaptureError("This frame can't be captured."))),
        "image/jpeg",
        0.85,
      );
    } catch {
      reject(new FrameCaptureError("This frame can't be captured."));
    }
  });
}
