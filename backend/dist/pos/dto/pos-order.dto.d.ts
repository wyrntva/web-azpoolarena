export declare class PosOrderItemCreateDto {
    product_id: number;
    qty: number;
    price: number;
    is_time_based?: boolean;
    start_time?: string;
    end_time?: string;
    note?: string;
}
export declare class PosOrderCreateDto {
    id?: string;
    table_id?: number;
    area_id?: number;
    table_name?: string;
    table_number?: number;
    order_type?: string;
    payment_info?: string;
    customer_count?: number;
    items: PosOrderItemCreateDto[];
    status?: string;
    created_at?: string;
}
