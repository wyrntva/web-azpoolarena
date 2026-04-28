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
exports.InventoryTransactionsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../entities");
const entities_2 = require("../../finance/entities");
let InventoryTransactionsService = class InventoryTransactionsService {
    txRepo;
    detailRepo;
    invRepo;
    receiptRepo;
    receiptTypeRepo;
    constructor(txRepo, detailRepo, invRepo, receiptRepo, receiptTypeRepo) {
        this.txRepo = txRepo;
        this.detailRepo = detailRepo;
        this.invRepo = invRepo;
        this.receiptRepo = receiptRepo;
        this.receiptTypeRepo = receiptTypeRepo;
    }
    updateStatus(inv) {
        if (inv.quantity <= 0) {
            inv.status = entities_1.InventoryStatus.OUT_OF_STOCK;
        }
        else if (inv.quantity <= inv.min_quantity) {
            inv.status = entities_1.InventoryStatus.LOW_STOCK;
        }
        else {
            inv.status = entities_1.InventoryStatus.IN_STOCK;
        }
    }
    async createInTransaction(dto, userId) {
        dto.transaction_type = entities_1.TransactionType.IN;
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
                throw new common_1.NotFoundException(`Sản phẩm với ID ${item.inventory_id} không tồn tại`);
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
            if (item.price && item.price > 0) {
                let rt = null;
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
        for (const [rtId, group] of Object.entries(itemsByReceiptType)) {
            const g = group;
            const notes = g.items.map((i) => `${i.quantity} ${i.unit} ${i.product_name}`);
            let note = `Nhập kho: ${notes.join(', ')}`;
            if (dto.note)
                note += ` - ${dto.note}`;
            let paymentMethod = 'cash';
            if (g.payment_methods.size > 0)
                paymentMethod = Array.from(g.payment_methods)[0];
            const receipt = this.receiptRepo.create({
                receipt_date: dto.transaction_date,
                amount: g.total,
                receipt_type_id: parseInt(rtId, 10),
                note,
                created_by: userId,
                is_income: false,
                payment_method: paymentMethod,
            });
            await this.receiptRepo.save(receipt);
        }
        return this.txRepo.findOne({
            where: { id: tx.id },
            relations: ['created_by_user', 'details', 'details.inventory'],
        });
    }
    async createOutTransaction(dto, userId) {
        dto.transaction_type = entities_1.TransactionType.OUT;
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
                throw new common_1.NotFoundException(`Sản phẩm với ID ${item.inventory_id} không tồn tại`);
            let actualQty = item.quantity;
            if (item.unit_type === 'large' && inv.conversion_rate) {
                actualQty = item.quantity * inv.conversion_rate;
            }
            if (inv.quantity < actualQty) {
                throw new common_1.BadRequestException(`Không đủ hàng trong kho. Sản phẩm '${inv.product_name}' chỉ còn ${inv.quantity}`);
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
    async findIns(skip = 0, limit = 100) {
        return this.txRepo.find({
            where: { transaction_type: entities_1.TransactionType.IN },
            relations: ['created_by_user', 'details', 'details.inventory'],
            order: { transaction_date: 'DESC' },
            skip,
            take: limit,
        });
    }
    async findOuts(skip = 0, limit = 100) {
        return this.txRepo.find({
            where: { transaction_type: entities_1.TransactionType.OUT },
            relations: ['created_by_user', 'details', 'details.inventory'],
            order: { transaction_date: 'DESC' },
            skip,
            take: limit,
        });
    }
};
exports.InventoryTransactionsService = InventoryTransactionsService;
exports.InventoryTransactionsService = InventoryTransactionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.InventoryTransactionEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.InventoryTransactionDetailEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.InventoryEntity)),
    __param(3, (0, typeorm_1.InjectRepository)(entities_2.ReceiptEntity)),
    __param(4, (0, typeorm_1.InjectRepository)(entities_2.ReceiptTypeEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], InventoryTransactionsService);
//# sourceMappingURL=inventory-transactions.service.js.map