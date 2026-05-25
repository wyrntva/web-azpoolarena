import api from '@/config/axios';

export interface StoreSettings {
    id: number;
    name: string;
    phone: string | null;
    currency: string;
    address: string | null;
    province: string | null;
    district: string | null;
    ward: string | null;
    business_type: string | null;
    // Social media fields
    tiktok_url: string | null;
    facebook_url: string | null;
    youtube_url: string | null;
    phone_number: string | null;
    gmail: string | null;
    social_address: string | null;
    // Banner fields
    banner_scoreboard: string | null;
    banner_tournament: string | null;
    banner_ranking: string | null;
    banner_member: string | null;
    created_at: string;
    updated_at: string;
}

export const storeSettingsAPI = {
    get: () => api.get<StoreSettings>('/api/store-settings/public'),
};
