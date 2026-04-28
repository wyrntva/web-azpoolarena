export declare class MenuEntity {
    id: number;
    name: string;
    icon: string;
    image: string;
    product_ids: number[];
    sort_order: number;
    created_at: Date;
    updated_at: Date;
}
export declare class ProductEntity {
    id: number;
    name: string;
    category_id: number;
    type: string;
    code: string;
    sell_price: number;
    cost_price: number;
    unit: string;
    color: string;
    image: string;
    description: string;
    channels: any;
    inventory_linked: boolean;
    inventory_id: number;
    show_on_scoreboard: boolean;
    hourly_price: number;
    time_interval_value: number;
    time_interval_unit: string;
    first_hour_enabled: boolean;
    special_hour_enabled: boolean;
    created_at: Date;
    updated_at: Date;
}
export declare class PosOrderEntity {
    id: number;
    table_id: number;
    area_id: number;
    table_name: string;
    table_number: number;
    customer_count: number;
    order_type: string;
    status: string;
    payment_info: string;
    note: string;
    total_amount: number;
    created_at: Date;
    updated_at: Date;
    completed_at: Date;
    items: PosOrderItemEntity[];
}
export declare class PosOrderItemEntity {
    id: number;
    order_id: number;
    product_id: number;
    quantity: number;
    price: number;
    is_time_based: boolean;
    start_time: Date;
    end_time: Date;
    note: string;
    created_at: Date;
    order: PosOrderEntity;
    product: ProductEntity;
}
