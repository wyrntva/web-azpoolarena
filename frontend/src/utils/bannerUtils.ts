/**
 * Image processing utilities for banner uploads.
 * Handles cropping images to the correct dimensions for different banner types.
 */

export type BannerType = 'scoreboard' | 'tournament' | 'ranking' | 'member';

const BANNER_DIMENSIONS: Record<string, { width: number; height: number }> = {
    ranking: { width: 1920, height: 400 },
    tournament: { width: 1360, height: 280 },
    // Default (scoreboard, member, etc.)
    default: { width: 1920, height: 1080 },
};

/**
 * Crops an image file to the specified dimensions using canvas.
 * Uses cover-fit: scales up to cover target area, then center-crops.
 */
export function cropImageToSize(file: File, targetWidth: number, targetHeight: number): Promise<File> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Canvas not supported'));
                return;
            }

            canvas.width = targetWidth;
            canvas.height = targetHeight;

            // Cover-fit: scale to fill, then center
            const scale = Math.max(targetWidth / img.width, targetHeight / img.height);
            const scaledWidth = img.width * scale;
            const scaledHeight = img.height * scale;
            const offsetX = (canvas.width - scaledWidth) / 2;
            const offsetY = (canvas.height - scaledHeight) / 2;

            ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);

            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(new Error('Failed to crop image'));
                        return;
                    }
                    resolve(new File([blob], file.name, { type: 'image/jpeg' }));
                },
                'image/jpeg',
                0.92
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image'));
        };

        img.src = url;
    });
}

/**
 * Crops an image to the correct dimensions based on banner type.
 */
export function cropImageForBannerType(bannerType: BannerType, file: File): Promise<File> {
    const dims = BANNER_DIMENSIONS[bannerType] || BANNER_DIMENSIONS.default;
    return cropImageToSize(file, dims.width, dims.height);
}
