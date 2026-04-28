"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var SwitchesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwitchesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const switch_entity_1 = require("./entities/switch.entity");
const area_entity_1 = require("../areas/entities/area.entity");
const http = __importStar(require("http"));
const mqtt = __importStar(require("mqtt"));
const VALID_SWITCH_TYPES = [
    'light',
    'scoreboard',
    'tv',
    'ac',
    'ceiling_light',
    'fan',
    'exhaust_fan',
    'sign_light',
    'other',
];
let SwitchesService = SwitchesService_1 = class SwitchesService {
    switchRepo;
    tableRepo;
    areaRepo;
    logger = new common_1.Logger(SwitchesService_1.name);
    mqttClient;
    constructor(switchRepo, tableRepo, areaRepo) {
        this.switchRepo = switchRepo;
        this.tableRepo = tableRepo;
        this.areaRepo = areaRepo;
        const mqttUrl = process.env.MQTT_URL || 'mqtt://localhost:1883';
        this.mqttClient = mqtt.connect(mqttUrl);
    }
    async findAll() {
        const dupes = await this.switchRepo
            .createQueryBuilder('s')
            .select('s.name')
            .where('s.switch_type = :type', { type: 'scoreboard' })
            .groupBy('s.name')
            .having('COUNT(s.id) > 1')
            .getRawMany();
        for (const dupe of dupes) {
            const allDupes = await this.switchRepo.find({
                where: { switch_type: 'scoreboard', name: dupe.s_name },
                order: { id: 'ASC' },
            });
            if (allDupes.length > 1) {
                await this.switchRepo.remove(allDupes.slice(1));
            }
        }
        const connectedTables = await this.tableRepo
            .createQueryBuilder('t')
            .where('t.device_activated_at IS NOT NULL')
            .getMany();
        for (const table of connectedTables) {
            const area = await this.areaRepo.findOne({
                where: { id: table.area_id },
            });
            const areaName = area?.name ?? '';
            const switchNamePC = `Scoreboard - ${table.name}`;
            const descriptionPC = `Máy tính bảng tỉ số ${table.name}`;
            const existingPC = await this.switchRepo.findOne({
                where: { name: switchNamePC, switch_type: 'scoreboard' },
            });
            if (existingPC) {
                let changed = false;
                if (existingPC.description !== descriptionPC) {
                    existingPC.description = descriptionPC;
                    changed = true;
                }
                if (existingPC.area_name !== areaName) {
                    existingPC.area_name = areaName;
                    changed = true;
                }
                if (existingPC.sort_order !== table.id) {
                    existingPC.sort_order = table.id;
                    changed = true;
                }
                if (changed)
                    await this.switchRepo.save(existingPC);
            }
            else {
                await this.switchRepo.save(this.switchRepo.create({
                    name: switchNamePC,
                    switch_type: 'scoreboard',
                    description: descriptionPC,
                    area_name: areaName,
                    sort_order: table.id,
                    is_active: false,
                    created_at: new Date(),
                    updated_at: new Date(),
                }));
            }
        }
        return this.switchRepo.find({
            order: { switch_type: 'ASC', sort_order: 'ASC', name: 'ASC' },
        });
    }
    async create(dto) {
        if (!dto.switch_type || !VALID_SWITCH_TYPES.includes(dto.switch_type)) {
            throw new common_1.BadRequestException(`Invalid switch type. Choose: ${VALID_SWITCH_TYPES.join(', ')}`);
        }
        const sw = this.switchRepo.create({
            ...dto,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
        });
        return this.switchRepo.save(sw);
    }
    async update(id, dto) {
        const sw = await this.switchRepo.findOne({ where: { id } });
        if (!sw)
            throw new common_1.NotFoundException('Công tắc không tồn tại');
        if (dto.switch_type && !VALID_SWITCH_TYPES.includes(dto.switch_type)) {
            throw new common_1.BadRequestException(`Invalid switch type`);
        }
        Object.assign(sw, dto);
        if (dto.is_active !== undefined) {
            if (sw.switch_type === 'scoreboard') {
                const tableName = sw.name.replace('Scoreboard - ', '');
                const payload = JSON.stringify({ type: 'scoreboard', table_name: tableName, action: dto.is_active ? 'ON' : 'OFF' });
                this.mqttClient.publish('azpool/master_esp/control', payload);
                this.logger.log(`[MQTT] Lệnh tắt/bật PC: ${payload}`);
            }
            else if (['tv', 'light', 'other', 'fan', 'ac'].includes(sw.switch_type) && !sw.ip_address) {
                const payload = JSON.stringify({ type: sw.switch_type, target: sw.name, action: dto.is_active ? 'ON' : 'OFF' });
                this.mqttClient.publish('azpool/master_esp/control', payload);
                this.logger.log(`[MQTT] Lệnh điều khiển thiết bị: ${payload}`);
            }
            else if (sw.ip_address) {
                this.sendEspCommand(sw.name, sw.ip_address, sw.port, sw.is_active);
            }
        }
        return this.switchRepo.save(sw);
    }
    async remove(id) {
        const sw = await this.switchRepo.findOne({ where: { id } });
        if (!sw)
            throw new common_1.NotFoundException('Công tắc không tồn tại');
        await this.switchRepo.remove(sw);
        return { success: true, message: 'Xóa công tắc thành công' };
    }
    async getEspStatus(code, ip) {
        const switches = await this.switchRepo.find({
            where: { device_code: code.toUpperCase() },
            order: { port: 'ASC' },
        });
        if (ip && switches.length > 0) {
            for (const s of switches) {
                if (s.ip_address !== ip) {
                    s.ip_address = ip;
                    await this.switchRepo.save(s);
                }
            }
        }
        return {
            relays: switches.map((s) => ({
                channel: s.port || 0,
                active: s.is_active,
                name: s.name,
            })),
        };
    }
    async updateStatusByReport(tableName, isActive) {
        const switchName = `Scoreboard - ${tableName}`;
        const sw = await this.switchRepo.findOne({
            where: { name: switchName, switch_type: 'scoreboard' },
        });
        if (sw && sw.is_active !== isActive) {
            sw.is_active = isActive;
            await this.switchRepo.save(sw);
            this.logger.log(`[MQTT Sync] Bảng ${tableName} -> ${isActive ? 'ON' : 'OFF'}`);
        }
    }
    async handleDiscovery(data) {
        if (!data || !data.name || !data.switch_type)
            return;
        if (!VALID_SWITCH_TYPES.includes(data.switch_type))
            return;
        const existing = await this.switchRepo.findOne({ where: { name: data.name, switch_type: data.switch_type } });
        if (!existing) {
            await this.switchRepo.save(this.switchRepo.create({
                name: data.name,
                switch_type: data.switch_type,
                description: `Tự động nhận diện qua mạng: ${data.name}`,
                is_active: data.is_active || false,
                sort_order: 9999,
                created_at: new Date(),
                updated_at: new Date(),
            }));
            this.logger.log(`[Auto-Discovery] Đã thêm thiết bị cắm-là-chạy ngầm: ${data.name}`);
        }
        else {
            if (data.is_active !== undefined && existing.is_active !== data.is_active) {
                existing.is_active = data.is_active;
                await this.switchRepo.save(existing);
                this.logger.log(`[Hardware Sync] Trạng thái thực tế thiết bị ${data.name} đè lên UI: ${data.is_active ? 'ON' : 'OFF'}`);
            }
        }
    }
    sendEspCommand(name, ipAddress, port, isActive) {
        const command = isActive ? 'on' : 'off';
        const path = port ? `/${port}/${command}` : `/${command}`;
        const url = `http://${ipAddress}${path}`;
        const req = http.get(url, { timeout: 5000 }, (res) => {
            let body = '';
            res.on('data', (chunk) => (body += chunk));
            res.on('end', () => {
                this.logger.log(`ESP [${name}] ${url} -> ${res.statusCode}: ${body}`);
            });
        });
        req.on('error', (err) => {
            this.logger.warn(`ESP [${name}] no response: ${url} -> ${err.message}`);
        });
        req.end();
    }
};
exports.SwitchesService = SwitchesService;
exports.SwitchesService = SwitchesService = SwitchesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(switch_entity_1.SwitchEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(area_entity_1.TableEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(area_entity_1.AreaEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], SwitchesService);
//# sourceMappingURL=switches.service.js.map