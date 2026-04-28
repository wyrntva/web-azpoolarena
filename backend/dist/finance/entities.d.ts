import { UserEntity } from '../users/entities/user.entity';
import { CategoryEntity } from '../inventory/entities';
export declare enum AccountType {
    CASH = "cash",
    BANK = "bank"
}
export declare class ReceiptTypeEntity {
    id: number;
    name: string;
    description: string;
    category_id: number;
    is_active: boolean;
    is_inventory: boolean;
    created_at: Date;
    updated_at: Date;
    category: CategoryEntity;
}
export declare class ReceiptEntity {
    id: number;
    receipt_date: string | Date;
    amount: number;
    receipt_type_id: number;
    note: string;
    created_by: number;
    is_income: boolean;
    payment_method: AccountType;
    created_at: Date;
    updated_at: Date;
    receipt_type: ReceiptTypeEntity;
    created_by_user: UserEntity;
}
export declare class RevenueEntity {
    id: number;
    revenue_date: string | Date;
    cash_revenue: number;
    bank_revenue: number;
    note: string;
    created_by: number;
    created_at: Date;
    updated_at: Date;
    created_by_user: UserEntity;
}
export declare class ExchangeEntity {
    id: number;
    exchange_date: string | Date;
    amount: number;
    from_account: AccountType;
    to_account: AccountType;
    note: string;
    created_by: number;
    created_at: Date;
    updated_at: Date;
    created_by_user: UserEntity;
}
export declare class SafeEntity {
    id: number;
    safe_date: string | Date;
    amount: number;
    note: string;
    created_by: number;
    created_at: Date;
    updated_at: Date;
    created_by_user: UserEntity;
}
export declare class DebtEntity {
    id: number;
    debt_date: string | Date;
    amount: number;
    debtor_name: string;
    note: string;
    is_paid: boolean;
    paid_date: string | Date;
    payment_method: AccountType;
    created_by: number;
    created_at: Date;
    updated_at: Date;
    created_by_user: UserEntity;
}
