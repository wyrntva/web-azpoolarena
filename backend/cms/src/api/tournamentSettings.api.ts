import axiosClient from './axiosClient';
import type { AxiosResponse } from 'axios';
import type { ScoringRule, TournamentRank } from '../types/api';

export interface RankPayload {
    order: number;
    name: string;
    min_score: number;
    max_score: number;
    default_score: number;
    coefficient: number;
}

export type RankUpdatePayload = Partial<RankPayload>;

export interface ScoringRulePayload {
    name: string;
    description?: string;
    position: number;
    points: number;
    rule_type: ScoringRule['rule_type'];
}

export type ScoringRuleUpdatePayload = Partial<ScoringRulePayload>;

export const tournamentSettingsAPI = {
    // Ranks
    getRanks: (): Promise<AxiosResponse<TournamentRank[]>> => {
        return axiosClient.get('/api/tournament-settings/ranks');
    },

    getRank: (id: number): Promise<AxiosResponse<TournamentRank>> => {
        return axiosClient.get(`/api/tournament-settings/ranks/${id}`);
    },

    createRank: (data: RankPayload): Promise<AxiosResponse<TournamentRank>> => {
        return axiosClient.post('/api/tournament-settings/ranks', data);
    },

    updateRank: (id: number, data: RankUpdatePayload): Promise<AxiosResponse<TournamentRank>> => {
        return axiosClient.put(`/api/tournament-settings/ranks/${id}`, data);
    },

    deleteRank: (id: number): Promise<AxiosResponse<void>> => {
        return axiosClient.delete(`/api/tournament-settings/ranks/${id}`);
    },

    // Scoring rules
    getScoringRules: (): Promise<AxiosResponse<ScoringRule[]>> => {
        return axiosClient.get('/api/tournament-settings/scoring-rules');
    },

    getScoringRule: (id: number): Promise<AxiosResponse<ScoringRule>> => {
        return axiosClient.get(`/api/tournament-settings/scoring-rules/${id}`);
    },

    createScoringRule: (data: ScoringRulePayload): Promise<AxiosResponse<ScoringRule>> => {
        return axiosClient.post('/api/tournament-settings/scoring-rules', data);
    },

    updateScoringRule: (id: number, data: ScoringRuleUpdatePayload): Promise<AxiosResponse<ScoringRule>> => {
        return axiosClient.put(`/api/tournament-settings/scoring-rules/${id}`, data);
    },

    deleteScoringRule: (id: number): Promise<AxiosResponse<void>> => {
        return axiosClient.delete(`/api/tournament-settings/scoring-rules/${id}`);
    },

    getRatingMatrix: (): Promise<AxiosResponse<any[]>> => {
        return axiosClient.get('/api/tournament-settings/scoring-rules/matrix');
    },

    saveRatingMatrix: (data: any[]): Promise<AxiosResponse<void>> => {
        return axiosClient.post('/api/tournament-settings/scoring-rules/matrix', data);
    },
};
