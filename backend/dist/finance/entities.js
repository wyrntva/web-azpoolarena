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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebtEntity = exports.SafeEntity = exports.ExchangeEntity = exports.RevenueEntity = exports.ReceiptEntity = exports.ReceiptTypeEntity = exports.AccountType = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../users/entities/user.entity");
const entities_1 = require("../inventory/entities");
var AccountType;
(function (AccountType) {
    AccountType["CASH"] = "cash";
    AccountType["BANK"] = "bank";
})(AccountType || (exports.AccountType = AccountType = {}));
let ReceiptTypeEntity = class ReceiptTypeEntity {
    id;
    name;
    description;
    category_id;
    is_active;
    is_inventory;
    created_at;
    updated_at;
    category;
};
exports.ReceiptTypeEntity = ReceiptTypeEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ReceiptTypeEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, unique: true }),
    __metadata("design:type", String)
], ReceiptTypeEntity.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], ReceiptTypeEntity.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], ReceiptTypeEntity.prototype, "category_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], ReceiptTypeEntity.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], ReceiptTypeEntity.prototype, "is_inventory", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ReceiptTypeEntity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], ReceiptTypeEntity.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => entities_1.CategoryEntity),
    (0, typeorm_1.JoinColumn)({ name: 'category_id' }),
    __metadata("design:type", entities_1.CategoryEntity)
], ReceiptTypeEntity.prototype, "category", void 0);
exports.ReceiptTypeEntity = ReceiptTypeEntity = __decorate([
    (0, typeorm_1.Entity)('receipt_types')
], ReceiptTypeEntity);
let ReceiptEntity = class ReceiptEntity {
    id;
    receipt_date;
    amount;
    receipt_type_id;
    note;
    created_by;
    is_income;
    payment_method;
    created_at;
    updated_at;
    receipt_type;
    created_by_user;
};
exports.ReceiptEntity = ReceiptEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ReceiptEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Object)
], ReceiptEntity.prototype, "receipt_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float' }),
    __metadata("design:type", Number)
], ReceiptEntity.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], ReceiptEntity.prototype, "receipt_type_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ReceiptEntity.prototype, "note", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], ReceiptEntity.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], ReceiptEntity.prototype, "is_income", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: AccountType, default: AccountType.CASH }),
    __metadata("design:type", String)
], ReceiptEntity.prototype, "payment_method", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ReceiptEntity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], ReceiptEntity.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => ReceiptTypeEntity),
    (0, typeorm_1.JoinColumn)({ name: 'receipt_type_id' }),
    __metadata("design:type", ReceiptTypeEntity)
], ReceiptEntity.prototype, "receipt_type", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.UserEntity),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", user_entity_1.UserEntity)
], ReceiptEntity.prototype, "created_by_user", void 0);
exports.ReceiptEntity = ReceiptEntity = __decorate([
    (0, typeorm_1.Entity)('receipts')
], ReceiptEntity);
let RevenueEntity = class RevenueEntity {
    id;
    revenue_date;
    cash_revenue;
    bank_revenue;
    note;
    created_by;
    created_at;
    updated_at;
    created_by_user;
};
exports.RevenueEntity = RevenueEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], RevenueEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', unique: true }),
    __metadata("design:type", Object)
], RevenueEntity.prototype, "revenue_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', default: 0.0 }),
    __metadata("design:type", Number)
], RevenueEntity.prototype, "cash_revenue", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', default: 0.0 }),
    __metadata("design:type", Number)
], RevenueEntity.prototype, "bank_revenue", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], RevenueEntity.prototype, "note", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], RevenueEntity.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], RevenueEntity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], RevenueEntity.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.UserEntity),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", user_entity_1.UserEntity)
], RevenueEntity.prototype, "created_by_user", void 0);
exports.RevenueEntity = RevenueEntity = __decorate([
    (0, typeorm_1.Entity)('revenues')
], RevenueEntity);
let ExchangeEntity = class ExchangeEntity {
    id;
    exchange_date;
    amount;
    from_account;
    to_account;
    note;
    created_by;
    created_at;
    updated_at;
    created_by_user;
};
exports.ExchangeEntity = ExchangeEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ExchangeEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Object)
], ExchangeEntity.prototype, "exchange_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float' }),
    __metadata("design:type", Number)
], ExchangeEntity.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: AccountType }),
    __metadata("design:type", String)
], ExchangeEntity.prototype, "from_account", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: AccountType }),
    __metadata("design:type", String)
], ExchangeEntity.prototype, "to_account", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ExchangeEntity.prototype, "note", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], ExchangeEntity.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ExchangeEntity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], ExchangeEntity.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.UserEntity),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", user_entity_1.UserEntity)
], ExchangeEntity.prototype, "created_by_user", void 0);
exports.ExchangeEntity = ExchangeEntity = __decorate([
    (0, typeorm_1.Entity)('exchanges')
], ExchangeEntity);
let SafeEntity = class SafeEntity {
    id;
    safe_date;
    amount;
    note;
    created_by;
    created_at;
    updated_at;
    created_by_user;
};
exports.SafeEntity = SafeEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], SafeEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Object)
], SafeEntity.prototype, "safe_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float' }),
    __metadata("design:type", Number)
], SafeEntity.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], SafeEntity.prototype, "note", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], SafeEntity.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], SafeEntity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], SafeEntity.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.UserEntity),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", user_entity_1.UserEntity)
], SafeEntity.prototype, "created_by_user", void 0);
exports.SafeEntity = SafeEntity = __decorate([
    (0, typeorm_1.Entity)('safes')
], SafeEntity);
let DebtEntity = class DebtEntity {
    id;
    debt_date;
    amount;
    debtor_name;
    note;
    is_paid;
    paid_date;
    payment_method;
    created_by;
    created_at;
    updated_at;
    created_by_user;
};
exports.DebtEntity = DebtEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], DebtEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Object)
], DebtEntity.prototype, "debt_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float' }),
    __metadata("design:type", Number)
], DebtEntity.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], DebtEntity.prototype, "debtor_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], DebtEntity.prototype, "note", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], DebtEntity.prototype, "is_paid", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Object)
], DebtEntity.prototype, "paid_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: AccountType, nullable: true }),
    __metadata("design:type", String)
], DebtEntity.prototype, "payment_method", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], DebtEntity.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], DebtEntity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], DebtEntity.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.UserEntity),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", user_entity_1.UserEntity)
], DebtEntity.prototype, "created_by_user", void 0);
exports.DebtEntity = DebtEntity = __decorate([
    (0, typeorm_1.Entity)('debts')
], DebtEntity);
//# sourceMappingURL=entities.js.map