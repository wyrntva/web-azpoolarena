/**
 * Convert TournamentFormData → API payload for create/update.
 * Pure data transformation — no React dependencies.
 */
import type { TournamentFormData } from '../types';

// ============================================
// DATE HELPERS
// ============================================

/** Convert datetime-local string to ISO format for API, or null */
function formatDateForAPI(dateString: string | null | undefined): string | null {
    if (!dateString || dateString.trim() === '') return null;

    // Already full ISO (with seconds)
    if (dateString.includes('T') && dateString.match(/T\d{2}:\d{2}:\d{2}/)) return dateString;

    // datetime-local: YYYY-MM-DDTHH:mm → add seconds
    if (dateString.includes('T') && dateString.match(/T\d{2}:\d{2}$/)) return `${dateString}:00`;

    // date-only: YYYY-MM-DD → add midnight
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) return `${dateString}T00:00:00`;

    return dateString;
}

/** Convert ISO/date string → datetime-local input value (YYYY-MM-DDTHH:mm) in local timezone */
export function formatDateForInput(dateString: string | null | undefined): string {
    if (!dateString) return '';

    // If string has timezone info (Z or ±HH:MM), parse and convert to local time
    if (dateString.endsWith('Z') || dateString.match(/[+-]\d{2}:\d{2}$/)) {
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return '';
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    if (dateString.includes('T')) {
        const [datePart, timePart] = dateString.split('T');
        if (timePart) {
            const timeOnly = timePart.split(':').slice(0, 2).join(':');
            return `${datePart}T${timeOnly}`;
        }
        return `${datePart}T00:00`;
    }

    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) return `${dateString}T00:00`;

    return '';
}

// ============================================
// CONVERT → API PAYLOAD
// ============================================

export function convertFormDataToAPI(
    data: TournamentFormData,
    isUpdate = false,
    existingTournament?: Record<string, unknown>,
): Record<string, unknown> {
    const apiData: Record<string, unknown> = {
        name: data.name,
        slug: data.slug,
        display: data.display,
        public_date: formatDateForAPI(data.public_date),
        status: data.status,
        tournament_type: data.tournament_type,
        knockout_from_round: data.knockout_from_round || null,
        competition_format: data.competition_format || null,
        number_of_players: parseInt(data.number_of_players) || 32,
        start_date: formatDateForAPI(data.start_date),
        registration_start_date: formatDateForAPI(data.registration_start_date),
        registration_end_date: formatDateForAPI(data.registration_end_date),
        location: data.location || null,
        organizer: data.organizer || null,
        support_phone: data.support_phone || null,
        can_register: data.can_register,
        free_table_fee: data.free_table_fee,
        pre_payment: data.pre_payment,
        registration_fee: data.registration_fee ? parseFloat(data.registration_fee) : null,
        total_prize: data.total_prize ? parseFloat(data.total_prize) : null,
        first_prize: data.first_prize ? parseFloat(data.first_prize) : null,
        second_prize: data.second_prize ? parseFloat(data.second_prize) : null,
        third_prize: data.third_prize ? parseFloat(data.third_prize) : null,
        top_5_8_prize: data.top_5_8_prize ? parseFloat(data.top_5_8_prize) : null,
        top_9_16_prize: data.top_9_16_prize ? parseFloat(data.top_9_16_prize) : null,
        top_17_32_prize: data.top_17_32_prize ? parseFloat(data.top_17_32_prize) : null,
        top_33_64_prize: data.top_33_64_prize ? parseFloat(data.top_33_64_prize) : null,
        top_65_128_prize: data.top_65_128_prize ? parseFloat(data.top_65_128_prize) : null,
        top_129_256_prize: data.top_129_256_prize ? parseFloat(data.top_129_256_prize) : null,
        has_draw: data.has_draw,
        draw_touch: data.draw_touch || null,
        handicap_1_touch: data.handicap_1_touch || null,
        handicap_2_touch: data.handicap_2_touch || null,
        round_1_64: data.round_1_64,
        round_1_16: data.round_1_16,
        round_1_32: data.round_1_32,
        round_1_8: data.round_1_8,
        quarter_final: data.quarter_final || null,
        semi_final: data.semi_final || null,
        final: data.final || null,
        draw_from_round: data.draw_from_round || null,
        ranks: data.ranks,
    };

    // --- Image fields ---
    const resolveImageField = (
        value: unknown,
        fallback: unknown,
    ) => (typeof value === 'string' && value.trim() !== '') ? value : (fallback || null);

    if (isUpdate && existingTournament) {
        apiData.banner = resolveImageField(data.banner, existingTournament.banner);
        apiData.organizer_logo = resolveImageField(data.organizer_logo, null);
        apiData.sponsor_logos = (data.sponsor_logos?.length > 0)
            ? data.sponsor_logos.filter((l: unknown) => typeof l === 'string' && (l as string).trim() !== '')
            : [];
    } else {
        apiData.banner = resolveImageField(data.banner, null);
        apiData.organizer_logo = resolveImageField(data.organizer_logo, null);
        apiData.sponsor_logos = (data.sponsor_logos?.length > 0)
            ? data.sponsor_logos.filter((l: unknown) => typeof l === 'string' && (l as string).trim() !== '')
            : [];
    }

    // --- For updates, strip undefined keys but always keep important fields ---
    if (isUpdate) {
        const IMPORTANT_FIELDS = [
            'public_date', 'start_date', 'registration_start_date', 'registration_end_date',
            'banner', 'organizer_logo', 'sponsor_logos',
        ];

        const updateData: Record<string, unknown> = {};
        Object.keys(apiData).forEach(key => {
            if (apiData[key] !== undefined) updateData[key] = apiData[key];
        });

        IMPORTANT_FIELDS.forEach(field => {
            if (field in apiData) {
                updateData[field] = apiData[field];
            } else if (existingTournament) {
                if (field === 'banner' && existingTournament.banner) updateData[field] = existingTournament.banner;
                else if (field === 'organizer_logo' && existingTournament.organizer_logo) updateData[field] = existingTournament.organizer_logo;
                else if (field === 'sponsor_logos' && existingTournament.sponsor_logos) updateData[field] = existingTournament.sponsor_logos;
            }
        });

        return updateData;
    }

    return apiData;
}
