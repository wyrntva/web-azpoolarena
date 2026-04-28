import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuEntity } from '../entities';
import { CreateMenuDto, UpdateMenuDto, ReorderMenuDto } from '../dto/menu.dto';

@Injectable()
export class MenusService {
  constructor(
    @InjectRepository(MenuEntity)
    private readonly menuRepo: Repository<MenuEntity>,
  ) {}

  private mapToResponse(m: MenuEntity) {
    return {
      id: m.id,
      name: m.name,
      icon: m.icon,
      image: m.image,
      productIds: m.product_ids || [],
      sort_order: m.sort_order,
      createdAt: m.created_at?.toISOString(),
    };
  }

  async findAll() {
    const menus = await this.menuRepo.find({ order: { sort_order: 'ASC' } });
    return menus.map((m) => this.mapToResponse(m));
  }

  async findOne(id: number) {
    const m = await this.menuRepo.findOne({ where: { id } });
    if (!m) throw new NotFoundException('Menu not found');
    return this.mapToResponse(m);
  }

  async create(dto: CreateMenuDto) {
    const count = await this.menuRepo.count();
    const m = this.menuRepo.create({
      name: dto.name,
      icon: dto.icon,
      image: dto.image,
      product_ids: dto.productIds,
      sort_order: count,
    });
    await this.menuRepo.save(m);
    return this.mapToResponse(m);
  }

  async update(id: number, dto: UpdateMenuDto) {
    const m = await this.menuRepo.findOne({ where: { id } });
    if (!m) throw new NotFoundException('Menu not found');

    if (dto.name !== undefined) m.name = dto.name;
    if (dto.icon !== undefined) m.icon = dto.icon;
    if (dto.image !== undefined) m.image = dto.image;
    if (dto.productIds !== undefined) m.product_ids = dto.productIds;

    await this.menuRepo.save(m);
    return this.mapToResponse(m);
  }

  async remove(id: number) {
    const m = await this.menuRepo.findOne({ where: { id } });
    if (!m) throw new NotFoundException('Menu not found');
    await this.menuRepo.remove(m);
    return null;
  }

  async reorder(items: ReorderMenuDto[]) {
    // Basic bulk update
    for (const item of items) {
      await this.menuRepo.update(item.id, { sort_order: item.sort_order });
    }
    return this.findAll();
  }
}
