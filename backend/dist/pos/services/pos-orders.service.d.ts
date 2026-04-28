import { Repository } from 'typeorm';
import { PosOrderEntity, PosOrderItemEntity, ProductEntity } from '../entities';
import { PosOrderCreateDto } from '../dto/pos-order.dto';
export declare class PosOrdersService {
    private readonly orderRepo;
    private readonly orderItemRepo;
    private readonly productRepo;
    constructor(orderRepo: Repository<PosOrderEntity>, orderItemRepo: Repository<PosOrderItemEntity>, productRepo: Repository<ProductEntity>);
    private formatOrderResponse;
    create(dto: PosOrderCreateDto): Promise<{
        id: number;
        tableId: number;
        areaId: number;
        tableName: string;
        tableNumber: number;
        status: string;
        orderType: string;
        customerCount: number;
        paymentInfo: string;
        totalAmount: number;
        createdAt: string | null;
        completedAt: string | null;
        items: any[];
    }>;
    findAll(orderType?: string, tableId?: number, areaId?: number): Promise<{
        id: number;
        tableId: number;
        areaId: number;
        tableName: string;
        tableNumber: number;
        status: string;
        orderType: string;
        customerCount: number;
        paymentInfo: string;
        totalAmount: number;
        createdAt: string | null;
        completedAt: string | null;
        items: any[];
    }[]>;
    update(orderId: number, dto: PosOrderCreateDto): Promise<{
        id: number;
        tableId: number;
        areaId: number;
        tableName: string;
        tableNumber: number;
        status: string;
        orderType: string;
        customerCount: number;
        paymentInfo: string;
        totalAmount: number;
        createdAt: string | null;
        completedAt: string | null;
        items: any[];
    }>;
    remove(orderId: number): Promise<{
        ok: boolean;
    }>;
    confirmScoreboardOrder(orderId: number): Promise<{
        id: number;
        tableId: number;
        areaId: number;
        tableName: string;
        tableNumber: number;
        status: string;
        orderType: string;
        customerCount: number;
        paymentInfo: string;
        totalAmount: number;
        createdAt: string | null;
        completedAt: string | null;
        items: any[];
    }>;
}
