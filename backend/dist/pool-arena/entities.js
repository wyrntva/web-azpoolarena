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
exports.PoolArenaUserEntity = exports.PoolArenaUserGender = void 0;
const typeorm_1 = require("typeorm");
var PoolArenaUserGender;
(function (PoolArenaUserGender) {
    PoolArenaUserGender["MALE"] = "male";
    PoolArenaUserGender["FEMALE"] = "female";
    PoolArenaUserGender["OTHER"] = "other";
})(PoolArenaUserGender || (exports.PoolArenaUserGender = PoolArenaUserGender = {}));
let PoolArenaUserEntity = class PoolArenaUserEntity {
    id;
    full_name;
    gender;
    address;
    rank;
    phone_number;
    email;
    avatar_url;
    hashed_password;
    role;
    is_active;
    is_phone_verified;
    is_email_verified;
    points;
    tiktok_url;
    facebook_url;
    instagram_url;
    total_games;
    wins;
    losses;
    created_at;
    updated_at;
};
exports.PoolArenaUserEntity = PoolArenaUserEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], PoolArenaUserEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], PoolArenaUserEntity.prototype, "full_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: PoolArenaUserGender, nullable: true }),
    __metadata("design:type", String)
], PoolArenaUserEntity.prototype, "gender", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], PoolArenaUserEntity.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10, nullable: true }),
    __metadata("design:type", String)
], PoolArenaUserEntity.prototype, "rank", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, unique: true }),
    __metadata("design:type", String)
], PoolArenaUserEntity.prototype, "phone_number", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, unique: true, nullable: true }),
    __metadata("design:type", String)
], PoolArenaUserEntity.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", String)
], PoolArenaUserEntity.prototype, "avatar_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], PoolArenaUserEntity.prototype, "hashed_password", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: 'player' }),
    __metadata("design:type", String)
], PoolArenaUserEntity.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], PoolArenaUserEntity.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], PoolArenaUserEntity.prototype, "is_phone_verified", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], PoolArenaUserEntity.prototype, "is_email_verified", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], PoolArenaUserEntity.prototype, "points", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", String)
], PoolArenaUserEntity.prototype, "tiktok_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", String)
], PoolArenaUserEntity.prototype, "facebook_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", String)
], PoolArenaUserEntity.prototype, "instagram_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], PoolArenaUserEntity.prototype, "total_games", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], PoolArenaUserEntity.prototype, "wins", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], PoolArenaUserEntity.prototype, "losses", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PoolArenaUserEntity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], PoolArenaUserEntity.prototype, "updated_at", void 0);
exports.PoolArenaUserEntity = PoolArenaUserEntity = __decorate([
    (0, typeorm_1.Entity)('pool_arena_users')
], PoolArenaUserEntity);
//# sourceMappingURL=entities.js.map