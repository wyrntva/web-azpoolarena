import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { NewsController } from './news.controller';
import { NewsService } from './news.service';
import { NewsEntity } from './news.entity';
import { FacebookService } from './facebook.service';

@Module({
  imports: [TypeOrmModule.forFeature([NewsEntity]), ConfigModule],
  controllers: [NewsController],
  providers: [NewsService, FacebookService],
})
export class NewsModule {}
