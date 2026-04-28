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
var MqttService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MqttService = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
let MqttService = MqttService_1 = class MqttService {
    client;
    logger = new common_1.Logger(MqttService_1.name);
    constructor(client) {
        this.client = client;
    }
    async onModuleInit() {
        try {
            await this.client.connect();
            this.logger.log('MQTT client connected');
        }
        catch (err) {
            this.logger.warn(`MQTT connection failed: ${err.message}. HTTP fallback active.`);
        }
    }
    publishSwitchCommand(deviceCode, channel, command) {
        const topic = `azpool/switches/${deviceCode}/command`;
        const payload = { channel, command, timestamp: Date.now() };
        this.client.emit(topic, payload);
        this.logger.log(`MQTT → ${topic}: ${JSON.stringify(payload)}`);
    }
    publishScoreboardData(deviceCode, data) {
        const topic = `azpool/scoreboard/${deviceCode}/data`;
        this.client.emit(topic, data);
    }
    publish(topic, payload) {
        this.client.emit(topic, payload);
    }
};
exports.MqttService = MqttService;
exports.MqttService = MqttService = MqttService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('MQTT_CLIENT')),
    __metadata("design:paramtypes", [microservices_1.ClientProxy])
], MqttService);
//# sourceMappingURL=mqtt.service.js.map