import { NextResponse } from "next/server";
import { getCaller } from "@/lib/auth/require-showcase-admin";

// Same-origin media proxy, so the admin can read a frame of a stored video back out of a
// canvas for the reel's cover (the bucket sends no CORS headers). Showcase admins only, and
// locked to the storage host so it is not an open relay. Ported from CreativeOS's
// api/image-proxy, which explains the Range handling in full.
const ALLOWED_PREFIX = "https://storage.googleapis.com/";
const PASS_THROUGH = ["content-range", "content-length", "content-type", "etag", "last-modified"];

export async function GET(req: Request) {
  const caller = await getCaller();
  if (!caller?.canManage) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const target = new URL(req.url).searchParams.get("url");
  if (!target || !target.startsWith(ALLOWED_PREFIX)) {
    return NextResponse.json({ error: "Invalid media url" }, { status: 400 });
  }
  // Forward the browser's Range so seeking works (a 206 is the success case).
  const range = req.headers.get("range");
  let upstream: Response;
  try {
    upstream = await fetch(target, range ? { headers: { Range: range } } : undefined);
  } catch {
    return NextResponse.json({ error: "Failed to fetch media" }, { status: 502 });
  }
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "Failed to fetch media" }, { status: upstream.status || 502 });
  }
  const headers = new Headers({
    "content-type": upstream.headers.get("content-type") ?? "application/octet-stream",
    "cache-control": "private, max-age=300",
    "accept-ranges": "bytes",
  });
  for (const name of PASS_THROUGH) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  return new Response(upstream.body, { status: upstream.status, headers });
}
