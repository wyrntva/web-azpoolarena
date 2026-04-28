import { TransactionType, AccountType } from '../entities';
export declare class CreateCategoryDto {
    name: string;
    description?: string;
    is_active?: boolean;
}
export declare class UpdateCategoryDto {
    name?: string;
    description?: string;
    is_active?: boolean;
}
export declare class CreateUnitDto {
    name: string;
    description?: string;
    is_active?: boolean;
}
export declare class UpdateUnitDto {
    name?: string;
    description?: string;
    is_active?: boolean;
}
export declare class CreateInventoryDto {
    product_name: string;
    quantity: number;
    min_quantity?: number;
    category_id: number;
    base_unit_id: number;
    conversion_unit_id?: number;
    conversion_rate?: number;
}
export declare class UpdateInventoryDto {
    product_name?: string;
    quantity?: number;
    min_quantity?: number;
    category_id?: number;
    base_unit_id?: number;
    conversion_unit_id?: number;
    conversion_rate?: number;
}
export declare class TransactionDetailDto {
    inventory_id: number;
    quantity: number;
    unit_type?: string;
    price?: number;
    payment_method?: AccountType;
}
export declare class CreateTransactionDto {
    transaction_date: string;
    transaction_type: TransactionType;
    note?: string;
    items: TransactionDetailDto[];
}
