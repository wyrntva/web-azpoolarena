import { AccountType } from '../entities';
export declare class CreateReceiptTypeDto {
    name: string;
    description?: string;
    category_id?: number;
    is_active?: boolean;
    is_inventory?: boolean;
}
export declare class UpdateReceiptTypeDto {
    name?: string;
    description?: string;
    category_id?: number;
    is_active?: boolean;
    is_inventory?: boolean;
}
export declare class CreateReceiptDto {
    receipt_date: string;
    amount: number;
    receipt_type_id: number;
    note?: string;
    is_income: boolean;
    payment_method: AccountType;
}
export declare class UpdateReceiptDto {
    receipt_date?: string;
    amount?: number;
    receipt_type_id?: number;
    note?: string;
    is_income?: boolean;
    payment_method?: AccountType;
}
export declare class CreateRevenueDto {
    revenue_date: string;
    cash_revenue?: number;
    bank_revenue?: number;
    note?: string;
}
export declare class UpdateRevenueDto {
    cash_revenue?: number;
    bank_revenue?: number;
    note?: string;
}
export declare class CreateExchangeDto {
    exchange_date: string;
    amount: number;
    from_account: AccountType;
    to_account: AccountType;
    note?: string;
}
export declare class UpdateExchangeDto {
    exchange_date?: string;
    amount?: number;
    from_account?: AccountType;
    to_account?: AccountType;
    note?: string;
}
export declare class CreateSafeDto {
    safe_date: string;
    amount: number;
    note?: string;
}
export declare class UpdateSafeDto {
    safe_date?: string;
    amount?: number;
    note?: string;
}
export declare class CreateDebtDto {
    debt_date: string;
    amount: number;
    debtor_name: string;
    note?: string;
    is_paid?: boolean;
    paid_date?: string;
    payment_method?: AccountType;
}
export declare class UpdateDebtDto {
    debt_date?: string;
    amount?: number;
    debtor_name?: string;
    note?: string;
    is_paid?: boolean;
    paid_date?: string;
    payment_method?: AccountType;
}
