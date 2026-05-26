import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { TournamentEntity } from '../tournaments/entities';
import { StoreSettingsEntity } from '../store-settings/entities';
import { UploadsService } from './services/uploads.service';
import { UploadsController } from './controllers/uploads.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      TournamentEntity,
      StoreSettingsEntity,
    ]),
  ],
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}
