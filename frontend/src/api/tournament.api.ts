import axiosClient from './axiosClient';
import type { AxiosResponse } from 'axios';

export interface Tournament {
    id: number;
    name: string;
    slug: string;
    banner: string | null;
    organizer_logo: string | null;
    sponsor_logos: string[];
    ranks: string[];
    display: string;
    public_date: string | null;
    status: string;
    tournament_type: string;
    knockout_from_round: string | null;
    competition_format: string | null;
    number_of_players: number;
    start_date: string | null;
    registration_start_date: string | null;
    registration_end_date: string | null;
    location: string | null;
    organizer: string | null;
    support_phone: string | null;
    can_register: boolean;
    free_table_fee: boolean;
    pre_payment: boolean;
    registration_fee: number | null;
    total_prize: number | null;
    first_prize: number | null;
    second_prize: number | null;
    third_prize: number | null;
    top_5_8_prize: number | null;
    top_9_16_prize: number | null;
    top_17_32_prize: number | null;
    top_33_64_prize: number | null;
    top_65_128_prize: number | null;
    top_129_256_prize: number | null;
    has_draw: boolean;
    draw_touch: string | null;
    handicap_1_touch: string | null;
    handicap_2_touch: string | null;
    round_1_64: boolean;
    round_1_16: boolean;
    round_1_32: boolean;
    round_1_8: boolean;
    quarter_final: string | null;
    draw_from_round: string | null;
    semi_final: string | null;
    final: string | null;
    registration_count?: number;
    created_at: string;
    updated_at: string;
}

export interface TournamentCreate {
    name: string;
    slug: string;
    banner?: string | null;
    organizer_logo?: string | null;
    sponsor_logos?: string[];
    ranks?: string[];
    display?: string;
    public_date?: string | null;
    status?: string;
    tournament_type?: string;
    knockout_from_round?: string | null;
    competition_format?: string | null;
    number_of_players?: number;
    start_date?: string | null;
    registration_start_date?: string | null;
    registration_end_date?: string | null;
    location?: string | null;
    organizer?: string | null;
    support_phone?: string | null;
    can_register?: boolean;
    free_table_fee?: boolean;
    pre_payment?: boolean;
    registration_fee?: number | null;
    total_prize?: number | null;
    first_prize?: number | null;
    second_prize?: number | null;
    third_prize?: number | null;
    top_5_8_prize?: number | null;
    top_9_16_prize?: number | null;
    top_17_32_prize?: number | null;
    top_33_64_prize?: number | null;
    top_65_128_prize?: number | null;
    top_129_256_prize?: number | null;
    has_draw?: boolean;
    draw_touch?: string | null;
    handicap_1_touch?: string | null;
    handicap_2_touch?: string | null;
    round_1_64?: boolean;
    round_1_16?: boolean;
    round_1_32?: boolean;
    round_1_8?: boolean;
    quarter_final?: string | null;
    draw_from_round?: string | null;
    semi_final?: string | null;
    final?: string | null;
}

export type TournamentUpdate = Partial<TournamentCreate>;

export interface PaginatedResponse<T> {
    data: T;
    meta: {
        total: number;
        skip: number;
        limit: number;
    };
}

export interface TournamentMatch {
    id: number;
    tournament_id: number;
    match_no: number;
    bracket: 'winners' | 'losers' | 'knockout';
    round: number;
    player1_id: number | null;
    player2_id: number | null;
    player1_score: number;
    player2_score: number;
    table_no?: string | null;
    match_time?: string | null;
    status: 'pending' | 'upcoming' | 'ongoing' | 'completed';
    player1_check_in?: string;
    player2_check_in?: string;
    winner_id: number | null;
    created_at?: string | null;
    updated_at?: string | null;
}

export interface TournamentMatchUpsert {
    bracket: TournamentMatch['bracket'];
    round: number;
    player1_id?: number | null;
    player2_id?: number | null;
    player1_score?: number;
    player2_score?: number;
    table_no?: string | null;
    match_time?: string | null;
    status?: TournamentMatch['status'];
    player1_check_in?: string;
    player2_check_in?: string;
    winner_id?: number | null;
}

export const tournamentAPI = {
    getTournaments: (params?: { skip?: number; limit?: number }): Promise<AxiosResponse<PaginatedResponse<Tournament[]>>> => {
        return axiosClient.get('/api/tournaments', { params });
    },

    getPublicTournaments: (params?: { skip?: number; limit?: number }): Promise<AxiosResponse<PaginatedResponse<Tournament[]>>> => {
        return axiosClient.get('/api/tournaments/public', { params });
    },

    getTournament: (id: number): Promise<AxiosResponse<Tournament>> => {
        return axiosClient.get(`/api/tournaments/${id}`);
    },

    createTournament: (data: TournamentCreate): Promise<AxiosResponse<Tournament>> => {
        return axiosClient.post('/api/tournaments', data);
    },

    updateTournament: (id: number, data: TournamentUpdate): Promise<AxiosResponse<Tournament>> => {
        return axiosClient.put(`/api/tournaments/${id}`, data);
    },

    deleteTournament: (id: number): Promise<AxiosResponse<void>> => {
        return axiosClient.delete(`/api/tournaments/${id}`);
    },

    getBracket: (tournamentId: number): Promise<AxiosResponse<TournamentMatch[]>> => {
        return axiosClient.get(`/api/tournaments/${tournamentId}/bracket`);
    },

    upsertMatch: (tournamentId: number, matchNo: number, data: TournamentMatchUpsert): Promise<AxiosResponse<TournamentMatch>> => {
        return axiosClient.put(`/api/tournaments/${tournamentId}/matches/${matchNo}`, data);
    },

    uploadImage: async (imageType: 'banner' | 'organizer_logo' | 'sponsor_logo', file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await axiosClient.post(`/api/tournaments/upload-image?image_type=${imageType}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data.url;
    },

    deleteImage: (tournamentId: number, imageType: 'banner' | 'organizer_logo' | 'sponsor_logo', sponsorIndex?: number): Promise<AxiosResponse<void>> => {
        const params: Record<string, string | number> = { image_type: imageType };
        if (typeof sponsorIndex === 'number') {
            params.sponsor_index = sponsorIndex;
        }
        return axiosClient.delete(`/api/tournaments/${tournamentId}/image`, { params });
    },

    getRegistrations: (tournamentId: number): Promise<AxiosResponse<TournamentRegisteredPlayer[]>> => {
        return axiosClient.get(`/api/tournaments/${tournamentId}/registrations`);
    },

    getEligibleUsers: (tournamentId: number, search?: string): Promise<AxiosResponse<TournamentEligibleUser[]>> => {
        const params = search ? { search } : {};
        return axiosClient.get(`/api/tournaments/${tournamentId}/eligible-users`, { params });
    },

    registerPlayer: (tournamentId: number, userId: number): Promise<AxiosResponse<TournamentRegisteredPlayer>> => {
        return axiosClient.post(`/api/tournaments/${tournamentId}/registrations`, { user_id: userId });
    },

    unregisterPlayer: (tournamentId: number, userId: number): Promise<AxiosResponse<void>> => {
        return axiosClient.delete(`/api/tournaments/${tournamentId}/registrations/${userId}`);
    },
};

export interface TournamentRegisteredPlayer {
    id: number;
    full_name: string;
    phone_number: string;
    rank?: string | null;
    avatar_url?: string | null;
    registered_at: string | null;
}

export interface TournamentEligibleUser {
    id: number;
    full_name: string;
    phone_number: string;
    rank?: string | null;
    avatar_url?: string | null;
    email?: string | null;
}
