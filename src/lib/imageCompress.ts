/**
 * Shared image compression utility for Bluesky post/embed uploads.
 *
 * Target sizes: the AppView accepts up to 2 MB (raised from 1 MB on 2026-04-08
 * via atproto PR #4823). Some PDSes running older server code may still enforce
 * the 1 MB ceiling, so call sites should retry with IMAGE_FALLBACK_BYTES when
 * `isBlobTooLargeError` fires on upload.
 *
 * Algorithm matches the official client (social-app PR #10117): start at
 * min(longerSide, 4000)px and iterate with a 0.8 scale factor, max 5 depth.
 * Quality steps run inside each resolution before downsizing further, so
 * resolution is preserved as long as JPEG quality alone can meet the budget.
 */

/** Primary upload target after atproto #4823 (merged 2026-04-08). */
export const IMAGE_MAX_BYTES = 2_000_000;

/** Fallback target for PDSes that still enforce the legacy 1 MB ceiling. */
export const IMAGE_FALLBACK_BYTES = 1_000_000;

const INITIAL_MAX_DIMENSION = 4000;
const SCALE_FACTOR = 0.8;
const MAX_ATTEMPTS = 5;
const QUALITY_STEPS = [0.85, 0.7, 0.5, 0.3];

export interface CompressedImage {
  blob: Blob;
  width: number;
  height: number;
}

export async function compressImage(
  source: Blob | File,
  targetBytes: number = IMAGE_MAX_BYTES,
): Promise<CompressedImage> {
  const bitmap = await createImageBitmap(source);

  if (source.size <= targetBytes) {
    const w = bitmap.width;
    const h = bitmap.height;
    bitmap.close();
    return { blob: source, width: w, height: h };
  }

  const origMaxDim = Math.max(bitmap.width, bitmap.height);
  let currentMaxDim = Math.min(origMaxDim, INITIAL_MAX_DIMENSION);
  let smallestSoFar: CompressedImage | null = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const scale = currentMaxDim / origMaxDim;
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = new OffscreenCanvas(w, h);
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(bitmap, 0, 0, w, h);

    for (const quality of QUALITY_STEPS) {
      const blob = await canvas.convertToBlob({ type: "image/jpeg", quality });
      if (blob.size <= targetBytes) {
        bitmap.close();
        return { blob, width: w, height: h };
      }
      if (!smallestSoFar || blob.size < smallestSoFar.blob.size) {
        smallestSoFar = { blob, width: w, height: h };
      }
    }

    currentMaxDim = Math.floor(currentMaxDim * SCALE_FACTOR);
  }

  bitmap.close();
  if (!smallestSoFar) {
    throw new Error("Image compression failed to produce any output");
  }
  return smallestSoFar;
}

/** Convenience wrapper: returns a File ready to hand to agent.uploadBlob. */
export async function compressImageFile(
  file: File,
  targetBytes: number = IMAGE_MAX_BYTES,
): Promise<File> {
  const { blob } = await compressImage(file, targetBytes);
  if (blob === file) return file;
  const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
  return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
}

/** Read pixel dimensions without re-encoding. */
export async function getImageDimensions(
  source: Blob | File,
): Promise<{ width: number; height: number }> {
  const bitmap = await createImageBitmap(source);
  const dim = { width: bitmap.width, height: bitmap.height };
  bitmap.close();
  return dim;
}

/**
 * Detect PDS rejections indicating the blob exceeded the server's size ceiling.
 * Matches both HTTP 413 and atproto's `BlobTooLarge` / descriptive error bodies.
 */
export function isBlobTooLargeError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { status?: number; error?: string; message?: string };
  if (e.status === 413) return true;
  if (e.error === "BlobTooLarge") return true;
  const msg = (e.message ?? "").toLowerCase();
  return msg.includes("blob too large") || msg.includes("payload too large");
}
