import axiosClient from './axiosClient';
import type { AxiosResponse } from 'axios';
import type { ScoringRule, TournamentRank, TournamentCoefficient, TournamentRound } from '../types/api';

export interface RoundPayload {
    name: string;
    description?: string;
    order: number;
    tournament_type?: string;
    number_of_players?: number;
    multiplier?: number;
    is_active?: boolean;
}

export type RoundUpdatePayload = Partial<RoundPayload>;

export interface RankPayload {
    order: number;
    name: string;
    min_score: number;
    max_score: number;
    default_score: number;
}

export interface CoefficientPayload {
    order: number;
    name: string;
    value: number;
    description?: string;
}

export type CoefficientUpdatePayload = Partial<CoefficientPayload>;

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
    // Rounds
    getRounds: (): Promise<AxiosResponse<TournamentRound[]>> => {
        return axiosClient.get('/api/tournament-settings/rounds');
    },

    getRound: (id: number): Promise<AxiosResponse<TournamentRound>> => {
        return axiosClient.get(`/api/tournament-settings/rounds/${id}`);
    },

    createRound: (data: RoundPayload): Promise<AxiosResponse<TournamentRound>> => {
        return axiosClient.post('/api/tournament-settings/rounds', data);
    },

    updateRound: (id: number, data: RoundUpdatePayload): Promise<AxiosResponse<TournamentRound>> => {
        return axiosClient.put(`/api/tournament-settings/rounds/${id}`, data);
    },

    deleteRound: (id: number): Promise<AxiosResponse<void>> => {
        return axiosClient.delete(`/api/tournament-settings/rounds/${id}`);
    },

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

    // Table fee
    getTableFee: (): Promise<AxiosResponse<{ price: number; per_minutes: number; surcharge: number }>> => {
        return axiosClient.get('/api/tournament-settings/table-fee');
    },

    saveTableFee: (data: { price: number; per_minutes: number; surcharge: number }): Promise<AxiosResponse<{ success: boolean }>> => {
        return axiosClient.post('/api/tournament-settings/table-fee', data);
    },

    // Coefficients
    getCoefficients: (): Promise<AxiosResponse<TournamentCoefficient[]>> => {
        return axiosClient.get('/api/tournament-settings/coefficients');
    },

    getCoefficient: (id: number): Promise<AxiosResponse<TournamentCoefficient>> => {
        return axiosClient.get(`/api/tournament-settings/coefficients/${id}`);
    },

    createCoefficient: (data: CoefficientPayload): Promise<AxiosResponse<TournamentCoefficient>> => {
        return axiosClient.post('/api/tournament-settings/coefficients', data);
    },

    updateCoefficient: (id: number, data: CoefficientUpdatePayload): Promise<AxiosResponse<TournamentCoefficient>> => {
        return axiosClient.put(`/api/tournament-settings/coefficients/${id}`, data);
    },

    deleteCoefficient: (id: number): Promise<AxiosResponse<void>> => {
        return axiosClient.delete(`/api/tournament-settings/coefficients/${id}`);
    },
};
