"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const throttler_1 = require("@nestjs/throttler");
const schedule_1 = require("@nestjs/schedule");
const serve_static_1 = require("@nestjs/serve-static");
const path_1 = require("path");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const roles_module_1 = require("./roles/roles.module");
const areas_module_1 = require("./areas/areas.module");
const devices_module_1 = require("./devices/devices.module");
const switches_module_1 = require("./switches/switches.module");
const pos_module_1 = require("./pos/pos.module");
const pool_arena_module_1 = require("./pool-arena/pool-arena.module");
const tournaments_module_1 = require("./tournaments/tournaments.module");
const store_settings_module_1 = require("./store-settings/store-settings.module");
const finance_module_1 = require("./finance/finance.module");
const inventory_module_1 = require("./inventory/inventory.module");
const hr_module_1 = require("./hr/hr.module");
const qr_access_module_1 = require("./qr-access/qr-access.module");
const wifi_module_1 = require("./wifi/wifi.module");
const rankings_module_1 = require("./rankings/rankings.module");
const uploads_module_1 = require("./uploads/uploads.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const mqtt_module_1 = require("./mqtt/mqtt.module");
const request_id_middleware_1 = require("./common/middleware/request-id.middleware");
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(request_id_middleware_1.RequestIdMiddleware).forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    type: 'postgres',
                    url: config.get('DATABASE_URL'),
                    autoLoadEntities: true,
                    synchronize: false,
                    logging: config.get('ENV') !== 'production',
                    extra: {
                        max: 20,
                        connectionTimeoutMillis: 30000,
                        idleTimeoutMillis: 1800000,
                    },
                }),
            }),
            throttler_1.ThrottlerModule.forRoot({
                throttlers: [{ ttl: 60000, limit: 60 }],
            }),
            schedule_1.ScheduleModule.forRoot(),
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: (0, path_1.join)(__dirname, '..', 'uploads'),
                serveRoot: '/uploads',
                serveStaticOptions: { index: false },
            }),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            roles_module_1.RolesModule,
            areas_module_1.AreasModule,
            devices_module_1.DevicesModule,
            switches_module_1.SwitchesModule,
            pos_module_1.PosModule,
            pool_arena_module_1.PoolArenaModule,
            tournaments_module_1.TournamentsModule,
            store_settings_module_1.StoreSettingsModule,
            finance_module_1.FinanceModule,
            inventory_module_1.InventoryModule,
            hr_module_1.HrModule,
            qr_access_module_1.QrAccessModule,
            wifi_module_1.WifiModule,
            rankings_module_1.RankingsModule,
            uploads_module_1.UploadsModule,
            dashboard_module_1.DashboardModule,
            mqtt_module_1.MqttClientModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map