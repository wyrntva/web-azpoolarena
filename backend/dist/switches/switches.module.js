"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwitchesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const switch_entity_1 = require("./entities/switch.entity");
const switches_controller_1 = require("./switches.controller");
const switches_service_1 = require("./switches.service");
const switch_scheduler_service_1 = require("./scheduler/switch-scheduler.service");
const area_entity_1 = require("../areas/entities/area.entity");
let SwitchesModule = class SwitchesModule {
};
exports.SwitchesModule = SwitchesModule;
exports.SwitchesModule = SwitchesModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([switch_entity_1.SwitchEntity, area_entity_1.AreaEntity, area_entity_1.TableEntity])],
        controllers: [switches_controller_1.SwitchesController],
        providers: [switches_service_1.SwitchesService, switch_scheduler_service_1.SwitchSchedulerService],
        exports: [switches_service_1.SwitchesService],
    })
], SwitchesModule);
//# sourceMappingURL=switches.module.js.map