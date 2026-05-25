import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  InventoryEntity,
  InventoryTransactionEntity,
  InventoryTransactionDetailEntity,
  TransactionType,
  InventoryStatus,
} from '../entities';
import { CreateTransactionDto } from '../dto/inventory.dto';
import { ReceiptEntity, ReceiptTypeEntity } from '../../finance/entities';

@Injectable()
export class InventoryTransactionsService {
  constructor(
    @InjectRepository(InventoryTransactionEntity)
    private readonly txRepo: Repository<InventoryTransactionEntity>,
    @InjectRepository(InventoryTransactionDetailEntity)
    private readonly detailRepo: Repository<InventoryTransactionDetailEntity>,
    @InjectRepository(InventoryEntity)
    private readonly invRepo: Repository<InventoryEntity>,
    @InjectRepository(ReceiptEntity)
    private readonly receiptRepo: Repository<ReceiptEntity>,
    @InjectRepository(ReceiptTypeEntity)
    private readonly receiptTypeRepo: Repository<ReceiptTypeEntity>,
  ) {}

  private updateStatus(inv: InventoryEntity) {
    if (inv.quantity <= 0) {
      inv.status = InventoryStatus.OUT_OF_STOCK;
    } else if (inv.quantity <= inv.min_quantity) {
      inv.status = InventoryStatus.LOW_STOCK;
    } else {
      inv.status = InventoryStatus.IN_STOCK;
    }
  }

  async createInTransaction(dto: CreateTransactionDto, userId: number) {
    dto.transaction_type = TransactionType.IN;

    const tx = this.txRepo.create({
      transaction_date: dto.transaction_date,
      transaction_type: dto.transaction_type,
      note: dto.note,
      created_by: userId,
    });

    await this.txRepo.save(tx);

    const itemsByReceiptType = {};

    for (const item of dto.items) {
      const inv = await this.invRepo.findOne({
        where: { id: item.inventory_id },
        relations: ['category', 'base_unit_ref', 'conversion_unit_ref'],
      });

      if (!inv)
        throw new NotFoundException(
          `Sản phẩm với ID ${item.inventory_id} không tồn tại`,
        );

      let actualQty = item.quantity;
      let displayUnit = inv.base_unit_ref?.name || '';

      if (item.unit_type === 'large' && inv.conversion_rate) {
        actualQty = item.quantity * inv.conversion_rate;
        displayUnit = inv.conversion_unit_ref?.name || '';
      }

      const detail = this.detailRepo.create({
        transaction_id: tx.id,
        inventory_id: item.inventory_id,
        quantity: actualQty,
        unit_type: item.unit_type,
        price: item.price,
        payment_method: item.payment_method,
      });

      await this.detailRepo.save(detail);

      inv.quantity += actualQty;
      this.updateStatus(inv);
      await this.invRepo.save(inv);

      // Group for receipts
      if (item.price && item.price > 0) {
        let rt: ReceiptTypeEntity | null = null;
        if (inv.category) {
          rt = await this.receiptTypeRepo.findOne({
            where: {
              name: inv.category.name,
              is_inventory: true,
              is_active: true,
            },
          });
        }
        if (!rt)
          rt = await this.receiptTypeRepo.findOne({
            where: { is_inventory: true, is_active: true },
          });
        if (!rt)
          rt = await this.receiptTypeRepo.findOne({
            where: { is_active: true },
          });

        if (rt) {
          if (!itemsByReceiptType[rt.id])
            itemsByReceiptType[rt.id] = {
              items: [],
              total: 0,
              payment_methods: new Set(),
            };
          itemsByReceiptType[rt.id].items.push({
            product_name: inv.product_name,
            quantity: item.quantity,
            unit: displayUnit,
            price: item.price,
          });
          itemsByReceiptType[rt.id].total += item.price;
          if (item.payment_method)
            itemsByReceiptType[rt.id].payment_methods.add(item.payment_method);
        }
      }
    }

    // Create receipts
    for (const [rtId, group] of Object.entries(itemsByReceiptType)) {
      const g = group as any;
      const notes = g.items.map(
        (i: any) => `${i.quantity} ${i.unit} ${i.product_name}`,
      );
      let note = `Nhập kho: ${notes.join(', ')}`;
      if (dto.note) note += ` - ${dto.note}`;

      let paymentMethod = 'cash';
      if (g.payment_methods.size > 0)
        paymentMethod = Array.from(g.payment_methods)[0] as string;

      const receipt = this.receiptRepo.create({
        receipt_date: dto.transaction_date,
        amount: g.total,
        receipt_type_id: parseInt(rtId, 10),
        note,
        created_by: userId,
        is_income: false,
        payment_method: paymentMethod as any,
      });
      await this.receiptRepo.save(receipt);
    }

    return this.txRepo.findOne({
      where: { id: tx.id },
      relations: ['created_by_user', 'details', 'details.inventory'],
    });
  }

  async createOutTransaction(dto: CreateTransactionDto, userId: number) {
    dto.transaction_type = TransactionType.OUT;

    const tx = this.txRepo.create({
      transaction_date: dto.transaction_date,
      transaction_type: dto.transaction_type,
      note: dto.note,
      created_by: userId,
    });

    await this.txRepo.save(tx);

    for (const item of dto.items) {
      const inv = await this.invRepo.findOne({
        where: { id: item.inventory_id },
      });
      if (!inv)
        throw new NotFoundException(
          `Sản phẩm với ID ${item.inventory_id} không tồn tại`,
        );

      let actualQty = item.quantity;
      if (item.unit_type === 'large' && inv.conversion_rate) {
        actualQty = item.quantity * inv.conversion_rate;
      }

      if (inv.quantity < actualQty) {
        throw new BadRequestException(
          `Không đủ hàng trong kho. Sản phẩm '${inv.product_name}' chỉ còn ${inv.quantity}`,
        );
      }

      const detail = this.detailRepo.create({
        transaction_id: tx.id,
        inventory_id: item.inventory_id,
        quantity: actualQty,
        unit_type: item.unit_type,
      });
      await this.detailRepo.save(detail);

      inv.quantity -= actualQty;
      this.updateStatus(inv);
      await this.invRepo.save(inv);
    }

    return this.txRepo.findOne({
      where: { id: tx.id },
      relations: ['created_by_user', 'details', 'details.inventory'],
    });
  }

  async findIns(skip: number = 0, limit: number = 100) {
    return this.txRepo.find({
      where: { transaction_type: TransactionType.IN },
      relations: ['created_by_user', 'details', 'details.inventory'],
      order: { transaction_date: 'DESC' },
      skip,
      take: limit,
    });
  }

  async findOuts(skip: number = 0, limit: number = 100) {
    return this.txRepo.find({
      where: { transaction_type: TransactionType.OUT },
      relations: ['created_by_user', 'details', 'details.inventory'],
      order: { transaction_date: 'DESC' },
      skip,
      take: limit,
    });
  }
}
