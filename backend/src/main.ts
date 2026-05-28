import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const compression = require('compression');
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const configService = app.get(ConfigService);

  // Global validation pipe (replaces Pydantic)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Compression (replaces GZipMiddleware)
  app.use(compression({ threshold: 500 }));

  // Security headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // CORS (replaces FastAPI CORSMiddleware)
  const corsOrigins = configService
    .get<string>('CORS_ORIGINS', 'http://localhost:5173,http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const env = configService.get<string>('ENV', 'development');
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
      if (!corsOrigins.includes(origin)) corsOrigins.push(origin);
    }
  }

  if (env !== 'production') {
    app.enableCors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['*'],
    });
  } else {
    app.enableCors({
      origin: corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['*'],
    });
  }

  // MQTT Microservice
  const mqttUrl = configService.get<string>(
    'MQTT_URL',
    'mqtt://localhost:1883',
  );
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.MQTT,
    options: {
      url: mqttUrl,
      clientId: `azpool-backend-${Date.now()}`,
    },
  });

  await app.startAllMicroservices();

  const port = configService.get<number>('PORT', 8000);
  await app.listen(port);
  console.log(`🚀 AZ POOLARENA API running on http://localhost:${port}`);
  console.log(`📡 MQTT connected to ${mqttUrl}`);
}
bootstrap();
