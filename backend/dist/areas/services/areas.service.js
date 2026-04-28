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
var AreasService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AreasService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const area_entity_1 = require("../entities/area.entity");
let AreasService = AreasService_1 = class AreasService {
    areaRepo;
    tableRepo;
    logger = new common_1.Logger(AreasService_1.name);
    constructor(areaRepo, tableRepo) {
        this.areaRepo = areaRepo;
        this.tableRepo = tableRepo;
    }
    async findAll() {
        const areas = await this.areaRepo.find({
            relations: ['tables'],
        });
        return areas.map((a) => ({
            id: a.id,
            name: a.name,
            description: a.description,
            table_count: a.table_count,
            created_at: a.created_at,
            updated_at: a.updated_at,
            actual_table_count: a.tables ? a.tables.length : 0,
            tables: a.tables || [],
        }));
    }
    async findOne(id) {
        const area = await this.areaRepo.findOne({
            where: { id },
            relations: ['tables'],
        });
        if (!area)
            throw new common_1.NotFoundException('Area not found');
        const currentTablesCount = area.tables ? area.tables.length : 0;
        if (area.table_count > currentTablesCount) {
            const tablesToAdd = area.table_count - currentTablesCount;
            for (let i = 1; i <= tablesToAdd; i++) {
                const nextNum = currentTablesCount + i;
                const cols = 5;
                const row = Math.floor((nextNum - 1) / cols);
                const col = (nextNum - 1) % cols;
                const x = col * 120 + 20;
                const y = row * 80 + 20;
                await this.tableRepo.save(this.tableRepo.create({
                    name: `Bàn ${nextNum}`,
                    area_id: area.id,
                    x,
                    y,
                }));
            }
            return this.areaRepo.findOne({ where: { id }, relations: ['tables'] });
        }
        return area;
    }
    async create(dto) {
        const existing = await this.areaRepo.findOne({ where: { name: dto.name } });
        if (existing) {
            throw new common_1.BadRequestException('The area with this name already exists in the system.');
        }
        const area = await this.areaRepo.save(this.areaRepo.create({
            name: dto.name,
            description: dto.description,
            table_count: dto.table_count,
        }));
        if (area.table_count > 0) {
            for (let i = 1; i <= area.table_count; i++) {
                const cols = 5;
                const row = Math.floor((i - 1) / cols);
                const col = (i - 1) % cols;
                const x = col * 120 + 20;
                const y = row * 80 + 20;
                await this.tableRepo.save(this.tableRepo.create({
                    name: `Bàn ${i}`,
                    area_id: area.id,
                    x,
                    y,
                }));
            }
        }
        return this.areaRepo.findOne({
            where: { id: area.id },
            relations: ['tables'],
        });
    }
    async update(id, dto) {
        const area = await this.areaRepo.findOne({ where: { id } });
        if (!area)
            throw new common_1.NotFoundException('Area not found');
        if (dto.name && dto.name !== area.name) {
            const existing = await this.areaRepo.findOne({
                where: { name: dto.name },
            });
            if (existing) {
                throw new common_1.BadRequestException('The area with this name already exists.');
            }
        }
        if (dto.name !== undefined)
            area.name = dto.name;
        if (dto.description !== undefined)
            area.description = dto.description;
        if (dto.table_count !== undefined)
            area.table_count = dto.table_count;
        await this.areaRepo.save(area);
        const currentTablesCount = await this.tableRepo.count({
            where: { area_id: id },
        });
        if (area.table_count > currentTablesCount) {
            const tablesToAdd = area.table_count - currentTablesCount;
            for (let i = 1; i <= tablesToAdd; i++) {
                const nextNum = currentTablesCount + i;
                const cols = 5;
                const row = Math.floor((nextNum - 1) / cols);
                const col = (nextNum - 1) % cols;
                const x = col * 120 + 20;
                const y = row * 80 + 20;
                await this.tableRepo.save(this.tableRepo.create({
                    name: `Bàn ${nextNum}`,
                    area_id: area.id,
                    x,
                    y,
                }));
            }
        }
        return this.areaRepo.findOne({ where: { id }, relations: ['tables'] });
    }
    async remove(id) {
        const area = await this.areaRepo.findOne({ where: { id } });
        if (!area)
            throw new common_1.NotFoundException('Area not found');
        await this.areaRepo.remove(area);
        return { status: 'success' };
    }
    async updateTablePositions(areaId, positions) {
        const area = await this.areaRepo.findOne({ where: { id: areaId } });
        if (!area)
            throw new common_1.NotFoundException('Area not found');
        for (const item of positions) {
            await this.tableRepo.update({ id: item.id, area_id: areaId }, { x: item.x, y: item.y });
        }
        return this.areaRepo.findOne({
            where: { id: areaId },
            relations: ['tables'],
        });
    }
    async updateTable(areaId, tableId, dto) {
        const table = await this.tableRepo.findOne({
            where: { id: tableId, area_id: areaId },
        });
        if (!table)
            throw new common_1.NotFoundException('Table not found');
        const updateData = { ...dto };
        if ('camera_main_stream' in updateData && !updateData.camera_main_stream)
            updateData.camera_main_stream = null;
        if ('camera_sub_stream' in updateData && !updateData.camera_sub_stream)
            updateData.camera_sub_stream = null;
        if ('device_code' in updateData &&
            updateData.device_code !== table.device_code) {
            this.logger.log(`[DeviceCode] Code changed for table ${table.id}: ${table.device_code} -> ${updateData.device_code}`);
            this.logger.log(`[DeviceCode] Clearing device info (was: device_id=${table.device_id})`);
            updateData.device_type = null;
            updateData.device_os = null;
            updateData.device_id = null;
            updateData.device_app_version = null;
            updateData.device_ip = null;
            updateData.device_activated_at = null;
        }
        Object.assign(table, updateData);
        await this.tableRepo.save(table);
        return table;
    }
    async deleteTable(areaId, tableId) {
        const table = await this.tableRepo.findOne({
            where: { id: tableId, area_id: areaId },
        });
        if (!table)
            throw new common_1.NotFoundException('Table not found');
        await this.tableRepo.remove(table);
        const area = await this.areaRepo.findOne({ where: { id: areaId } });
        if (area && area.table_count > 0) {
            area.table_count -= 1;
            await this.areaRepo.save(area);
        }
        return { status: 'success' };
    }
    async verifyDevice(dto) {
        if (!dto.device_code || dto.device_code.length !== 6) {
            throw new common_1.BadRequestException('Invalid device code format. Code must be 6 characters.');
        }
        const table = await this.tableRepo.findOne({
            where: { device_code: dto.device_code.toUpperCase() },
            relations: ['area'],
        });
        if (!table) {
            return {
                success: false,
                message: 'Device code not found. Please check your code and try again.',
            };
        }
        if (dto.device_type)
            table.device_type = dto.device_type.substring(0, 50);
        if (dto.device_os)
            table.device_os = dto.device_os.substring(0, 100);
        if (dto.device_id)
            table.device_id = dto.device_id.substring(0, 100);
        if (dto.device_app_version)
            table.device_app_version = dto.device_app_version.substring(0, 20);
        if (dto.device_ip)
            table.device_ip = dto.device_ip.substring(0, 50);
        table.device_activated_at = new Date();
        await this.tableRepo.save(table);
        return {
            success: true,
            table_id: table.id,
            table_name: table.name,
            area_id: table.area ? table.area.id : null,
            area_name: table.area ? table.area.name : null,
            message: 'Device activated successfully',
            camera_main_stream: table.camera_main_stream,
            camera_sub_stream: table.camera_sub_stream,
        };
    }
    async checkDeviceStatus(dto) {
        const code = (dto.device_code || '').trim().toUpperCase();
        const deviceId = (dto.device_id || '').trim();
        this.logger.log(`[DeviceStatus] Checking status for code=${code}, device_id=${deviceId.substring(0, 8)}...`);
        if (!code || !deviceId) {
            return { connected: false, message: 'Invalid request parameters' };
        }
        const table = await this.tableRepo.findOne({
            where: { device_code: code },
            relations: ['area'],
        });
        if (!table) {
            this.logger.log(`[DeviceStatus] Code '${code}' not found -> disconnected`);
            return { connected: false, message: 'Device code no longer exists' };
        }
        if (table.device_id !== deviceId) {
            this.logger.log(`[DeviceStatus] device_id mismatch -> disconnected`);
            return {
                connected: false,
                message: 'Device not connected to this table',
            };
        }
        if ((dto.device_ip && table.device_ip !== dto.device_ip) ||
            (dto.device_mac && table.device_mac !== dto.device_mac) ||
            (dto.device_app_version && table.device_app_version !== dto.device_app_version)) {
            if (dto.device_ip)
                table.device_ip = dto.device_ip.substring(0, 50);
            if (dto.device_mac)
                table.device_mac = dto.device_mac.substring(0, 50);
            if (dto.device_app_version)
                table.device_app_version = dto.device_app_version.substring(0, 20);
            await this.tableRepo.save(table);
        }
        this.logger.log(`[DeviceStatus] Device connected to table '${table.name}'`);
        return {
            connected: true,
            table_id: table.id,
            table_name: table.name,
            area_id: table.area ? table.area.id : null,
            area_name: table.area ? table.area.name : null,
            message: 'Device is connected',
            camera_main_stream: table.camera_main_stream,
            camera_sub_stream: table.camera_sub_stream,
        };
    }
};
exports.AreasService = AreasService;
exports.AreasService = AreasService = AreasService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(area_entity_1.AreaEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(area_entity_1.TableEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], AreasService);
//# sourceMappingURL=areas.service.js.map