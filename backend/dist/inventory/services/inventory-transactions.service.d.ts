import { Repository } from 'typeorm';
import { InventoryEntity, InventoryTransactionEntity, InventoryTransactionDetailEntity } from '../entities';
import { CreateTransactionDto } from '../dto/inventory.dto';
import { ReceiptEntity, ReceiptTypeEntity } from '../../finance/entities';
export declare class InventoryTransactionsService {
    private readonly txRepo;
    private readonly detailRepo;
    private readonly invRepo;
    private readonly receiptRepo;
    private readonly receiptTypeRepo;
    constructor(txRepo: Repository<InventoryTransactionEntity>, detailRepo: Repository<InventoryTransactionDetailEntity>, invRepo: Repository<InventoryEntity>, receiptRepo: Repository<ReceiptEntity>, receiptTypeRepo: Repository<ReceiptTypeEntity>);
    private updateStatus;
    createInTransaction(dto: CreateTransactionDto, userId: number): Promise<InventoryTransactionEntity | null>;
    createOutTransaction(dto: CreateTransactionDto, userId: number): Promise<InventoryTransactionEntity | null>;
    findIns(skip?: number, limit?: number): Promise<InventoryTransactionEntity[]>;
    findOuts(skip?: number, limit?: number): Promise<InventoryTransactionEntity[]>;
}
