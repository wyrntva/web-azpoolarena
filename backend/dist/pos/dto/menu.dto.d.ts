export declare class CreateMenuDto {
    name: string;
    icon: string;
    image?: string;
    productIds?: number[];
}
export declare class UpdateMenuDto {
    name?: string;
    icon?: string;
    image?: string;
    productIds?: number[];
}
export declare class ReorderMenuDto {
    id: number;
    sort_order: number;
}
