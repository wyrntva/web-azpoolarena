/**
 * useTournamentForm — manages state, validation, and submission for tournament create/edit.
 * Heavy logic (slug, images, API conversion) is delegated to utility modules.
 */
import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { tournamentSettingsAPI } from '../../../api/tournamentSettings.api';
import { tournamentAPI } from '../../../api/tournament.api';
import type { Tournament, TournamentCreate, TournamentUpdate } from '../../../api/tournament.api';
import type { TournamentRank } from '../../../types/api';
import type { TournamentFormData } from '../types';
import { buildTournamentSlug } from '../utils/slugUtils';
import { createImageHandlers, uploadFormImages } from '../utils/imageUtils';
import { convertFormDataToAPI, formatDateForInput } from '../utils/formDataConverter';

// ============================================
// DEFAULTS
// ============================================

const initialFormData: TournamentFormData = {
    name: '',
    slug: '',
    banner: null,
    organizer_logo: null,
    detail_logo: null,
    sponsor_logos: [],
    ranks: [],
    display: 'public',
    public_date: '',
    status: 'upcoming',
    tournament_type: 'knockout',
    knockout_from_round: '',
    competition_format: '',
    number_of_players: '32',
    start_date: '',
    registration_start_date: '',
    registration_end_date: '',
    location: '',
    organizer: '',
    support_phone: '',
    can_register: true,
    free_registration_fee: false,
    free_table_fee: false,
    pre_payment: false,
    registration_fee: '',
    total_prize: '',
    first_prize: '',
    second_prize: '',
    third_prize: '',
    top_5_8_prize: '',
    top_9_16_prize: '',
    top_17_32_prize: '',
    top_33_64_prize: '',
    top_65_128_prize: '',
    top_129_256_prize: '',
    has_draw: false,
    draw_touch: '',
    handicap_1_touch: '',
    handicap_2_touch: '',
    round_1_64: false,
    round_1_16: false,
    round_1_32: false,
    round_1_8: false,
    quarter_final: '',
    semi_final: '',
    final: '',
    draw_from_round: '',
};

// ============================================
// HOOK
// ============================================

export const useTournamentForm = () => {
    const [formData, setFormData] = useState<TournamentFormData>(initialFormData);
    const [ranks, setRanks] = useState<TournamentRank[]>([]);
    const [editingTournamentId, setEditingTournamentId] = useState<number | null>(null);
    const [loadedTournament, setLoadedTournament] = useState<Tournament | null>(null);

    // --- Fetch ranks on mount ---

    useEffect(() => {
        (async () => {
            try {
                const response = await tournamentSettingsAPI.getRanks();
                setRanks(response.data || []);
            } catch {
                // ignore
            }
        })();
    }, []);

    // --- Auto-reset round toggles when player count changes ---

    useEffect(() => {
        const n = parseInt(formData.number_of_players || '0', 10);
        const showR16 = n === 48 || n === 64 || n === 96 || n === 128;
        const showR8 = showR16 || n === 24 || n === 32;

        let needsUpdate = false;
        const updates: Partial<TournamentFormData> = {};

        if (formData.round_1_16 && !showR16) { updates.round_1_16 = false; needsUpdate = true; }
        if (formData.round_1_8 && !showR8) { updates.round_1_8 = false; needsUpdate = true; }
        if (formData.round_1_32) { updates.round_1_32 = false; needsUpdate = true; }
        if (formData.round_1_64) { updates.round_1_64 = false; needsUpdate = true; }

        if (needsUpdate) setFormData(prev => ({ ...prev, ...updates }));
    }, [formData.number_of_players, formData.round_1_16, formData.round_1_8, formData.round_1_32, formData.round_1_64]);

    // --- Image handlers (memoised factory) ---

    const imageHandlers = useMemo(
        () => createImageHandlers(setFormData, () => editingTournamentId),
        [editingTournamentId],
    );

    // --- Simple handlers ---

    const handleRankToggle = (rank: string) => {
        setFormData(prev => ({
            ...prev,
            ranks: prev.ranks.includes(rank)
                ? prev.ranks.filter(r => r !== rank)
                : [...prev.ranks, rank]
        }));
    };

    const handleNameChange = (name: string) => {
        setFormData(prev => ({
            ...prev,
            name,
            slug: buildTournamentSlug(name, prev.start_date)
        }));
    };

    const handleStartDateChange = (startDate: string) => {
        setFormData(prev => ({
            ...prev,
            start_date: startDate,
            slug: buildTournamentSlug(prev.name, startDate)
        }));
    };

    // --- Currency formatting ---

    const formatNumber = (value: string): string => {
        const numericValue = value.replace(/\D/g, '');
        if (!numericValue) return '';
        return parseInt(numericValue, 10).toLocaleString('vi-VN');
    };

    const handleCurrencyChange = (field: keyof TournamentFormData, value: string) => {
        const numericValue = value.replace(/\D/g, '');
        setFormData(prev => ({ ...prev, [field]: numericValue }));
    };

    const getFormattedValue = (value: string): string => {
        if (!value) return '';
        return formatNumber(value);
    };

    // --- Submit ---

    const handleSubmit = async (e: React.FormEvent, tournamentId?: number, existingTournament?: Tournament | Record<string, unknown>) => {
        e.preventDefault();
        // Upload any File objects → get URLs
        const existing = existingTournament as Record<string, unknown> | undefined;
        const { banner, organizer_logo, detail_logo, sponsor_logos } = await uploadFormImages(formData, existing);

        const formDataWithUrls = {
            ...formData,
            banner,
            organizer_logo,
            detail_logo,
            sponsor_logos,
        };

        const apiData = convertFormDataToAPI(formDataWithUrls, !!tournamentId, existing);

        if (tournamentId) {
            await tournamentAPI.updateTournament(tournamentId, apiData as TournamentUpdate);
            toast.success('Cập nhật giải đấu thành công');
        } else {
            await tournamentAPI.createTournament(apiData as unknown as TournamentCreate);
            toast.success('Thêm giải đấu thành công');
        }
        resetForm();
    };

    // --- Load existing tournament ---

    const loadTournament = async (tournamentId: number) => {
        const response = await tournamentAPI.getTournament(tournamentId);
        const tournament = response.data;
        setEditingTournamentId(tournamentId);
        setLoadedTournament(tournament);

        setFormData({
            name: tournament.name,
            slug: tournament.slug,
            banner: tournament.banner ? (tournament.banner as string) : null,
            organizer_logo: tournament.organizer_logo ? (tournament.organizer_logo as string) : null,
            detail_logo: tournament.detail_logo ? (tournament.detail_logo as string) : null,
            sponsor_logos: tournament.sponsor_logos ? (tournament.sponsor_logos as string[]) : [],
            ranks: tournament.ranks || [],
            display: tournament.display || 'public',
            public_date: formatDateForInput(tournament.public_date),
            status: tournament.status || 'upcoming',
            tournament_type: tournament.tournament_type || 'knockout',
            knockout_from_round: tournament.knockout_from_round || '',
            competition_format: tournament.competition_format || '',
            number_of_players: tournament.number_of_players?.toString() || '32',
            start_date: formatDateForInput(tournament.start_date),
            registration_start_date: formatDateForInput(tournament.registration_start_date),
            registration_end_date: formatDateForInput(tournament.registration_end_date),
            location: tournament.location || '',
            organizer: tournament.organizer || '',
            support_phone: tournament.support_phone || '',
            can_register: tournament.can_register ?? true,
            free_registration_fee: tournament.free_registration_fee ?? false,
            free_table_fee: tournament.free_table_fee ?? false,
            pre_payment: tournament.pre_payment ?? false,
            registration_fee: tournament.registration_fee?.toString() || '',
            total_prize: tournament.total_prize?.toString() || '',
            first_prize: tournament.first_prize?.toString() || '',
            second_prize: tournament.second_prize?.toString() || '',
            third_prize: tournament.third_prize?.toString() || '',
            top_5_8_prize: tournament.top_5_8_prize?.toString() || '',
            top_9_16_prize: tournament.top_9_16_prize?.toString() || '',
            top_17_32_prize: tournament.top_17_32_prize?.toString() || '',
            top_33_64_prize: tournament.top_33_64_prize?.toString() || '',
            top_65_128_prize: tournament.top_65_128_prize?.toString() || '',
            top_129_256_prize: tournament.top_129_256_prize?.toString() || '',
            has_draw: tournament.has_draw ?? false,
            draw_touch: tournament.draw_touch || '',
            handicap_1_touch: tournament.handicap_1_touch || '',
            handicap_2_touch: tournament.handicap_2_touch || '',
            round_1_64: tournament.round_1_64 ?? false,
            round_1_16: tournament.round_1_16 ?? false,
            round_1_32: tournament.round_1_32 ?? false,
            round_1_8: tournament.round_1_8 ?? false,
            quarter_final: (tournament.quarter_final as string) || '',
            semi_final: tournament.semi_final || '',
            final: tournament.final || '',
            draw_from_round: (tournament.draw_from_round as string) || '',
        });
    };

    // --- Reset ---

    const resetForm = () => {
        setFormData(initialFormData);
        setEditingTournamentId(null);
        setLoadedTournament(null);
    };

    return {
        formData,
        setFormData,
        ranks,
        loadedTournament,
        handleRankToggle,
        ...imageHandlers,
        handleCurrencyChange,
        getFormattedValue,
        handleSubmit,
        resetForm,
        handleNameChange,
        handleStartDateChange,
        loadTournament,
    };
};
