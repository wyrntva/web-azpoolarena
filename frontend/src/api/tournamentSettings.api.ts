import axiosClient from './axiosClient';
import type { AxiosResponse } from 'axios';
import type { ScoringRule, TournamentRank, TournamentRound } from '../types/api';

export interface RankPayload {
    order: number;
    name: string;
    min_score: number;
    max_score: number;
    default_score: number;
}

export interface RankUpdatePayload extends Partial<RankPayload> { }

export interface RoundPayload {
    name: string;
    description?: string;
    order: number;
    tournament_type?: string | null;
    number_of_players?: number | null;
    multiplier?: number | null;
    is_active: boolean;
}

export interface RoundUpdatePayload extends Partial<RoundPayload> { }

export interface ScoringRulePayload {
    name: string;
    description?: string;
    position: number;
    points: number;
    rule_type: ScoringRule['rule_type'];
}

export interface ScoringRuleUpdatePayload extends Partial<ScoringRulePayload> { }

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
};
