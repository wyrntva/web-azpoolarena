import { Repository } from 'typeorm';
import { ReceiptTypeEntity, ReceiptEntity } from '../entities';
import { CreateReceiptTypeDto, UpdateReceiptTypeDto, CreateReceiptDto, UpdateReceiptDto } from '../dto/finance.dto';
export declare class ReceiptsService {
    private readonly receiptTypeRepo;
    private readonly receiptRepo;
    constructor(receiptTypeRepo: Repository<ReceiptTypeEntity>, receiptRepo: Repository<ReceiptEntity>);
    createType(dto: CreateReceiptTypeDto): Promise<ReceiptTypeEntity>;
    findAllTypes(): Promise<ReceiptTypeEntity[]>;
    findTypeById(id: number): Promise<ReceiptTypeEntity>;
    updateType(id: number, dto: UpdateReceiptTypeDto): Promise<ReceiptTypeEntity>;
    deleteType(id: number): Promise<null>;
    createReceipt(dto: CreateReceiptDto, userId: number): Promise<ReceiptEntity>;
    findAllReceipts(skip?: number, limit?: number, startDate?: string, endDate?: string, typeId?: number): Promise<[ReceiptEntity[], number]>;
    findReceiptById(id: number): Promise<ReceiptEntity>;
    updateReceipt(id: number, dto: UpdateReceiptDto): Promise<ReceiptEntity>;
    deleteReceipt(id: number): Promise<null>;
}
