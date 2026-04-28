import { InventoryTransactionsService } from '../services/inventory-transactions.service';
import { CreateTransactionDto } from '../dto/inventory.dto';
export declare class InventoryTransactionsController {
    private readonly txService;
    constructor(txService: InventoryTransactionsService);
    createIn(dto: CreateTransactionDto, req: any): Promise<import("../entities").InventoryTransactionEntity | null>;
    getIns(skipStr?: string, limitStr?: string): Promise<import("../entities").InventoryTransactionEntity[]>;
    createOut(dto: CreateTransactionDto, req: any): Promise<import("../entities").InventoryTransactionEntity | null>;
    getOuts(skipStr?: string, limitStr?: string): Promise<import("../entities").InventoryTransactionEntity[]>;
}
