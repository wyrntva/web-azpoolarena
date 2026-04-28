"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MqttClientModule = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const config_1 = require("@nestjs/config");
const mqtt_service_1 = require("./mqtt.service");
const mqtt_controller_1 = require("./mqtt.controller");
let MqttClientModule = class MqttClientModule {
};
exports.MqttClientModule = MqttClientModule;
exports.MqttClientModule = MqttClientModule = __decorate([
    (0, common_1.Module)({
        imports: [
            microservices_1.ClientsModule.registerAsync([
                {
                    name: 'MQTT_CLIENT',
                    imports: [config_1.ConfigModule],
                    inject: [config_1.ConfigService],
                    useFactory: (config) => ({
                        transport: microservices_1.Transport.MQTT,
                        options: {
                            url: config.get('MQTT_URL', 'mqtt://localhost:1883'),
                            clientId: `azpool-publisher-${Date.now()}`,
                        },
                    }),
                },
            ]),
        ],
        controllers: [mqtt_controller_1.MqttController],
        providers: [mqtt_service_1.MqttService],
        exports: [mqtt_service_1.MqttService, microservices_1.ClientsModule],
    })
], MqttClientModule);
//# sourceMappingURL=mqtt.module.js.map