import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiConversationEntity } from './entities/ai-conversation.entity';
import { StoreSettingsEntity } from '../store-settings/entities';
import { AreaEntity } from '../areas/entities/area.entity';
import { TournamentEntity } from '../tournaments/entities/tournament.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AiConversationEntity,
      StoreSettingsEntity,
      AreaEntity,
      TournamentEntity,
    ]),
  ],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService], // export để các module khác có thể inject nếu cần
})
export class AiModule {}
