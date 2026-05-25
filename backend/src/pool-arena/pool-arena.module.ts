import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PoolArenaUserEntity } from './entities';
import { PoolArenaService } from './services/pool-arena.service';
import { PoolArenaAuthService } from './services/pool-arena-auth.service';
import { PoolArenaController } from './controllers/pool-arena.controller';
import { PoolArenaAuthController } from './controllers/pool-arena-auth.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PoolArenaUserEntity]),
    AuthModule,
  ],
  controllers: [PoolArenaController, PoolArenaAuthController],
  providers: [PoolArenaService, PoolArenaAuthService],
  exports: [PoolArenaService, PoolArenaAuthService],
})
export class PoolArenaModule {}
