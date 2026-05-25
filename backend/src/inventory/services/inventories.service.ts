import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryEntity, InventoryStatus } from '../entities';
import { CreateInventoryDto, UpdateInventoryDto } from '../dto/inventory.dto';

@Injectable()
export class InventoriesService {
  constructor(
    @InjectRepository(InventoryEntity)
    private readonly invRepo: Repository<InventoryEntity>,
  ) {}

  private updateStatus(inv: InventoryEntity) {
    if (inv.quantity <= 0) {
      inv.status = InventoryStatus.OUT_OF_STOCK;
    } else if (inv.quantity <= inv.min_quantity) {
      inv.status = InventoryStatus.LOW_STOCK;
    } else {
      inv.status = InventoryStatus.IN_STOCK;
    }
  }

  async create(dto: CreateInventoryDto, userId: number) {
    const existing = await this.invRepo.findOne({
      where: { product_name: dto.product_name },
    });
    if (existing)
      throw new BadRequestException(
        `Sản phẩm '${dto.product_name}' đã tồn tại`,
      );

    const inv = this.invRepo.create({ ...dto, created_by: userId });
    this.updateStatus(inv);

    const saved = await this.invRepo.save(inv);
    return this.findOne(saved.id); // Re-fetch for relations
  }

  async findAll(
    skip: number = 0,
    limit: number = 100,
    statusFilter?: InventoryStatus,
    search?: string,
  ) {
    const qb = this.invRepo
      .createQueryBuilder('inv')
      .leftJoinAndSelect('inv.created_by_user', 'creator')
      .leftJoinAndSelect('inv.category', 'category')
      .leftJoinAndSelect('inv.base_unit_ref', 'base_unit')
      .leftJoinAndSelect('inv.conversion_unit_ref', 'conversion_unit')
      .orderBy('inv.product_name', 'ASC')
      .skip(skip)
      .take(limit);

    if (statusFilter) {
      qb.andWhere('inv.status = :statusFilter', { statusFilter });
    }
    if (search) {
      qb.andWhere('inv.product_name ILIKE :search', { search: `%${search}%` });
    }

    const [data, total] = await qb.getManyAndCount();

    return {
      data: data.map((inv) => ({
        ...inv,
        base_unit: inv.base_unit_ref,
        large_unit: inv.conversion_unit_ref,
      })),
      meta: { total, skip, limit },
    };
  }

  async findOne(id: number) {
    const inv = await this.invRepo.findOne({
      where: { id },
      relations: [
        'created_by_user',
        'category',
        'base_unit_ref',
        'conversion_unit_ref',
      ],
    });
    if (!inv) throw new NotFoundException('Không tìm thấy sản phẩm');
    return {
      ...inv,
      base_unit: inv.base_unit_ref,
      large_unit: inv.conversion_unit_ref,
    };
  }

  async update(id: number, dto: UpdateInventoryDto) {
    const inv = await this.invRepo.findOne({ where: { id } });
    if (!inv) throw new NotFoundException('Không tìm thấy sản phẩm');

    if (dto.product_name && dto.product_name !== inv.product_name) {
      const existing = await this.invRepo.findOne({
        where: { product_name: dto.product_name },
      });
      if (existing && existing.id !== id)
        throw new BadRequestException(
          `Sản phẩm '${dto.product_name}' đã tồn tại`,
        );
    }

    Object.assign(inv, dto);
    this.updateStatus(inv);

    await this.invRepo.save(inv);
    return this.findOne(id);
  }

  async remove(id: number) {
    const inv = await this.invRepo.findOne({ where: { id } });
    if (!inv) throw new NotFoundException('Không tìm thấy sản phẩm');
    await this.invRepo.remove(inv);
    return null;
  }
}
