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
exports.WifiConfigsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../entities");
let WifiConfigsService = class WifiConfigsService {
    wifiRepo;
    constructor(wifiRepo) {
        this.wifiRepo = wifiRepo;
    }
    async create(dto) {
        const config = this.wifiRepo.create(dto);
        return this.wifiRepo.save(config);
    }
    async findAll(isActive) {
        const query = this.wifiRepo
            .createQueryBuilder('wifi')
            .orderBy('wifi.created_at', 'DESC');
        if (isActive !== undefined) {
            query.andWhere('wifi.is_active = :isActive', { isActive });
        }
        return query.getMany();
    }
    async findApproved() {
        const configs = await this.wifiRepo.find({ where: { is_active: true } });
        return configs.map((c) => ({
            id: c.id,
            ssid: c.ssid,
            description: c.description,
        }));
    }
    async findOne(id) {
        const config = await this.wifiRepo.findOne({ where: { id } });
        if (!config)
            throw new common_1.NotFoundException('WiFi configuration not found');
        return config;
    }
    async update(id, dto) {
        const config = await this.findOne(id);
        Object.assign(config, dto);
        return this.wifiRepo.save(config);
    }
    async remove(id) {
        const config = await this.findOne(id);
        await this.wifiRepo.remove(config);
        return null;
    }
};
exports.WifiConfigsService = WifiConfigsService;
exports.WifiConfigsService = WifiConfigsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.WiFiConfigEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], WifiConfigsService);
//# sourceMappingURL=wifi-configs.service.js.map