import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { RankingsService } from './services/rankings.service';
import { RankingsController } from './controllers/rankings.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  controllers: [RankingsController],
  providers: [RankingsService],
  exports: [RankingsService],
})
export class RankingsModule {}
