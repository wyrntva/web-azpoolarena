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
exports.StoreSettingsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../entities");
let StoreSettingsService = class StoreSettingsService {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    async getSettings() {
        let settings = await this.repo.findOne({ where: {} });
        if (!settings) {
            settings = this.repo.create({
                name: 'AZ Pool Arena',
                currency: 'VND',
                banner_scoreboard: '[]',
                banner_tournament: '[]',
            });
            await this.repo.save(settings);
        }
        return settings;
    }
    async updateSettings(dto) {
        const settings = await this.getSettings();
        Object.assign(settings, dto);
        return this.repo.save(settings);
    }
    async addBanner(type, url) {
        const settings = await this.getSettings();
        const fieldName = `banner_${type}`;
        if (type === 'ranking' || type === 'member') {
            settings[fieldName] = url;
        }
        else {
            let current = [];
            if (settings[fieldName]) {
                try {
                    current = JSON.parse(settings[fieldName]);
                }
                catch {
                    if (settings[fieldName])
                        current = [settings[fieldName]];
                }
            }
            if (!Array.isArray(current))
                current = [];
            current.push(url);
            settings[fieldName] = JSON.stringify(current);
        }
        return this.repo.save(settings);
    }
    async removeBanner(type, index) {
        const settings = await this.getSettings();
        const fieldName = `banner_${type}`;
        if (settings[fieldName]) {
            try {
                const current = JSON.parse(settings[fieldName]);
                if (Array.isArray(current) && index >= 0 && index < current.length) {
                    current.splice(index, 1);
                    settings[fieldName] = JSON.stringify(current);
                    return this.repo.save(settings);
                }
            }
            catch { }
        }
        return settings;
    }
    async removeSingleBanner(type) {
        const settings = await this.getSettings();
        const fieldName = `banner_${type}`;
        settings[fieldName] = null;
        return this.repo.save(settings);
    }
};
exports.StoreSettingsService = StoreSettingsService;
exports.StoreSettingsService = StoreSettingsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.StoreSettingsEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], StoreSettingsService);
//# sourceMappingURL=store-settings.service.js.map