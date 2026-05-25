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

export interface Role {
    id: number;
    name: string;
    permissions: string[];
    requires_timekeeping?: boolean;
}

// Finance types
export interface Receipt {
    id: number;
    receipt_type_id: number;
    amount: number;
    description?: string;
    date: string;
    created_by?: number;
    receipt_type?: ReceiptType;
    created_at: string;
}

export interface ReceiptType {
    id: number;
    name: string;
    type: 'income' | 'expense';
    icon?: string;
    is_active: boolean;
    is_inventory?: boolean;
    description?: string;
    created_at?: string;
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
    from_amount: number;
    to_amount: number;
    exchange_rate: number;
    note?: string;
    date: string;
    created_at: string;
}

export interface Safe {
    id: number;
    name: string;
    balance: number;
    description?: string;
    is_active: boolean;
}

export interface Debt {
    id: number;
    debtor_name: string;
    amount: number;
    description?: string;
    due_date?: string;
    is_paid: boolean;
    created_at: string;
}

// Inventory types
export interface Inventory {
    id: number;
    name: string;
    sku?: string;
    category_id?: number;
    unit_id?: number;
    quantity: number;
    price: number;
    status: string;
    category?: Category;
    unit?: Unit;
}

export interface Category {
    id: number;
    name: string;
    description?: string;
    parent_id?: number;
}

export interface Unit {
    id: number;
    name: string;
    abbreviation?: string;
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
    amount: number;
    reason?: string;
    date: string;
    approved_by?: number;
}

export interface Bonus {
    id: number;
    user_id: number;
    amount: number;
    reason?: string;
    date: string;
    approved_by?: number;
}

export interface Penalty {
    id: number;
    user_id: number;
    amount: number;
    reason?: string;
    date: string;
    approved_by?: number;
}

// Tournament settings
export type ScoringRuleType = 'win' | 'lose' | 'draw' | 'bonus' | 'penalty';

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

export interface TournamentRound {
    id: number;
    name: string;
    description?: string;
    order: number;
    is_active: boolean;
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
