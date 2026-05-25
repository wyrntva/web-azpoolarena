'use client';

/**
 * Custom image loader for Next.js that bypasses the built-in /_next/image
 * optimization endpoint entirely. Returns the original image URL as-is.
 *
 * This is needed because the production server's /_next/image endpoint
 * returns 404 (missing sharp, or blocked by nginx/reverse-proxy).
 */
export default function imageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  return src;
}
