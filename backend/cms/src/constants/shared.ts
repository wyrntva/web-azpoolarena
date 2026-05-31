/**
 * Shared constants and utilities used across multiple views.
 * Centralized here to avoid duplication and ensure consistency.
 */

import defaultAvatarImage from '../assets/images/generic-profile_mini_dcryfs.webp';

// ============================================
// API BASE URL
// ============================================

export const API_BASE = import.meta.env.VITE_API_URL || '';

// ============================================
// LABELS & MAPS
// ============================================

export const GENDER_LABELS: Record<string, string> = {
    male: 'Nam',
    female: 'Nữ',
    other: 'Khác',
};

export const TOURNAMENT_STATUS_MAP: Record<string, string> = {
    'upcoming': 'Sắp diễn ra',
    'ongoing': 'Đang diễn ra',
    'completed': 'Đã hoàn thành',
    'cancelled': 'Đã hủy',
};

export const TOURNAMENT_TYPE_MAP: Record<string, string> = {
    'knockout': 'Loại trực tiếp',
    'double_elimination': 'Nhánh thắng thua',
};

/**
 * Returns the Vietnamese label for a tournament type.
 */
export function getTournamentTypeLabel(type: string | null | undefined): string {
    if (!type) return '-';
    return TOURNAMENT_TYPE_MAP[type] || type;
}

// ============================================
// AVATAR HELPERS
// ============================================

export const defaultAvatar = defaultAvatarImage;

/**
 * Resolves an avatar URL to a full, usable URL.
 * Handles: null/undefined → default, absolute URLs, and relative paths.
 */
export function getAvatarUrl(url: string | null | undefined): string {
    if (!url) return defaultAvatar;
    return url.startsWith('http') ? url : `${API_BASE}${url}`;
}

/**
 * Resolves a general image URL (banners, logos, etc.) to a full URL.
 * Returns null if no URL is provided.
 */
export function getImageUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    return url.startsWith('http') ? url : `${API_BASE}${url}`;
}
