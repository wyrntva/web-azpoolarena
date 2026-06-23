import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs';

const CONVERTIBLE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg']);

/**
 * Convert a PNG/JPEG file to WebP in-place.
 * Returns the new file path (with .webp extension).
 * If the file is already WebP or an unsupported format, returns the original path unchanged.
 */
export async function convertToWebp(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();
  if (!CONVERTIBLE_EXTENSIONS.has(ext)) return filePath;

  const webpPath = filePath.slice(0, -ext.length) + '.webp';
  await sharp(filePath).webp({ quality: 95, smartSubsample: true, effort: 6 }).toFile(webpPath);
  fs.unlinkSync(filePath);
  return webpPath;
}

/**
 * Given a /uploads/... URL and its new file path after conversion,
 * return the updated URL with .webp extension.
 */
export function toWebpUrl(originalUrl: string): string {
  return originalUrl.replace(/\.(png|jpg|jpeg)$/i, '.webp');
}
