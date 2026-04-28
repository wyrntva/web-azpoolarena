"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PoolArenaModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const entities_1 = require("./entities");
const pool_arena_service_1 = require("./services/pool-arena.service");
const pool_arena_controller_1 = require("./controllers/pool-arena.controller");
let PoolArenaModule = class PoolArenaModule {
};
exports.PoolArenaModule = PoolArenaModule;
exports.PoolArenaModule = PoolArenaModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([entities_1.PoolArenaUserEntity])],
        controllers: [pool_arena_controller_1.PoolArenaController],
        providers: [pool_arena_service_1.PoolArenaService],
        exports: [pool_arena_service_1.PoolArenaService],
    })
], PoolArenaModule);
//# sourceMappingURL=pool-arena.module.js.map