import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { AreasModule } from './areas/areas.module';
import { DevicesModule } from './devices/devices.module';
import { SwitchesModule } from './switches/switches.module';
import { PosModule } from './pos/pos.module';
import { PoolArenaModule } from './pool-arena/pool-arena.module';
import { TournamentsModule } from './tournaments/tournaments.module';
import { StoreSettingsModule } from './store-settings/store-settings.module';
import { FinanceModule } from './finance/finance.module';
import { InventoryModule } from './inventory/inventory.module';
import { HrModule } from './hr/hr.module';
import { RankingsModule } from './rankings/rankings.module';
import { UploadsModule } from './uploads/uploads.module';
import { MqttClientModule } from './mqtt/mqtt.module';
import { AiModule } from './ai/ai.module';
import { FacebookModule } from './facebook/facebook.module';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { MiddlewareConsumer, NestModule } from '@nestjs/common';

@Module({
  imports: [
    // Environment config (replaces pydantic-settings)
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      // Khi chạy trong Docker, biến môi trường đã được set bởi docker-compose
      // → bỏ qua file .env để tránh xung đột
      ignoreEnvFile: process.env.DOCKER === 'true',
    }),

    // TypeORM (replaces SQLAlchemy)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: false,
        logging: config.get<string>('ENV') !== 'production',
        migrations: [join(__dirname, 'migrations', '*.js')],
        migrationsRun: false,
        migrationsTableName: 'typeorm_migrations',
        extra: {
          max: 20,
          connectionTimeoutMillis: 30000,
          idleTimeoutMillis: 1800000,
        },
      }),
    }),

    // Rate limiting (replaces SlowAPI)
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60000, limit: 60 }],
    }),

    // Cron scheduler (replaces threading + time.sleep)
    ScheduleModule.forRoot(),

    // Static file serving
    ServeStaticModule.forRoot(
      // Upload files (avatars, images, documents)
      {
        rootPath: join(__dirname, '..', 'uploads'),
        serveRoot: '/uploads',
        serveStaticOptions: { index: false },
      },
      // Frontend CMS SPA — serves index.html as fallback for all non-api routes
      {
        rootPath: join(__dirname, '..', 'public'),
        exclude: ['/api/(.*)', '/uploads/(.*)', '/facebook/(.*)'],
        serveStaticOptions: {
          index: false,
          setHeaders: (res: any, filePath: string) => {
            if (filePath.endsWith('.html')) {
              // index.html: không cache để SPA luôn lấy bản mới nhất
              res.setHeader(
                'Cache-Control',
                'no-cache, no-store, must-revalidate',
              );
            } else if (
              /\.(js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|ico|webp)$/i.test(
                filePath,
              )
            ) {
              // Vite build dùng content hash trong tên file → cache 1 năm
              res.setHeader(
                'Cache-Control',
                'public, max-age=31536000, immutable',
              );
            }
          },
        },
      },
    ),

    // Feature modules
    AuthModule,
    UsersModule,
    RolesModule,
    AreasModule,
    DevicesModule,
    SwitchesModule,
    PosModule,
    PoolArenaModule,
    TournamentsModule,
    StoreSettingsModule,
    FinanceModule,
    InventoryModule,
    HrModule,
    RankingsModule,
    UploadsModule,
    MqttClientModule,
    AiModule,
    FacebookModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
