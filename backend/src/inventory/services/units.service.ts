import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnitEntity } from '../entities';
import { CreateUnitDto, UpdateUnitDto } from '../dto/inventory.dto';

@Injectable()
export class UnitsService {
  constructor(
    @InjectRepository(UnitEntity)
    private readonly unitsRepo: Repository<UnitEntity>,
  ) {}

  async create(dto: CreateUnitDto) {
    const existing = await this.unitsRepo.findOne({
      where: { name: dto.name },
    });
    if (existing)
      throw new BadRequestException(`Unit '${dto.name}' already exists`);

    const unit = this.unitsRepo.create(dto);
    return this.unitsRepo.save(unit);
  }

  async findAll() {
    return this.unitsRepo.find({ order: { name: 'ASC' } });
  }

  async findOne(id: number) {
    const unit = await this.unitsRepo.findOne({ where: { id } });
    if (!unit) throw new NotFoundException('Unit not found');
    return unit;
  }

  async update(id: number, dto: UpdateUnitDto) {
    const unit = await this.findOne(id);
    if (dto.name && dto.name !== unit.name) {
      const existing = await this.unitsRepo.findOne({
        where: { name: dto.name },
      });
      if (existing)
        throw new BadRequestException(`Unit '${dto.name}' already exists`);
    }
    Object.assign(unit, dto);
    return this.unitsRepo.save(unit);
  }

  async remove(id: number) {
    const unit = await this.findOne(id);
    await this.unitsRepo.remove(unit);
    return null;
  }
}
