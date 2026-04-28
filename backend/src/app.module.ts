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
import { QrAccessModule } from './qr-access/qr-access.module';
import { WifiModule } from './wifi/wifi.module';
import { RankingsModule } from './rankings/rankings.module';
import { UploadsModule } from './uploads/uploads.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { MqttClientModule } from './mqtt/mqtt.module';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { MiddlewareConsumer, NestModule } from '@nestjs/common';

@Module({
  imports: [
    // Environment config (replaces pydantic-settings)
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // TypeORM (replaces SQLAlchemy)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: false, // Keep existing schema, use migrations
        logging: config.get<string>('ENV') !== 'production',
        extra: {
          max: 20, // pool_size + max_overflow
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

    // Static file serving (replaces FastAPI StaticFiles)
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
      serveStaticOptions: { index: false },
    }),

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
    QrAccessModule,
    WifiModule,
    RankingsModule,
    UploadsModule,
    DashboardModule,
    MqttClientModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
