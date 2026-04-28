import { UserEntity } from '../users/entities/user.entity';
export declare enum InventoryStatus {
    IN_STOCK = "in_stock",
    OUT_OF_STOCK = "out_of_stock",
    LOW_STOCK = "low_stock"
}
export declare enum TransactionType {
    IN = "in",
    OUT = "out"
}
export declare enum AccountType {
    CASH = "cash",
    BANK = "bank"
}
export declare class CategoryEntity {
    id: number;
    name: string;
    description: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
    inventories: InventoryEntity[];
}
export declare class UnitEntity {
    id: number;
    name: string;
    description: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}
export declare class InventoryEntity {
    id: number;
    product_name: string;
    quantity: number;
    min_quantity: number;
    category_id: number;
    base_unit_id: number;
    conversion_unit_id: number;
    conversion_rate: number;
    status: InventoryStatus;
    created_by: number;
    created_at: Date;
    updated_at: Date;
    created_by_user: UserEntity;
    category: CategoryEntity;
    base_unit_ref: UnitEntity;
    conversion_unit_ref: UnitEntity;
}
export declare class InventoryTransactionEntity {
    id: number;
    transaction_date: string | Date;
    transaction_type: TransactionType;
    note: string;
    created_by: number;
    created_at: Date;
    created_by_user: UserEntity;
    details: InventoryTransactionDetailEntity[];
}
export declare class InventoryTransactionDetailEntity {
    id: number;
    transaction_id: number;
    inventory_id: number;
    quantity: number;
    unit_type: string;
    price: number;
    payment_method: AccountType;
    created_at: Date;
    transaction: InventoryTransactionEntity;
    inventory: InventoryEntity;
}
