import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleEntity } from '../entities/role.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(RoleEntity)
    private repo: Repository<RoleEntity>,
  ) {}

  async findAll() {
    const roles = await this.repo.find();
    return roles.map(r => ({
      ...r,
      permissions: r.permissions ? JSON.parse(r.permissions) : []
    }));
  }

  async findOne(id: number) {
    const r = await this.repo.findOne({ where: { id } });
    if (!r) throw new NotFoundException('Role not found');
    return {
      ...r,
      permissions: r.permissions ? JSON.parse(r.permissions) : []
    };
  }

  async create(data: any) {
    const exists = await this.repo.findOne({ where: { name: data.name } });
    if (exists) throw new BadRequestException('Role name already exists');

    const role = this.repo.create({
      name: data.name,
      description: data.description || '',
      permissions: JSON.stringify(data.permissions || []),
      requires_timekeeping: data.requires_timekeeping ?? false,
      is_active: data.is_active ?? true,
    });
    const saved = await this.repo.save(role);
    return this.findOne(saved.id);
  }

  async update(id: number, data: any) {
    const role = await this.repo.findOne({ where: { id } });
    if (!role) throw new NotFoundException('Role not found');

    if (data.name && data.name !== role.name) {
      const exists = await this.repo.findOne({ where: { name: data.name } });
      if (exists) throw new BadRequestException('Role name already exists');
      role.name = data.name;
    }

    if (data.description !== undefined) role.description = data.description;
    if (data.permissions !== undefined) role.permissions = JSON.stringify(data.permissions);
    if (data.requires_timekeeping !== undefined) role.requires_timekeeping = data.requires_timekeeping;
    if (data.is_active !== undefined) role.is_active = data.is_active;

    await this.repo.save(role);
    return this.findOne(role.id);
  }

  async remove(id: number) {
    const role = await this.repo.findOne({ where: { id } });
    if (!role) throw new NotFoundException('Role not found');
    if (role.is_system) throw new BadRequestException('Cannot delete system role');
    await this.repo.remove(role);
  }
}
