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
var SwitchSchedulerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwitchSchedulerService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const switch_entity_1 = require("../entities/switch.entity");
const http = __importStar(require("http"));
let SwitchSchedulerService = SwitchSchedulerService_1 = class SwitchSchedulerService {
    switchRepo;
    logger = new common_1.Logger(SwitchSchedulerService_1.name);
    triggeredToday = new Map();
    constructor(switchRepo) {
        this.switchRepo = switchRepo;
    }
    async checkSchedules() {
        try {
            const switches = await this.switchRepo.find({
                where: [
                    { schedule_on: (0, typeorm_2.Not)((0, typeorm_2.IsNull)()) },
                    { schedule_off: (0, typeorm_2.Not)((0, typeorm_2.IsNull)()) },
                ],
            });
            const now = new Date();
            const today = now.toISOString().slice(0, 10);
            const currentMinutes = now.getHours() * 60 + now.getMinutes();
            for (const sw of switches) {
                const keyOn = `${sw.id}-on`;
                const keyOff = `${sw.id}-off`;
                if (this.triggeredToday.get(keyOn) !== today)
                    this.triggeredToday.delete(keyOn);
                if (this.triggeredToday.get(keyOff) !== today)
                    this.triggeredToday.delete(keyOff);
                let shouldTriggerOn = false;
                let shouldTriggerOff = false;
                if (sw.schedule_on) {
                    const [onH, onM] = sw.schedule_on.split(':').map(Number);
                    shouldTriggerOn = currentMinutes >= (onH * 60 + onM);
                }
                if (sw.schedule_off) {
                    const [offH, offM] = sw.schedule_off.split(':').map(Number);
                    shouldTriggerOff = currentMinutes >= (offH * 60 + offM);
                }
                if (sw.schedule_on && sw.schedule_off) {
                    const [onH, onM] = sw.schedule_on.split(':').map(Number);
                    const [offH, offM] = sw.schedule_off.split(':').map(Number);
                    const onMinutes = onH * 60 + onM;
                    const offMinutes = offH * 60 + offM;
                    if (onMinutes < offMinutes) {
                        shouldTriggerOn = currentMinutes >= onMinutes && currentMinutes < offMinutes;
                        shouldTriggerOff = currentMinutes >= offMinutes;
                    }
                    else {
                        shouldTriggerOn = currentMinutes >= onMinutes || currentMinutes < offMinutes;
                        shouldTriggerOff = currentMinutes >= offMinutes && currentMinutes < onMinutes;
                    }
                }
                if (shouldTriggerOn &&
                    !this.triggeredToday.has(keyOn) &&
                    !sw.is_active) {
                    sw.is_active = true;
                    await this.switchRepo.save(sw);
                    this.triggeredToday.set(keyOn, today);
                    this.logger.log(`[SCHEDULE] Bật ${sw.name} (${now.toTimeString().slice(0, 5)})`);
                    this.sendEspCommand(sw, 'on');
                }
                if (shouldTriggerOff &&
                    !this.triggeredToday.has(keyOff) &&
                    sw.is_active) {
                    sw.is_active = false;
                    await this.switchRepo.save(sw);
                    this.triggeredToday.set(keyOff, today);
                    this.logger.log(`[SCHEDULE] Tắt ${sw.name} (${now.toTimeString().slice(0, 5)})`);
                    this.sendEspCommand(sw, 'off');
                }
            }
        }
        catch (err) {
            this.logger.error(`[SCHEDULE] Error: ${err.message}`);
        }
    }
    sendEspCommand(sw, command) {
        if (!sw.ip_address)
            return;
        const path = sw.port ? `/${sw.port}/${command}` : `/${command}`;
        const url = `http://${sw.ip_address}${path}`;
        const req = http.get(url, { timeout: 5000 }, (res) => {
            let body = '';
            res.on('data', (chunk) => (body += chunk));
            res.on('end', () => {
                this.logger.log(`ESP [${sw.name}] ${url} -> ${res.statusCode}: ${body}`);
            });
        });
        req.on('error', (err) => {
            this.logger.warn(`ESP [${sw.name}] no response: ${url} -> ${err.message}`);
        });
        req.end();
    }
};
exports.SwitchSchedulerService = SwitchSchedulerService;
__decorate([
    (0, schedule_1.Cron)('*/5 * * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SwitchSchedulerService.prototype, "checkSchedules", null);
exports.SwitchSchedulerService = SwitchSchedulerService = SwitchSchedulerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(switch_entity_1.SwitchEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], SwitchSchedulerService);
//# sourceMappingURL=switch-scheduler.service.js.map