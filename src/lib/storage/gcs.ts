import "server-only";
import { Storage } from "@google-cloud/storage";

// The CreativeOS media bucket (public read). Same client setup as CreativeOS's gcs.ts.
let storage: Storage | null = null;

function getStorage(): Storage {
  if (storage) return storage;
  const projectId = process.env.GCP_PROJECT_ID;
  const keyBase64 = process.env.GCP_SERVICE_ACCOUNT_KEY_BASE64;
  if (!projectId) throw new Error("Missing GCP_PROJECT_ID.");
  if (keyBase64) {
    storage = new Storage({ projectId, credentials: JSON.parse(Buffer.from(keyBase64, "base64").toString("utf8")) });
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.K_SERVICE) {
    storage = new Storage({ projectId });
  } else {
    throw new Error("Missing GCS credentials: set GCP_SERVICE_ACCOUNT_KEY_BASE64 or GOOGLE_APPLICATION_CREDENTIALS.");
  }
  return storage;
}

export function getBucketName(): string {
  const name = process.env.GCS_BUCKET;
  if (!name) throw new Error("Missing GCS_BUCKET.");
  return name;
}

const bucket = () => getStorage().bucket(getBucketName());

export function publicUrlFor(path: string): string {
  return `https://storage.googleapis.com/${getBucketName()}/${path}`;
}

/** A V4 signed URL for one direct browser upload (PUT) of exactly this path and type. */
export async function signPutUrl(path: string, contentType: string, expiresMs: number): Promise<string> {
  const [url] = await bucket().file(path).getSignedUrl({ version: "v4", action: "write", expires: Date.now() + expiresMs, contentType });
  return url;
}

export async function objectExists(path: string): Promise<boolean> {
  const [exists] = await bucket().file(path).exists();
  return exists;
}

export async function removeObject(path: string): Promise<void> {
  await bucket().file(path).delete({ ignoreNotFound: true });
}
