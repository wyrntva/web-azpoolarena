import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { RoleEntity } from '../roles/entities/role.entity';
import { AuthService } from '../auth/auth.service';
import { ALL_PERMISSIONS } from '../auth/constants/permissions';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleRepo: Repository<RoleEntity>,
    private readonly authService: AuthService,
  ) {}

  parseUserPermissions(user: UserEntity) {
    return this.authService.parseUserPermissions(user);
  }

  async create(dto: any) {
    const existing = await this.userRepo.findOne({
      where: { username: dto.username },
    });
    if (existing) throw new BadRequestException('Username already exists');

    if (dto.email) {
      const existingEmail = await this.userRepo.findOne({
        where: { email: dto.email },
      });
      if (existingEmail) throw new BadRequestException('Email already exists');
    }

    const role = await this.roleRepo.findOne({ where: { id: dto.role_id } });
    if (!role) throw new NotFoundException('Role not found');

    const user = this.userRepo.create({
      username: dto.username,
      email: dto.email,
      full_name: dto.full_name,
      hashed_password: await this.authService.hashPassword(dto.password),
      role_id: dto.role_id,
      pin: dto.pin,
      salary_type: dto.salary_type,
      hourly_rate: dto.hourly_rate,
      fixed_salary: dto.fixed_salary,
    });

    const saved = await this.userRepo.save(user);
    const full = await this.userRepo.findOne({
      where: { id: saved.id },
      relations: ['role'],
    });
    return this.parseUserPermissions(full!);
  }

  async findAll(skip = 0, limit = 100) {
    const users = await this.userRepo.find({
      relations: ['role'],
      order: { display_order: { direction: 'ASC', nulls: 'LAST' }, id: 'ASC' },
      skip,
      take: limit,
    });
    return users.map((u) => this.parseUserPermissions(u));
  }

  async findOne(id: number) {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['role'],
    });
    if (!user) throw new NotFoundException('User not found');
    return this.parseUserPermissions(user);
  }

  async update(id: number, dto: any) {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['role'],
    });
    if (!user) throw new NotFoundException('User not found');

    if (dto.email) {
      const existing = await this.userRepo.findOne({
        where: { email: dto.email },
      });
      if (existing && existing.id !== id)
        throw new BadRequestException('Email already exists');
    }

    if (dto.password) {
      dto.hashed_password = await this.authService.hashPassword(dto.password);
      delete dto.password;
    }

    if (dto.role_id) {
      const role = await this.roleRepo.findOne({ where: { id: dto.role_id } });
      if (!role) throw new NotFoundException('Role not found');
    }

    Object.assign(user, dto);
    const saved = await this.userRepo.save(user);
    const full = await this.userRepo.findOne({
      where: { id: saved.id },
      relations: ['role'],
    });
    return this.parseUserPermissions(full!);
  }

  async remove(id: number, currentUserId: number) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (user.id === currentUserId)
      throw new BadRequestException('Cannot delete your own account');

    await this.userRepo.remove(user);
  }

  async updateDisplayOrder(
    orders: { user_id: number; display_order: number }[],
  ) {
    for (const item of orders) {
      await this.userRepo.update(item.user_id, {
        display_order: item.display_order,
      });
    }
    return { status: 'success', message: 'Display order updated successfully' };
  }
}
