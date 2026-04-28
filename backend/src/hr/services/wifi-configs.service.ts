import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WiFiConfigEntity } from '../entities';
import { CreateWiFiConfigDto, UpdateWiFiConfigDto } from '../dto/hr.dto';

@Injectable()
export class WifiConfigsService {
  constructor(
    @InjectRepository(WiFiConfigEntity)
    private readonly wifiRepo: Repository<WiFiConfigEntity>,
  ) {}

  async create(dto: CreateWiFiConfigDto) {
    const config = this.wifiRepo.create(dto);
    return this.wifiRepo.save(config);
  }

  async findAll(isActive?: boolean) {
    const query = this.wifiRepo
      .createQueryBuilder('wifi')
      .orderBy('wifi.created_at', 'DESC');

    if (isActive !== undefined) {
      query.andWhere('wifi.is_active = :isActive', { isActive });
    }

    return query.getMany();
  }

  async findApproved() {
    const configs = await this.wifiRepo.find({ where: { is_active: true } });
    return configs.map((c) => ({
      id: c.id,
      ssid: c.ssid,
      description: c.description,
    }));
  }

  async findOne(id: number) {
    const config = await this.wifiRepo.findOne({ where: { id } });
    if (!config) throw new NotFoundException('WiFi configuration not found');
    return config;
  }

  async update(id: number, dto: UpdateWiFiConfigDto) {
    const config = await this.findOne(id);
    Object.assign(config, dto);
    return this.wifiRepo.save(config);
  }

  async remove(id: number) {
    const config = await this.findOne(id);
    await this.wifiRepo.remove(config);
    return null;
  }
}
