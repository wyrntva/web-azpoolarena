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
exports.SwitchesController = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const switches_service_1 = require("./switches.service");
let SwitchesController = class SwitchesController {
    switchesService;
    constructor(switchesService) {
        this.switchesService = switchesService;
    }
    findAll() {
        return this.switchesService.findAll();
    }
    create(dto) {
        return this.switchesService.create(dto);
    }
    update(id, dto) {
        return this.switchesService.update(id, dto);
    }
    remove(id) {
        return this.switchesService.remove(id);
    }
    getEspStatus(code, ip) {
        return this.switchesService.getEspStatus(code, ip);
    }
    async handleScoreboardReport(data) {
        if (data && data.table_name !== undefined && data.is_active !== undefined) {
            await this.switchesService.updateStatusByReport(data.table_name, data.is_active);
        }
    }
    async handleDeviceDiscovery(data) {
        await this.switchesService.handleDiscovery(data);
    }
};
exports.SwitchesController = SwitchesController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SwitchesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SwitchesController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], SwitchesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], SwitchesController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)('esp-status'),
    __param(0, (0, common_1.Query)('code')),
    __param(1, (0, common_1.Query)('ip')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SwitchesController.prototype, "getEspStatus", null);
__decorate([
    (0, microservices_1.MessagePattern)('azpool/master_esp/report'),
    __param(0, (0, microservices_1.Payload)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SwitchesController.prototype, "handleScoreboardReport", null);
__decorate([
    (0, microservices_1.MessagePattern)('azpool/master_esp/discovery'),
    __param(0, (0, microservices_1.Payload)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SwitchesController.prototype, "handleDeviceDiscovery", null);
exports.SwitchesController = SwitchesController = __decorate([
    (0, common_1.Controller)('api/switches'),
    __metadata("design:paramtypes", [switches_service_1.SwitchesService])
], SwitchesController);
//# sourceMappingURL=switches.controller.js.map