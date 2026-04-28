import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryEntity } from '../entities';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto/inventory.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoriesRepo: Repository<CategoryEntity>,
  ) {}

  async create(dto: CreateCategoryDto) {
    const existing = await this.categoriesRepo.findOne({
      where: { name: dto.name },
    });
    if (existing)
      throw new BadRequestException(`Category '${dto.name}' already exists`);

    const category = this.categoriesRepo.create(dto);
    return this.categoriesRepo.save(category);
  }

  async findAll() {
    return this.categoriesRepo.find({ order: { name: 'ASC' } });
  }

  async findOne(id: number) {
    const category = await this.categoriesRepo.findOne({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async update(id: number, dto: UpdateCategoryDto) {
    const category = await this.findOne(id);
    if (dto.name && dto.name !== category.name) {
      const existing = await this.categoriesRepo.findOne({
        where: { name: dto.name },
      });
      if (existing)
        throw new BadRequestException(`Category '${dto.name}' already exists`);
    }
    Object.assign(category, dto);
    return this.categoriesRepo.save(category);
  }

  async remove(id: number) {
    const category = await this.findOne(id);
    await this.categoriesRepo.remove(category);
    return null;
  }
}
