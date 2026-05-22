/**
 * Image processing utilities for tournament forms.
 * Handles cropping, uploading, and file-to-URL conversion.
 */
import { tournamentAPI } from '../../../api/tournament.api';
import type { TournamentFormData } from '../types';

// ============================================
// CROP
// ============================================

/** Center-crop an image File to exact target dimensions */
export function cropImageToSize(file: File, targetWidth: number, targetHeight: number): Promise<File> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);

            // Already correct size — skip canvas work
            if (img.width === targetWidth && img.height === targetHeight) {
                resolve(file);
                return;
            }

            // Calculate center-crop source rect
            const aspectRatio = targetWidth / targetHeight;
            const imgAspectRatio = img.width / img.height;

            let sourceX = 0, sourceY = 0;
            let sourceWidth = img.width, sourceHeight = img.height;

            if (imgAspectRatio > aspectRatio) {
                sourceWidth = img.height * aspectRatio;
                sourceX = (img.width - sourceWidth) / 2;
            } else {
                sourceHeight = img.width / aspectRatio;
                sourceY = (img.height - sourceHeight) / 2;
            }

            const canvas = document.createElement('canvas');
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                reject(new Error('Failed to get canvas context'));
                return;
            }

            ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, targetWidth, targetHeight);

            canvas.toBlob((blob) => {
                if (!blob) { reject(new Error('Failed to create blob')); return; }
                resolve(new File([blob], file.name, { type: file.type || 'image/png', lastModified: Date.now() }));
            }, file.type || 'image/png', 0.95);
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image'));
        };

        img.src = url;
    });
}

// ============================================
// IMAGE CHANGE HANDLERS
// ============================================

export function createImageHandlers(
    setFormData: React.Dispatch<React.SetStateAction<TournamentFormData>>,
    getEditingId: () => number | null,
) {
    const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const croppedFile = await cropImageToSize(file, 1920, 450);
                setFormData(prev => ({ ...prev, banner: croppedFile }));
            } catch (_error) {
                alert(`Lỗi khi xử lý ảnh banner "${file.name}"`);
            }
        }
    };

    const handleOrganizerLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const croppedFile = await cropImageToSize(file, 300, 100);
                setFormData(prev => ({ ...prev, organizer_logo: croppedFile }));
            } catch (_error) {
                alert(`Lỗi khi xử lý ảnh logo "${file.name}"`);
            }
        }
    };

    const handleSponsorLogosChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const fileArray = Array.from(files);
            const processedFiles: File[] = [];

            for (const file of fileArray) {
                try {
                    const croppedFile = await cropImageToSize(file, 220, 100);
                    processedFiles.push(croppedFile);
                } catch (_error) {
                    alert(`Lỗi khi xử lý ảnh "${file.name}"`);
                }
            }

            if (processedFiles.length > 0) {
                setFormData(prev => ({ ...prev, sponsor_logos: [...prev.sponsor_logos, ...processedFiles] }));
            }
        }
    };

    const handleRemoveSponsorLogo = (index: number) => {
        setFormData(prev => {
            const removed = prev.sponsor_logos[index];
            const editingId = getEditingId();
            if (editingId !== null && typeof removed === 'string') {
                tournamentAPI.deleteImage(editingId, 'sponsor_logo', index).catch((_error) => {
                    alert('Không thể xóa logo nhà tài trợ');
                });
            }
            return { ...prev, sponsor_logos: prev.sponsor_logos.filter((_, i) => i !== index) };
        });
    };

    const handleRemoveBanner = () => {
        const editingId = getEditingId();
        if (editingId !== null) {
            tournamentAPI.deleteImage(editingId, 'banner').catch((_error) => {
                alert('Không thể xóa banner');
            });
        }
        setFormData(prev => ({ ...prev, banner: null }));
    };

    const handleRemoveOrganizerLogo = () => {
        const editingId = getEditingId();
        if (editingId !== null) {
            tournamentAPI.deleteImage(editingId, 'organizer_logo').catch((_error) => {
                alert('Không thể xóa logo giải đấu');
            });
        }
        setFormData(prev => ({ ...prev, organizer_logo: null }));
    };

    return {
        handleBannerChange,
        handleOrganizerLogoChange,
        handleSponsorLogosChange,
        handleRemoveSponsorLogo,
        handleRemoveBanner,
        handleRemoveOrganizerLogo,
    };
}

// ============================================
// UPLOAD FILES → URLs
// ============================================

/** Upload all File objects in formData and return a copy with URLs instead */
export async function uploadFormImages(
    formData: TournamentFormData,
    existingTournament?: Record<string, unknown>,
): Promise<{ banner: string | null; organizer_logo: string | null; sponsor_logos: string[] }> {
    // Banner
    let bannerUrl: string | null;
    if (formData.banner instanceof File) {
        bannerUrl = await tournamentAPI.uploadImage('banner', formData.banner);
    } else if (typeof formData.banner === 'string' && formData.banner.trim() !== '') {
        bannerUrl = formData.banner;
    } else if (existingTournament?.banner) {
        bannerUrl = existingTournament.banner as string;
    } else {
        bannerUrl = null;
    }

    // Organizer logo
    let organizerLogoUrl: string | null;
    if (formData.organizer_logo instanceof File) {
        try {
            organizerLogoUrl = await tournamentAPI.uploadImage('organizer_logo', formData.organizer_logo);
        } catch (error) {
            throw new Error(`Không thể tải lên logo giải đấu: ${error}`);
        }
    } else if (typeof formData.organizer_logo === 'string' && formData.organizer_logo.trim() !== '') {
        organizerLogoUrl = formData.organizer_logo;
    } else if (existingTournament?.organizer_logo) {
        organizerLogoUrl = existingTournament.organizer_logo as string;
    } else {
        organizerLogoUrl = null;
    }

    // Sponsor logos
    const sponsorLogos = formData.sponsor_logos || [];
    const uploadedSponsorLogos: string[] = [];
    for (let i = 0; i < sponsorLogos.length; i++) {
        const logo = sponsorLogos[i];
        if (logo instanceof File) {
            try {
                const url = await tournamentAPI.uploadImage('sponsor_logo', logo);
                uploadedSponsorLogos.push(url);
            } catch (error) {
                throw new Error(`Không thể tải lên logo nhà tài trợ ${i + 1}: ${error}`);
            }
        } else if (typeof logo === 'string') {
            uploadedSponsorLogos.push(logo);
        }
    }

    return { banner: bannerUrl, organizer_logo: organizerLogoUrl, sponsor_logos: uploadedSponsorLogos };
}
