import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FacebookController } from './facebook.controller';
import { FacebookService } from './facebook.service';
import { FbCustomerEntity } from './entities/fb-customer.entity';
import { FbMessageEntity } from './entities/fb-message.entity';
import { FbPageEntity } from './entities/fb-page.entity';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FbCustomerEntity, FbMessageEntity, FbPageEntity]),
    AiModule, // inject AiService
  ],
  controllers: [FacebookController],
  providers: [FacebookService],
  exports: [FacebookService],
})
export class FacebookModule {}
