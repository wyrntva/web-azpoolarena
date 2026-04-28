"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PosOrdersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../entities");
let PosOrdersService = class PosOrdersService {
    orderRepo;
    orderItemRepo;
    productRepo;
    constructor(orderRepo, orderItemRepo, productRepo) {
        this.orderRepo = orderRepo;
        this.orderItemRepo = orderItemRepo;
        this.productRepo = productRepo;
    }
    async formatOrderResponse(order) {
        const items = [];
        for (const i of order.items || []) {
            let prodData = null;
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
    async create(dto) {
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
        return this.formatOrderResponse(savedOrder);
    }
    async findAll(orderType, tableId, areaId) {
        const where = {};
        if (orderType)
            where.order_type = orderType;
        if (tableId)
            where.table_id = tableId;
        if (areaId)
            where.area_id = areaId;
        const orders = await this.orderRepo.find({
            where,
            relations: ['items', 'items.product'],
            order: { created_at: 'DESC' },
        });
        return Promise.all(orders.map((o) => this.formatOrderResponse(o)));
    }
    async update(orderId, dto) {
        const order = await this.orderRepo.findOne({ where: { id: orderId } });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        if (dto.table_id !== undefined)
            order.table_id = dto.table_id;
        if (dto.area_id !== undefined)
            order.area_id = dto.area_id;
        if (dto.table_name !== undefined)
            order.table_name = dto.table_name;
        if (dto.status !== undefined)
            order.status = dto.status;
        if (dto.customer_count !== undefined)
            order.customer_count = dto.customer_count;
        await this.orderItemRepo.delete({ order_id: orderId });
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
        return this.formatOrderResponse(savedOrder);
    }
    async remove(orderId) {
        await this.orderItemRepo.delete({ order_id: orderId });
        const result = await this.orderRepo.delete({ id: orderId });
        if (result.affected === 0) {
            throw new common_1.NotFoundException('Order not found');
        }
        return { ok: true };
    }
    async confirmScoreboardOrder(orderId) {
        const sbOrder = await this.orderRepo.findOne({
            where: { id: orderId },
            relations: ['items', 'items.product'],
        });
        if (!sbOrder)
            throw new common_1.NotFoundException('Order not found');
        if (sbOrder.status === 'confirmed') {
            return this.formatOrderResponse(sbOrder);
        }
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
                const existingItem = (activeOrder.items || []).find((item) => item.product_id === sbItem.product_id &&
                    item.price === sbItem.price &&
                    !item.is_time_based &&
                    !sbItem.is_time_based);
                if (existingItem) {
                    existingItem.quantity += sbItem.quantity;
                    await this.orderItemRepo.save(existingItem);
                }
                else {
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
        }
        else {
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
        return this.formatOrderResponse(savedOrder);
    }
};
exports.PosOrdersService = PosOrdersService;
exports.PosOrdersService = PosOrdersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.PosOrderEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.PosOrderItemEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.ProductEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], PosOrdersService);
//# sourceMappingURL=pos-orders.service.js.map