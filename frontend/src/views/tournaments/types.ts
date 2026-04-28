export interface TournamentFormData {
    name: string;
    slug: string;
    banner: File | string | null; // Can be File (new upload) or string (existing URL)
    organizer_logo: File | string | null; // Can be File (new upload) or string (existing URL)
    sponsor_logos: (File | string)[]; // Can be File[] (new uploads) or string[] (existing URLs)
    ranks: string[];
    display: string;
    public_date: string;
    status: string;
    tournament_type: string;
    knockout_from_round: string;
    competition_format: string;
    number_of_players: string;
    start_date: string;
    registration_start_date: string;
    registration_end_date: string;
    location: string;
    organizer: string;
    support_phone: string;
    can_register: boolean;
    // Lệ phí và giải thưởng
    free_table_fee: boolean;
    pre_payment: boolean;
    registration_fee: string;
    total_prize: string;
    first_prize: string;
    second_prize: string;
    third_prize: string;
    top_5_8_prize: string;
    top_9_16_prize: string;
    top_17_32_prize: string;
    top_33_64_prize: string;
    top_65_128_prize: string;
    top_129_256_prize: string;
    // Tỉ lệ chấp
    has_draw: boolean;
    draw_touch: string;
    handicap_1_touch: string;
    handicap_2_touch: string;
    round_1_64: boolean;
    round_1_16: boolean;
    round_1_32: boolean;
    round_1_8: boolean;
    quarter_final: string;
    semi_final: string;
    final: string;
    draw_from_round: string;
}
