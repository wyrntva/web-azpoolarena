export declare class CreateProductDto {
    name: string;
    categoryId?: number;
    type?: string;
    code?: string;
    sellPrice?: number;
    costPrice?: number;
    unit?: string;
    color?: string;
    image?: string;
    description?: string;
    channels?: string[];
    inventoryLinked?: boolean;
    inventoryId?: number;
    showOnScoreboard?: boolean;
    hourlyPrice?: number;
    timeIntervalValue?: number;
    timeIntervalUnit?: string;
    firstHourEnabled?: boolean;
    specialHourEnabled?: boolean;
}
export declare class UpdateProductDto {
    name?: string;
    categoryId?: number;
    type?: string;
    code?: string;
    sellPrice?: number;
    costPrice?: number;
    unit?: string;
    color?: string;
    image?: string;
    description?: string;
    channels?: string[];
    inventoryLinked?: boolean;
    inventoryId?: number;
    showOnScoreboard?: boolean;
    hourlyPrice?: number;
    timeIntervalValue?: number;
    timeIntervalUnit?: string;
    firstHourEnabled?: boolean;
    specialHourEnabled?: boolean;
}
