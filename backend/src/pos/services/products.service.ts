import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductEntity } from '../entities';
import { CreateProductDto, UpdateProductDto } from '../dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,
  ) {}

  private mapToResponse(p: ProductEntity) {
    return {
      id: p.id,
      name: p.name,
      categoryId: p.category_id,
      type: p.type,
      code: p.code,
      sellPrice: p.sell_price,
      price: p.sell_price, // frontend mapping
      costPrice: p.cost_price,
      unit: p.unit,
      color: p.color,
      image: p.image,
      description: p.description,
      channels: p.channels,
      inventoryLinked: p.inventory_linked,
      inventoryId: p.inventory_id,
      showOnScoreboard: p.show_on_scoreboard,
      hourlyPrice: p.hourly_price,
      timeIntervalValue: p.time_interval_value,
      timeIntervalUnit: p.time_interval_unit,
      firstHourEnabled: p.first_hour_enabled,
      specialHourEnabled: p.special_hour_enabled,
      createdAt: p.created_at?.toISOString(),
    };
  }

  async findAll() {
    const products = await this.productRepo.find({ order: { id: 'ASC' } });
    return products.map((p) => this.mapToResponse(p));
  }

  async findOne(id: number) {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    return this.mapToResponse(product);
  }

  async create(dto: CreateProductDto) {
    const p = this.productRepo.create({
      name: dto.name,
      category_id: dto.categoryId,
      type: dto.type,
      code: dto.code,
      sell_price: dto.sellPrice,
      cost_price: dto.costPrice,
      unit: dto.unit,
      color: dto.color,
      image: dto.image,
      description: dto.description,
      channels: dto.channels,
      inventory_linked: dto.inventoryLinked,
      inventory_id: dto.inventoryId,
      show_on_scoreboard: dto.showOnScoreboard,
      hourly_price: dto.hourlyPrice,
      time_interval_value: dto.timeIntervalValue,
      time_interval_unit: dto.timeIntervalUnit,
      first_hour_enabled: dto.firstHourEnabled,
      special_hour_enabled: dto.specialHourEnabled,
    });
    await this.productRepo.save(p);
    return this.mapToResponse(p);
  }

  async update(id: number, dto: UpdateProductDto) {
    const p = await this.productRepo.findOne({ where: { id } });
    if (!p) throw new NotFoundException('Product not found');

    if (dto.categoryId !== undefined) p.category_id = dto.categoryId;
    if (dto.sellPrice !== undefined) p.sell_price = dto.sellPrice;
    if (dto.costPrice !== undefined) p.cost_price = dto.costPrice;
    if (dto.inventoryLinked !== undefined)
      p.inventory_linked = dto.inventoryLinked;
    if (dto.inventoryId !== undefined) p.inventory_id = dto.inventoryId;
    if (dto.showOnScoreboard !== undefined)
      p.show_on_scoreboard = dto.showOnScoreboard;
    if (dto.hourlyPrice !== undefined) p.hourly_price = dto.hourlyPrice;
    if (dto.timeIntervalValue !== undefined)
      p.time_interval_value = dto.timeIntervalValue;
    if (dto.timeIntervalUnit !== undefined)
      p.time_interval_unit = dto.timeIntervalUnit;
    if (dto.firstHourEnabled !== undefined)
      p.first_hour_enabled = dto.firstHourEnabled;
    if (dto.specialHourEnabled !== undefined)
      p.special_hour_enabled = dto.specialHourEnabled;

    if (dto.name !== undefined) p.name = dto.name;
    if (dto.type !== undefined) p.type = dto.type;
    if (dto.code !== undefined) p.code = dto.code;
    if (dto.unit !== undefined) p.unit = dto.unit;
    if (dto.color !== undefined) p.color = dto.color;
    if (dto.image !== undefined) p.image = dto.image;
    if (dto.description !== undefined) p.description = dto.description;
    if (dto.channels !== undefined) p.channels = dto.channels;

    await this.productRepo.save(p);
    return this.mapToResponse(p);
  }

  async remove(id: number) {
    const p = await this.productRepo.findOne({ where: { id } });
    if (!p) throw new NotFoundException('Product not found');
    await this.productRepo.remove(p);
    return null;
  }
}
