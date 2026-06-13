/**
 * Common API types and interfaces
 */

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    page_size: number;
}

export interface ApiResponse<T> {
    data: T;
    message?: string;
}

export interface ApiError {
    detail: string;
    code?: string;
    field?: string;
}

// Auth types
export interface LoginCredentials {
    username: string;
    password: string;
}

export interface LoginResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
}

export interface RefreshTokenRequest {
    refresh_token: string;
}

export interface User {
    id: number;
    username: string;
    full_name: string;
    email?: string;
    is_active: boolean;
    is_admin: boolean;
    role: Role;
    salary_type?: 'hourly' | 'fixed';
    hourly_rate?: number;
    fixed_salary?: number;
    display_order?: number;
    created_at: string;
    updated_at?: string;
}

export interface PoolArenaUser {
    id: number;
    user_type?: 'player' | 'both';
    full_name: string;
    gender?: string | null;
    address?: string | null;
    rank?: string | null;
    phone_number: string;
    email?: string | null;
    avatar_url?: string | null;
    role: string;
    is_active: boolean;
    is_phone_verified: boolean;
    is_email_verified: boolean;
    total_games: number;
    wins: number;
    losses: number;
    win_rate: number;
    points?: number;
    tiktok_url?: string | null;
    facebook_url?: string | null;
    instagram_url?: string | null;
    created_at: string;
    updated_at?: string;
}

export interface Role {
    id: number;
    name: string;
    description?: string;
    permissions: string[];
    requires_timekeeping?: boolean;
}

// Finance types
export interface Receipt {
    id: number;
    receipt_date: string;
    amount: number;
    receipt_type_id: number;
    is_income: boolean;
    payment_method: 'cash' | 'bank';
    note?: string;
    created_by?: number;
    created_by_user?: User;
    receipt_type?: ReceiptType;
    created_at: string;
    updated_at?: string;
}

export interface ReceiptType {
    id: number;
    name: string;
    description?: string;
    is_active: boolean;
    is_inventory: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface Revenue {
    id: number;
    amount: number;
    description?: string;
    date: string;
    created_at: string;
}

export interface Exchange {
    id: number;
    exchange_date: string;
    amount: number;
    from_account: 'cash' | 'bank';
    to_account: 'cash' | 'bank';
    note?: string;
    created_by?: number;
    created_by_user?: User;
    created_at: string;
    updated_at?: string;
}

export interface Safe {
    id: number;
    safe_date: string;
    amount: number;
    note?: string;
    created_by?: number;
    created_by_user?: User;
    created_at: string;
    updated_at?: string;
}

export interface Debt {
    id: number;
    debtor_name: string;
    amount: number;
    note?: string;
    debt_date?: string;
    is_paid: boolean;
    created_at: string;
}

// Inventory types
export interface Inventory {
    id: number;
    product_name: string;
    quantity: number;
    min_quantity: number;
    category_id?: number;
    base_unit_id: number;
    conversion_unit_id?: number;
    conversion_rate?: number;
    status: 'in_stock' | 'low_stock' | 'out_of_stock';
    created_by?: number;
    created_by_user?: User;
    category?: Category;
    base_unit?: Unit;
    large_unit?: Unit;
    created_at?: string;
    updated_at?: string;
}

export interface Category {
    id: number;
    name: string;
    description?: string;
    is_active?: boolean;
}

export interface Unit {
    id: number;
    name: string;
    description?: string;
    is_active?: boolean;
}

export interface InventoryTransaction {
    id: number;
    inventory_id: number;
    transaction_type: 'in' | 'out';
    quantity: number;
    price?: number;
    note?: string;
    transaction_date: string;
    created_by?: number;
}

// Attendance types
export interface WorkSchedule {
    id: number;
    user_id: number;
    work_date: string;
    start_time: string;
    end_time: string;
    is_active: boolean;
    allowed_late_minutes?: number;
    user?: User;
}

export interface Attendance {
    id: number;
    user_id: number;
    date: string;
    check_in_time?: string;
    check_out_time?: string;
    status: 'present' | 'late' | 'absent' | 'early_checkout';
    notes?: string;
    user?: User;
}

export interface AttendanceSettings {
    id: number;
    allowed_late_minutes: number;
    penalty_tiers: PenaltyTier[];
    early_checkout_grace_minutes: number;
    early_checkout_penalty: number;
    missing_checkout_penalty: number;
    absent_penalty: number;
    auto_absent_enabled: boolean;
    notes?: string;
    is_active: boolean;
}

export interface PenaltyTier {
    max_minutes: number | null;
    penalty_amount: number;
}

// Payroll types
export interface PayrollSummary {
    user_id: number;
    month: string;
    total_hours: number;
    total_bonuses: number;
    total_advances: number;
    total_penalties: number;
    net_salary: number;
    user?: User;
}

export interface AdvancePayment {
    id: number;
    user_id: number;
    date: string;
    amount: number;
    notes?: string;
    employee_name?: string;
    created_by_name?: string;
}

export interface Bonus {
    id: number;
    user_id: number;
    date: string;
    amount: number;
    notes?: string;
    employee_name?: string;
    created_by_name?: string;
}

export interface Penalty {
    id: number;
    user_id: number;
    date: string;
    amount: number;
    notes?: string;
    employee_name?: string;
    created_by_name?: string;
}

// Tournament settings
export type ScoringRuleType = 'win' | 'lose' | 'draw' | 'bonus' | 'penalty';

export interface TournamentRound {
    id: number;
    name: string;
    description?: string;
    order: number;
    tournament_type?: string;
    number_of_players?: number;
    multiplier?: number;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface TournamentRank {
    id: number;
    order: number;
    name: string;
    min_score: number;
    max_score: number;
    default_score: number;
    created_at?: string;
    updated_at?: string;
}

export interface TournamentCoefficient {
    id: number;
    order: number;
    name: string;
    value: number;
    description?: string;
    created_at?: string;
    updated_at?: string;
}


export interface ScoringRule {
    id: number;
    name: string;
    description?: string;
    position: number;
    points: number;
    rule_type: ScoringRuleType;
    created_at?: string;
    updated_at?: string;
}
