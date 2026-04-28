import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AreaEntity, TableEntity } from './entities/area.entity';
import { AreasService } from './services/areas.service';
import { AreasController } from './controllers/areas.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AreaEntity, TableEntity])],
  controllers: [AreasController],
  providers: [AreasService],
  exports: [TypeOrmModule, AreasService],
})
export class AreasModule {}
