import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PoolArenaUserEntity } from '../pool-arena/entities';
import { RankingsService } from './services/rankings.service';
import { RankingsController } from './controllers/rankings.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PoolArenaUserEntity])],
  controllers: [RankingsController],
  providers: [RankingsService],
  exports: [RankingsService],
})
export class RankingsModule {}
