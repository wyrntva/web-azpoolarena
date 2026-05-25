import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PosOrderEntity, PosOrderItemEntity, ProductEntity } from '../entities';
import { PosOrderCreateDto } from '../dto/pos-order.dto';

@Injectable()
export class PosOrdersService {
  constructor(
    @InjectRepository(PosOrderEntity)
    private readonly orderRepo: Repository<PosOrderEntity>,
    @InjectRepository(PosOrderItemEntity)
    private readonly orderItemRepo: Repository<PosOrderItemEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,
  ) {}

  private async formatOrderResponse(order: PosOrderEntity) {
    // Requires relations: ['items', 'items.product']
    const items: any[] = [];
    for (const i of order.items || []) {
      let prodData: any = null;
      if (i.product) {
        prodData = {
          id: i.product.id,
          name: i.product.name,
          price: i.product.sell_price,
          image: i.product.image,
          unit: i.product.unit,
          category_id: i.product.category_id,
          type: i.product.type,
          hourly_price: i.product.hourly_price,
          timeIntervalValue: i.product.time_interval_value,
          timeIntervalUnit: i.product.time_interval_unit,
        };
      }

      items.push({
        id: String(i.id),
        product_id: i.product_id,
        qty: i.quantity,
        price: i.price,
        product: prodData,
        isTimeBased: i.is_time_based,
        startTime: i.start_time?.toISOString() || null,
        endTime: i.end_time?.toISOString() || null,
        note: i.note,
      });
    }

    return {
      id: order.id,
      tableId: order.table_id,
      areaId: order.area_id,
      tableName: order.table_name,
      tableNumber: order.table_number,
      status: order.status,
      orderType: order.order_type,
      customerCount: order.customer_count,
      paymentInfo: order.payment_info,
      totalAmount: order.total_amount,
      createdAt: order.created_at?.toISOString() || null,
      completedAt: order.completed_at?.toISOString() || null,
      items,
    };
  }

  async create(dto: PosOrderCreateDto) {
    const order = this.orderRepo.create({
      table_id: dto.table_id,
      area_id: dto.area_id,
      table_name: dto.table_name,
      table_number: dto.table_number,
      order_type: dto.order_type,
      customer_count: dto.customer_count,
      payment_info: dto.payment_info,
      status: dto.status,
      created_at: dto.created_at ? new Date(dto.created_at) : new Date(),
    });

    await this.orderRepo.save(order);

    let total = 0;
    for (const i of dto.items) {
      const item = this.orderItemRepo.create({
        order_id: order.id,
        product_id: i.product_id,
        quantity: i.qty,
        price: i.price,
        is_time_based: i.is_time_based || false,
        start_time: i.start_time ? new Date(i.start_time) : undefined,
        end_time: i.end_time ? new Date(i.end_time) : undefined,
        note: i.note,
      });
      await this.orderItemRepo.save(item);
      if (!i.is_time_based) {
        total += i.qty * i.price;
      }
    }

    order.total_amount = total;
    await this.orderRepo.save(order);

    const savedOrder = await this.orderRepo.findOne({
      where: { id: order.id },
      relations: ['items', 'items.product'],
    });

    return this.formatOrderResponse(savedOrder!);
  }

  async findAll(orderType?: string, tableId?: number, areaId?: number) {
    const where: any = {};
    if (orderType) where.order_type = orderType;
    if (tableId) where.table_id = tableId;
    if (areaId) where.area_id = areaId;

    const orders = await this.orderRepo.find({
      where,
      relations: ['items', 'items.product'],
      order: { created_at: 'DESC' },
    });

    return Promise.all(orders.map((o) => this.formatOrderResponse(o)));
  }

  async update(orderId: number, dto: PosOrderCreateDto) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    if (dto.table_id !== undefined) order.table_id = dto.table_id;
    if (dto.area_id !== undefined) order.area_id = dto.area_id;
    if (dto.table_name !== undefined) order.table_name = dto.table_name;
    if (dto.status !== undefined) order.status = dto.status;
    if (dto.customer_count !== undefined)
      order.customer_count = dto.customer_count;

    // Delete existing items
    await this.orderItemRepo.delete({ order_id: orderId });

    // recreate items
    let total = 0;
    for (const i of dto.items) {
      const item = this.orderItemRepo.create({
        order_id: order.id,
        product_id: i.product_id,
        quantity: i.qty,
        price: i.price,
        is_time_based: i.is_time_based || false,
        start_time: i.start_time ? new Date(i.start_time) : undefined,
        end_time: i.end_time ? new Date(i.end_time) : undefined,
        note: i.note,
      });
      await this.orderItemRepo.save(item);
      if (!i.is_time_based) {
        total += i.qty * i.price;
      }
    }

    order.total_amount = total;
    await this.orderRepo.save(order);

    const savedOrder = await this.orderRepo.findOne({
      where: { id: order.id },
      relations: ['items', 'items.product'],
    });

    return this.formatOrderResponse(savedOrder!);
  }

  async remove(orderId: number) {
    await this.orderItemRepo.delete({ order_id: orderId });
    const result = await this.orderRepo.delete({ id: orderId });
    if (result.affected === 0) {
      throw new NotFoundException('Order not found');
    }
    return { ok: true };
  }

  async confirmScoreboardOrder(orderId: number) {
    const sbOrder = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['items', 'items.product'],
    });

    if (!sbOrder) throw new NotFoundException('Order not found');
    if (sbOrder.status === 'confirmed') {
      return this.formatOrderResponse(sbOrder);
    }

    // find active order
    const queryBuilder = this.orderRepo.createQueryBuilder('order');
    queryBuilder
      .where('order.table_id = :tableId', { tableId: sbOrder.table_id })
      .andWhere('order.area_id = :areaId', { areaId: sbOrder.area_id })
      .andWhere('order.order_type != :type', { type: 'scoreboard' })
      .andWhere('order.status NOT IN (:...statuses)', {
        statuses: ['completed', 'cancelled'],
      })
      .leftJoinAndSelect('order.items', 'items');

    const activeOrder = await queryBuilder.getOne();

    if (activeOrder) {
      let totalAdditional = 0;
      for (const sbItem of sbOrder.items || []) {
        const existingItem = (activeOrder.items || []).find(
          (item) =>
            item.product_id === sbItem.product_id &&
            item.price === sbItem.price &&
            !item.is_time_based &&
            !sbItem.is_time_based,
        );

        if (existingItem) {
          existingItem.quantity += sbItem.quantity;
          await this.orderItemRepo.save(existingItem);
        } else {
          const newItem = this.orderItemRepo.create({
            order_id: activeOrder.id,
            product_id: sbItem.product_id,
            quantity: sbItem.quantity,
            price: sbItem.price,
            is_time_based: sbItem.is_time_based,
            note: sbItem.note,
          });
          await this.orderItemRepo.save(newItem);
        }

        if (!sbItem.is_time_based) {
          totalAdditional += sbItem.quantity * sbItem.price;
        }
      }
      activeOrder.total_amount =
        (activeOrder.total_amount || 0) + totalAdditional;
      await this.orderRepo.save(activeOrder);
    } else {
      const newActive = this.orderRepo.create({
        table_id: sbOrder.table_id,
        area_id: sbOrder.area_id,
        table_name: sbOrder.table_name,
        table_number: sbOrder.table_number,
        order_type: 'dine-in',
        status: 'dine-in',
      });
      await this.orderRepo.save(newActive);

      let totalAdditional = 0;
      for (const sbItem of sbOrder.items || []) {
        const newItem = this.orderItemRepo.create({
          order_id: newActive.id,
          product_id: sbItem.product_id,
          quantity: sbItem.quantity,
          price: sbItem.price,
          is_time_based: sbItem.is_time_based,
          note: sbItem.note,
        });
        await this.orderItemRepo.save(newItem);
        if (!sbItem.is_time_based) {
          totalAdditional += sbItem.quantity * sbItem.price;
        }
      }
      newActive.total_amount = totalAdditional;
      await this.orderRepo.save(newActive);
    }

    sbOrder.status = 'confirmed';
    await this.orderRepo.save(sbOrder);

    const savedOrder = await this.orderRepo.findOne({
      where: { id: sbOrder.id },
      relations: ['items', 'items.product'],
    });

    return this.formatOrderResponse(savedOrder!);
  }
}
