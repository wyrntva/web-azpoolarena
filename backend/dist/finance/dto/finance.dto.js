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
exports.UpdateDebtDto = exports.CreateDebtDto = exports.UpdateSafeDto = exports.CreateSafeDto = exports.UpdateExchangeDto = exports.CreateExchangeDto = exports.UpdateRevenueDto = exports.CreateRevenueDto = exports.UpdateReceiptDto = exports.CreateReceiptDto = exports.UpdateReceiptTypeDto = exports.CreateReceiptTypeDto = void 0;
const class_validator_1 = require("class-validator");
const entities_1 = require("../entities");
class CreateReceiptTypeDto {
    name;
    description;
    category_id;
    is_active;
    is_inventory;
}
exports.CreateReceiptTypeDto = CreateReceiptTypeDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateReceiptTypeDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateReceiptTypeDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateReceiptTypeDto.prototype, "category_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateReceiptTypeDto.prototype, "is_active", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateReceiptTypeDto.prototype, "is_inventory", void 0);
class UpdateReceiptTypeDto {
    name;
    description;
    category_id;
    is_active;
    is_inventory;
}
exports.UpdateReceiptTypeDto = UpdateReceiptTypeDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateReceiptTypeDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateReceiptTypeDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateReceiptTypeDto.prototype, "category_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateReceiptTypeDto.prototype, "is_active", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateReceiptTypeDto.prototype, "is_inventory", void 0);
class CreateReceiptDto {
    receipt_date;
    amount;
    receipt_type_id;
    note;
    is_income;
    payment_method;
}
exports.CreateReceiptDto = CreateReceiptDto;
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateReceiptDto.prototype, "receipt_date", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateReceiptDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateReceiptDto.prototype, "receipt_type_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateReceiptDto.prototype, "note", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateReceiptDto.prototype, "is_income", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(entities_1.AccountType),
    __metadata("design:type", String)
], CreateReceiptDto.prototype, "payment_method", void 0);
class UpdateReceiptDto {
    receipt_date;
    amount;
    receipt_type_id;
    note;
    is_income;
    payment_method;
}
exports.UpdateReceiptDto = UpdateReceiptDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateReceiptDto.prototype, "receipt_date", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateReceiptDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateReceiptDto.prototype, "receipt_type_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateReceiptDto.prototype, "note", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateReceiptDto.prototype, "is_income", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(entities_1.AccountType),
    __metadata("design:type", String)
], UpdateReceiptDto.prototype, "payment_method", void 0);
class CreateRevenueDto {
    revenue_date;
    cash_revenue;
    bank_revenue;
    note;
}
exports.CreateRevenueDto = CreateRevenueDto;
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateRevenueDto.prototype, "revenue_date", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateRevenueDto.prototype, "cash_revenue", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateRevenueDto.prototype, "bank_revenue", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRevenueDto.prototype, "note", void 0);
class UpdateRevenueDto {
    cash_revenue;
    bank_revenue;
    note;
}
exports.UpdateRevenueDto = UpdateRevenueDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateRevenueDto.prototype, "cash_revenue", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateRevenueDto.prototype, "bank_revenue", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateRevenueDto.prototype, "note", void 0);
class CreateExchangeDto {
    exchange_date;
    amount;
    from_account;
    to_account;
    note;
}
exports.CreateExchangeDto = CreateExchangeDto;
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateExchangeDto.prototype, "exchange_date", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateExchangeDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(entities_1.AccountType),
    __metadata("design:type", String)
], CreateExchangeDto.prototype, "from_account", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(entities_1.AccountType),
    __metadata("design:type", String)
], CreateExchangeDto.prototype, "to_account", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateExchangeDto.prototype, "note", void 0);
class UpdateExchangeDto {
    exchange_date;
    amount;
    from_account;
    to_account;
    note;
}
exports.UpdateExchangeDto = UpdateExchangeDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateExchangeDto.prototype, "exchange_date", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateExchangeDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(entities_1.AccountType),
    __metadata("design:type", String)
], UpdateExchangeDto.prototype, "from_account", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(entities_1.AccountType),
    __metadata("design:type", String)
], UpdateExchangeDto.prototype, "to_account", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateExchangeDto.prototype, "note", void 0);
class CreateSafeDto {
    safe_date;
    amount;
    note;
}
exports.CreateSafeDto = CreateSafeDto;
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateSafeDto.prototype, "safe_date", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateSafeDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSafeDto.prototype, "note", void 0);
class UpdateSafeDto {
    safe_date;
    amount;
    note;
}
exports.UpdateSafeDto = UpdateSafeDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateSafeDto.prototype, "safe_date", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateSafeDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSafeDto.prototype, "note", void 0);
class CreateDebtDto {
    debt_date;
    amount;
    debtor_name;
    note;
    is_paid;
    paid_date;
    payment_method;
}
exports.CreateDebtDto = CreateDebtDto;
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateDebtDto.prototype, "debt_date", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateDebtDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDebtDto.prototype, "debtor_name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDebtDto.prototype, "note", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateDebtDto.prototype, "is_paid", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateDebtDto.prototype, "paid_date", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(entities_1.AccountType),
    __metadata("design:type", String)
], CreateDebtDto.prototype, "payment_method", void 0);
class UpdateDebtDto {
    debt_date;
    amount;
    debtor_name;
    note;
    is_paid;
    paid_date;
    payment_method;
}
exports.UpdateDebtDto = UpdateDebtDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateDebtDto.prototype, "debt_date", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateDebtDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateDebtDto.prototype, "debtor_name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateDebtDto.prototype, "note", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateDebtDto.prototype, "is_paid", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateDebtDto.prototype, "paid_date", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(entities_1.AccountType),
    __metadata("design:type", String)
], UpdateDebtDto.prototype, "payment_method", void 0);
//# sourceMappingURL=finance.dto.js.map