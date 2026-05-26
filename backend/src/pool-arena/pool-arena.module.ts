import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { PoolArenaService } from './services/pool-arena.service';
import { PoolArenaAuthService } from './services/pool-arena-auth.service';
import { PoolArenaController } from './controllers/pool-arena.controller';
import { PoolArenaAuthController } from './controllers/pool-arena-auth.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    AuthModule,
  ],
  controllers: [PoolArenaController, PoolArenaAuthController],
  providers: [PoolArenaService, PoolArenaAuthService],
  exports: [PoolArenaService, PoolArenaAuthService],
})
export class PoolArenaModule {}
