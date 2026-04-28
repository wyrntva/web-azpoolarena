"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const microservices_1 = require("@nestjs/microservices");
const compression = require('compression');
const helmet_1 = __importDefault(require("helmet"));
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    app.use(compression({ threshold: 500 }));
    app.use((0, helmet_1.default)({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
    }));
    const corsOrigins = configService
        .get('CORS_ORIGINS', 'http://localhost:5173,http://localhost:3000')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean);
    const env = configService.get('ENV', 'development');
    if (env !== 'production') {
        const fallback = [
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'http://192.168.1.188:5173',
            'http://localhost:3001',
            'http://127.0.0.1:3001',
            'http://localhost:5174',
            'http://127.0.0.1:5174',
            'http://localhost:5175',
            'http://127.0.0.1:5175',
        ];
        for (const origin of fallback) {
            if (!corsOrigins.includes(origin))
                corsOrigins.push(origin);
        }
    }
    app.enableCors({
        origin: corsOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['*'],
    });
    const mqttUrl = configService.get('MQTT_URL', 'mqtt://localhost:1883');
    app.connectMicroservice({
        transport: microservices_1.Transport.MQTT,
        options: {
            url: mqttUrl,
            clientId: `azpool-backend-${Date.now()}`,
        },
    });
    await app.startAllMicroservices();
    const port = configService.get('PORT', 8000);
    await app.listen(port);
    console.log(`🚀 AZ POOLARENA API running on http://localhost:${port}`);
    console.log(`📡 MQTT connected to ${mqttUrl}`);
}
bootstrap();
//# sourceMappingURL=main.js.map