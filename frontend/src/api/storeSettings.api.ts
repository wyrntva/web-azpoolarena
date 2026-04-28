import axiosClient from './axiosClient';
import type { AxiosResponse } from 'axios';

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

export interface StoreSettingsUpdate {
    name?: string;
    phone?: string | null;
    currency?: string;
    address?: string | null;
    province?: string | null;
    district?: string | null;
    ward?: string | null;
    business_type?: string | null;
    // Social media fields
    tiktok_url?: string | null;
    facebook_url?: string | null;
    youtube_url?: string | null;
    phone_number?: string | null;
    gmail?: string | null;
    social_address?: string | null;
    // Banner fields
    banner_scoreboard?: string | null;
    banner_tournament?: string | null;
    banner_ranking?: string | null;
    banner_member?: string | null;
}

export const storeSettingsAPI = {
    get: (): Promise<AxiosResponse<StoreSettings>> => {
        return axiosClient.get('/api/store-settings');
    },

    update: (data: StoreSettingsUpdate): Promise<AxiosResponse<StoreSettings>> => {
        return axiosClient.put('/api/store-settings', data);
    },

    uploadBanner: (bannerType: 'scoreboard' | 'tournament' | 'ranking' | 'member', file: File): Promise<AxiosResponse<StoreSettings>> => {
        const formData = new FormData();
        formData.append('file', file);
        return axiosClient.post(`/api/store-settings/banner/${bannerType}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },


    deleteBanner: (bannerType: 'scoreboard' | 'tournament', bannerIndex: number): Promise<AxiosResponse<StoreSettings>> => {
        return axiosClient.delete(`/api/store-settings/banner/${bannerType}/${bannerIndex}`);
    },

    deleteSingleBanner: (bannerType: 'tournament' | 'ranking' | 'member'): Promise<AxiosResponse<StoreSettings>> => {
        return axiosClient.delete(`/api/store-settings/banner/${bannerType}`);
    },
};
