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
exports.AttendanceSettingsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../entities");
let AttendanceSettingsService = class AttendanceSettingsService {
    settingsRepo;
    constructor(settingsRepo) {
        this.settingsRepo = settingsRepo;
    }
    getDefaultPenaltyTiers() {
        return JSON.stringify([
            { max_minutes: 15, penalty_amount: 0 },
            { max_minutes: 30, penalty_amount: 50000 },
            { max_minutes: 60, penalty_amount: 100000 },
            { max_minutes: null, penalty_amount: 200000 },
        ]);
    }
    mapResponse(settings) {
        return {
            id: settings.id,
            allowed_late_minutes: settings.allowed_late_minutes,
            penalty_tiers: JSON.parse(settings.penalty_tiers || '[]'),
            early_checkout_grace_minutes: settings.early_checkout_grace_minutes,
            early_checkout_penalty: settings.early_checkout_penalty,
            absent_penalty: settings.absent_penalty,
            auto_absent_enabled: settings.auto_absent_enabled,
            notes: settings.notes,
            is_active: settings.is_active,
            created_at: settings.created_at,
            updated_at: settings.updated_at,
        };
    }
    async getSettings() {
        let settings = await this.settingsRepo.findOne({
            where: { is_active: true },
        });
        if (!settings) {
            settings = this.settingsRepo.create({
                allowed_late_minutes: 15,
                penalty_tiers: this.getDefaultPenaltyTiers(),
                early_checkout_grace_minutes: 10,
                early_checkout_penalty: 50000,
                absent_penalty: 100000,
                auto_absent_enabled: true,
                is_active: true,
            });
            await this.settingsRepo.save(settings);
        }
        return this.mapResponse(settings);
    }
    async updateSettings(dto) {
        let settings = await this.settingsRepo.findOne({
            where: { is_active: true },
        });
        if (!settings) {
            settings = this.settingsRepo.create({
                allowed_late_minutes: 15,
                penalty_tiers: this.getDefaultPenaltyTiers(),
                early_checkout_grace_minutes: 10,
                early_checkout_penalty: 50000,
                absent_penalty: 100000,
                auto_absent_enabled: true,
                is_active: true,
            });
        }
        if (dto.allowed_late_minutes !== undefined)
            settings.allowed_late_minutes = dto.allowed_late_minutes;
        if (dto.penalty_tiers !== undefined)
            settings.penalty_tiers = JSON.stringify(dto.penalty_tiers);
        if (dto.early_checkout_grace_minutes !== undefined)
            settings.early_checkout_grace_minutes = dto.early_checkout_grace_minutes;
        if (dto.early_checkout_penalty !== undefined)
            settings.early_checkout_penalty = dto.early_checkout_penalty;
        if (dto.absent_penalty !== undefined)
            settings.absent_penalty = dto.absent_penalty;
        if (dto.auto_absent_enabled !== undefined)
            settings.auto_absent_enabled = dto.auto_absent_enabled;
        if (dto.notes !== undefined)
            settings.notes = dto.notes;
        await this.settingsRepo.save(settings);
        return this.mapResponse(settings);
    }
    async createSettings(dto) {
        await this.settingsRepo.update({ is_active: true }, { is_active: false });
        const newSettings = this.settingsRepo.create({
            allowed_late_minutes: dto.allowed_late_minutes ?? 15,
            penalty_tiers: JSON.stringify(dto.penalty_tiers),
            early_checkout_grace_minutes: dto.early_checkout_grace_minutes ?? 10,
            early_checkout_penalty: dto.early_checkout_penalty ?? 50000,
            absent_penalty: dto.absent_penalty ?? 100000,
            auto_absent_enabled: dto.auto_absent_enabled ?? true,
            notes: dto.notes,
            is_active: true,
        });
        await this.settingsRepo.save(newSettings);
        return this.mapResponse(newSettings);
    }
};
exports.AttendanceSettingsService = AttendanceSettingsService;
exports.AttendanceSettingsService = AttendanceSettingsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.AttendanceSettingsEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AttendanceSettingsService);
//# sourceMappingURL=attendance-settings.service.js.map