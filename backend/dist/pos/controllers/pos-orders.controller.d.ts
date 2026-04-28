import { PosOrdersService } from '../services/pos-orders.service';
import { PosOrderCreateDto } from '../dto/pos-order.dto';
export declare class PosOrdersController {
    private readonly posOrdersService;
    constructor(posOrdersService: PosOrdersService);
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
    findAll(orderType?: string, tableId?: string, areaId?: string): Promise<{
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
    update(id: number, dto: PosOrderCreateDto): Promise<{
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
    remove(id: number): Promise<{
        ok: boolean;
    }>;
    confirmScoreboardOrder(id: number): Promise<{
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
