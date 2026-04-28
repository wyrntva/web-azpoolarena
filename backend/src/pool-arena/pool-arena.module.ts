import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PoolArenaUserEntity } from './entities';
import { PoolArenaService } from './services/pool-arena.service';
import { PoolArenaController } from './controllers/pool-arena.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PoolArenaUserEntity])],
  controllers: [PoolArenaController],
  providers: [PoolArenaService],
  exports: [PoolArenaService],
})
export class PoolArenaModule {}
