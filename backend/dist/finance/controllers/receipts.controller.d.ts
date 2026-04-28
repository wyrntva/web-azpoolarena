import { ReceiptsService } from '../services/receipts.service';
import { CreateReceiptTypeDto, UpdateReceiptTypeDto, CreateReceiptDto, UpdateReceiptDto } from '../dto/finance.dto';
export declare class ReceiptsController {
    private readonly service;
    constructor(service: ReceiptsService);
    createType(dto: CreateReceiptTypeDto): Promise<import("../entities").ReceiptTypeEntity>;
    findAllTypes(): Promise<import("../entities").ReceiptTypeEntity[]>;
    findTypeById(id: number): Promise<import("../entities").ReceiptTypeEntity>;
    updateType(id: number, dto: UpdateReceiptTypeDto): Promise<import("../entities").ReceiptTypeEntity>;
    deleteType(id: number): Promise<null>;
    createReceipt(dto: CreateReceiptDto, req: any): Promise<import("../entities").ReceiptEntity>;
    findAllReceipts(skipStr?: string, limitStr?: string, startDate?: string, endDate?: string, typeIdStr?: string): Promise<{
        data: import("../entities").ReceiptEntity[];
        meta: {
            total: number;
            skip: number;
            limit: number;
        };
    }>;
    findReceiptById(id: number): Promise<import("../entities").ReceiptEntity>;
    updateReceipt(id: number, dto: UpdateReceiptDto): Promise<import("../entities").ReceiptEntity>;
    deleteReceipt(id: number): Promise<null>;
}
