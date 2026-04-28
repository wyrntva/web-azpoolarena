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
exports.InventoryTransactionDetailEntity = exports.InventoryTransactionEntity = exports.InventoryEntity = exports.UnitEntity = exports.CategoryEntity = exports.AccountType = exports.TransactionType = exports.InventoryStatus = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../users/entities/user.entity");
var InventoryStatus;
(function (InventoryStatus) {
    InventoryStatus["IN_STOCK"] = "in_stock";
    InventoryStatus["OUT_OF_STOCK"] = "out_of_stock";
    InventoryStatus["LOW_STOCK"] = "low_stock";
})(InventoryStatus || (exports.InventoryStatus = InventoryStatus = {}));
var TransactionType;
(function (TransactionType) {
    TransactionType["IN"] = "in";
    TransactionType["OUT"] = "out";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
var AccountType;
(function (AccountType) {
    AccountType["CASH"] = "cash";
    AccountType["BANK"] = "bank";
})(AccountType || (exports.AccountType = AccountType = {}));
let CategoryEntity = class CategoryEntity {
    id;
    name;
    description;
    is_active;
    created_at;
    updated_at;
    inventories;
};
exports.CategoryEntity = CategoryEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], CategoryEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, unique: true }),
    __metadata("design:type", String)
], CategoryEntity.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], CategoryEntity.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], CategoryEntity.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], CategoryEntity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], CategoryEntity.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => InventoryEntity, (inv) => inv.category),
    __metadata("design:type", Array)
], CategoryEntity.prototype, "inventories", void 0);
exports.CategoryEntity = CategoryEntity = __decorate([
    (0, typeorm_1.Entity)('categories')
], CategoryEntity);
let UnitEntity = class UnitEntity {
    id;
    name;
    description;
    is_active;
    created_at;
    updated_at;
};
exports.UnitEntity = UnitEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], UnitEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, unique: true }),
    __metadata("design:type", String)
], UnitEntity.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], UnitEntity.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], UnitEntity.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], UnitEntity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], UnitEntity.prototype, "updated_at", void 0);
exports.UnitEntity = UnitEntity = __decorate([
    (0, typeorm_1.Entity)('units')
], UnitEntity);
let InventoryEntity = class InventoryEntity {
    id;
    product_name;
    quantity;
    min_quantity;
    category_id;
    base_unit_id;
    conversion_unit_id;
    conversion_rate;
    status;
    created_by;
    created_at;
    updated_at;
    created_by_user;
    category;
    base_unit_ref;
    conversion_unit_ref;
};
exports.InventoryEntity = InventoryEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], InventoryEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 200 }),
    __metadata("design:type", String)
], InventoryEntity.prototype, "product_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], InventoryEntity.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], InventoryEntity.prototype, "min_quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], InventoryEntity.prototype, "category_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], InventoryEntity.prototype, "base_unit_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], InventoryEntity.prototype, "conversion_unit_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], InventoryEntity.prototype, "conversion_rate", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: InventoryStatus,
        default: InventoryStatus.IN_STOCK,
    }),
    __metadata("design:type", String)
], InventoryEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], InventoryEntity.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], InventoryEntity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], InventoryEntity.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.UserEntity),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", user_entity_1.UserEntity)
], InventoryEntity.prototype, "created_by_user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => CategoryEntity),
    (0, typeorm_1.JoinColumn)({ name: 'category_id' }),
    __metadata("design:type", CategoryEntity)
], InventoryEntity.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UnitEntity),
    (0, typeorm_1.JoinColumn)({ name: 'base_unit_id' }),
    __metadata("design:type", UnitEntity)
], InventoryEntity.prototype, "base_unit_ref", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UnitEntity),
    (0, typeorm_1.JoinColumn)({ name: 'conversion_unit_id' }),
    __metadata("design:type", UnitEntity)
], InventoryEntity.prototype, "conversion_unit_ref", void 0);
exports.InventoryEntity = InventoryEntity = __decorate([
    (0, typeorm_1.Entity)('inventories')
], InventoryEntity);
let InventoryTransactionEntity = class InventoryTransactionEntity {
    id;
    transaction_date;
    transaction_type;
    note;
    created_by;
    created_at;
    created_by_user;
    details;
};
exports.InventoryTransactionEntity = InventoryTransactionEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], InventoryTransactionEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Object)
], InventoryTransactionEntity.prototype, "transaction_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: TransactionType }),
    __metadata("design:type", String)
], InventoryTransactionEntity.prototype, "transaction_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], InventoryTransactionEntity.prototype, "note", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], InventoryTransactionEntity.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], InventoryTransactionEntity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.UserEntity),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", user_entity_1.UserEntity)
], InventoryTransactionEntity.prototype, "created_by_user", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => InventoryTransactionDetailEntity, (detail) => detail.transaction, { cascade: true }),
    __metadata("design:type", Array)
], InventoryTransactionEntity.prototype, "details", void 0);
exports.InventoryTransactionEntity = InventoryTransactionEntity = __decorate([
    (0, typeorm_1.Entity)('inventory_transactions')
], InventoryTransactionEntity);
let InventoryTransactionDetailEntity = class InventoryTransactionDetailEntity {
    id;
    transaction_id;
    inventory_id;
    quantity;
    unit_type;
    price;
    payment_method;
    created_at;
    transaction;
    inventory;
};
exports.InventoryTransactionDetailEntity = InventoryTransactionDetailEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], InventoryTransactionDetailEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], InventoryTransactionDetailEntity.prototype, "transaction_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], InventoryTransactionDetailEntity.prototype, "inventory_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], InventoryTransactionDetailEntity.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'base' }),
    __metadata("design:type", String)
], InventoryTransactionDetailEntity.prototype, "unit_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], InventoryTransactionDetailEntity.prototype, "price", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: AccountType, nullable: true }),
    __metadata("design:type", String)
], InventoryTransactionDetailEntity.prototype, "payment_method", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], InventoryTransactionDetailEntity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => InventoryTransactionEntity, (tx) => tx.details, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'transaction_id' }),
    __metadata("design:type", InventoryTransactionEntity)
], InventoryTransactionDetailEntity.prototype, "transaction", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => InventoryEntity),
    (0, typeorm_1.JoinColumn)({ name: 'inventory_id' }),
    __metadata("design:type", InventoryEntity)
], InventoryTransactionDetailEntity.prototype, "inventory", void 0);
exports.InventoryTransactionDetailEntity = InventoryTransactionDetailEntity = __decorate([
    (0, typeorm_1.Entity)('inventory_transaction_details')
], InventoryTransactionDetailEntity);
//# sourceMappingURL=entities.js.map