import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReceiptTypeEntity, ReceiptEntity } from '../entities';
import {
  CreateReceiptTypeDto,
  UpdateReceiptTypeDto,
  CreateReceiptDto,
  UpdateReceiptDto,
} from '../dto/finance.dto';

@Injectable()
export class ReceiptsService {
  constructor(
    @InjectRepository(ReceiptTypeEntity)
    private readonly receiptTypeRepo: Repository<ReceiptTypeEntity>,
    @InjectRepository(ReceiptEntity)
    private readonly receiptRepo: Repository<ReceiptEntity>,
  ) {}

  // ================= Receipt Types =================
  async createType(dto: CreateReceiptTypeDto) {
    const existing = await this.receiptTypeRepo.findOne({
      where: { name: dto.name },
    });
    if (existing)
      throw new BadRequestException(
        `Receipt type '${dto.name}' already exists`,
      );
    const rt = this.receiptTypeRepo.create(dto);
    return this.receiptTypeRepo.save(rt);
  }

  async findAllTypes() {
    return this.receiptTypeRepo.find({
      relations: ['category'],
      order: { name: 'ASC' },
    });
  }

  async findTypeById(id: number) {
    const rt = await this.receiptTypeRepo.findOne({
      where: { id },
      relations: ['category'],
    });
    if (!rt) throw new NotFoundException('Receipt type not found');
    return rt;
  }

  async updateType(id: number, dto: UpdateReceiptTypeDto) {
    const rt = await this.findTypeById(id);
    if (dto.name && dto.name !== rt.name) {
      const existing = await this.receiptTypeRepo.findOne({
        where: { name: dto.name },
      });
      if (existing)
        throw new BadRequestException(
          `Receipt type '${dto.name}' already exists`,
        );
    }
    Object.assign(rt, dto);
    return this.receiptTypeRepo.save(rt);
  }

  async deleteType(id: number) {
    const rt = await this.findTypeById(id);
    await this.receiptTypeRepo.remove(rt);
    return null;
  }

  // ================= Receipts =================
  async createReceipt(dto: CreateReceiptDto, userId: number) {
    const receipt = this.receiptRepo.create({ ...dto, created_by: userId });
    return this.receiptRepo.save(receipt);
  }

  async findAllReceipts(
    skip = 0,
    limit = 100,
    startDate?: string,
    endDate?: string,
    typeId?: number,
  ) {
    const qb = this.receiptRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.receipt_type', 'type')
      .leftJoinAndSelect('r.created_by_user', 'creator')
      .orderBy('r.receipt_date', 'DESC')
      .addOrderBy('r.created_at', 'DESC')
      .skip(skip)
      .take(limit);

    if (startDate) qb.andWhere('r.receipt_date >= :startDate', { startDate });
    if (endDate) qb.andWhere('r.receipt_date <= :endDate', { endDate });
    if (typeId) qb.andWhere('r.receipt_type_id = :typeId', { typeId });

    return qb.getManyAndCount();
  }

  async findReceiptById(id: number) {
    const receipt = await this.receiptRepo.findOne({
      where: { id },
      relations: ['receipt_type', 'created_by_user'],
    });
    if (!receipt) throw new NotFoundException('Receipt not found');
    return receipt;
  }

  async updateReceipt(id: number, dto: UpdateReceiptDto) {
    const receipt = await this.findReceiptById(id);
    Object.assign(receipt, dto);
    return this.receiptRepo.save(receipt);
  }

  async deleteReceipt(id: number) {
    const receipt = await this.findReceiptById(id);
    await this.receiptRepo.remove(receipt);
    return null;
  }
}
