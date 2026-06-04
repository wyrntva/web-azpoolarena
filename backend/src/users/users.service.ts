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
import { SalaryType } from '../common/enums';

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
    
    if (existing) {
      if (!existing.is_active) {
        // Reactivate soft-deleted user
        existing.is_active = true;
        existing.full_name = dto.full_name;
        if (dto.email !== undefined) {
          existing.email = dto.email.trim() !== '' ? dto.email : null;
        }
        if (dto.password) {
          existing.hashed_password = await this.authService.hashPassword(dto.password);
        }
        if (dto.role_id) existing.role_id = dto.role_id;
        if (dto.pin) existing.pin = dto.pin;
        if (dto.salary_type) existing.salary_type = dto.salary_type;
        if (dto.hourly_rate !== undefined) existing.hourly_rate = dto.hourly_rate;
        if (dto.fixed_salary !== undefined) existing.fixed_salary = dto.fixed_salary;
        
        const saved = await this.userRepo.save(existing);
        const full = await this.userRepo.findOne({
          where: { id: saved.id },
          relations: ['role'],
        });
        return this.parseUserPermissions(full!);
      }
      throw new BadRequestException('Số điện thoại (tài khoản) đã tồn tại');
    }

    if (dto.email && dto.email.trim() !== '') {
      const existingEmail = await this.userRepo.findOne({
        where: { email: dto.email },
      });
      if (existingEmail) throw new BadRequestException('Email already exists');
    }

    const role = await this.roleRepo.findOne({ where: { id: dto.role_id } });
    if (!role) throw new NotFoundException('Role not found');

    const user = this.userRepo.create({
      user_type: 'staff',
      username: dto.username,
      email: dto.email && dto.email.trim() !== '' ? dto.email : null,
      full_name: dto.full_name,
      hashed_password: await this.authService.hashPassword(dto.password),
      role_id: dto.role_id,
      pin: dto.pin,
      is_active: dto.is_active !== undefined ? dto.is_active : true,
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
      where: [{ user_type: 'staff' }, { user_type: 'both' }],
      relations: ['role'],
      order: { display_order: { direction: 'ASC', nulls: 'LAST' }, id: 'ASC' },
      skip,
      take: limit,
    });

    const userIds = users.map((u) => u.id);
    let firstScheduleMap: Record<number, string> = {};
    if (userIds.length > 0) {
      const rows: { user_id: number; min_date: string }[] =
        await this.userRepo.manager.query(
          `SELECT user_id, MIN(work_date)::text AS min_date
           FROM work_schedules
           WHERE user_id = ANY($1)
           GROUP BY user_id`,
          [userIds],
        );
      for (const r of rows) {
        firstScheduleMap[r.user_id] = r.min_date;
      }
    }

    return users.map((u) => ({
      ...this.parseUserPermissions(u),
      first_schedule_date: firstScheduleMap[u.id] ?? null,
    }));
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

    if (dto.email && dto.email.trim() !== '') {
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

    if (dto.email !== undefined && dto.email.trim() === '') {
      dto.email = null;
    }
    
    Object.assign(user, dto);
    const saved = await this.userRepo.save(user);
    const full = await this.userRepo.findOne({
      where: { id: saved.id },
      relations: ['role'],
    });
    return this.parseUserPermissions(full!);
  }

  async updateMyPassword(userId: number, oldPassword?: string, newPassword?: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (!oldPassword) throw new BadRequestException('Vui lòng nhập mật khẩu cũ');
    
    const isPasswordValid = await this.authService.verifyPassword(oldPassword, user.hashed_password);
    if (!isPasswordValid) throw new BadRequestException('Mật khẩu cũ không chính xác');

    if (!newPassword || newPassword.length < 6) throw new BadRequestException('Mật khẩu mới phải có ít nhất 6 ký tự');

    user.hashed_password = await this.authService.hashPassword(newPassword);
    await this.userRepo.save(user);

    return { success: true, message: 'Đổi mật khẩu thành công' };
  }

  async remove(id: number, currentUserId: number) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (user.id === currentUserId)
      throw new BadRequestException('Cannot delete your own account');

    try {
      await this.userRepo.remove(user);
    } catch (error) {
      // If hard delete fails due to foreign key constraints (like attendances or work schedules),
      // fallback to soft delete (deactivate) to preserve historical data
      user.is_active = false;
      await this.userRepo.save(user);
    }
  }

  async promoteFromCustomer(dto: {
    pool_arena_user_id: number;
    role_id: number;
    pin: string;
    salary_type: 'hourly' | 'fixed';
    hourly_rate?: number;
    fixed_salary?: number;
    is_active?: boolean;
  }) {
    const user = await this.userRepo.findOne({ where: { id: dto.pool_arena_user_id } });
    if (!user) throw new NotFoundException('Khách hàng không tồn tại');
    if (!['player', 'both'].includes(user.user_type))
      throw new BadRequestException('Người dùng không phải khách hàng');
    if (user.user_type === 'both' || user.username)
      throw new BadRequestException('Người dùng này đã là nhân viên');

    if (!user.phone_number?.startsWith('+84'))
      throw new BadRequestException('Khách hàng không có số điện thoại hợp lệ');

    const username = '0' + user.phone_number.slice(3);
    const existing = await this.userRepo.findOne({ where: { username } });
    if (existing && existing.id !== user.id)
      throw new BadRequestException('Số điện thoại này đã được đăng ký làm nhân viên');

    const role = await this.roleRepo.findOne({ where: { id: dto.role_id } });
    if (!role) throw new NotFoundException('Vai trò không tồn tại');

    user.user_type = 'both';
    user.username = username;
    user.role_id = dto.role_id;
    user.pin = dto.pin;
    user.salary_type = dto.salary_type as SalaryType;
    user.hourly_rate = dto.salary_type === 'hourly' ? (dto.hourly_rate ?? 20000) : (null as any);
    user.fixed_salary = dto.salary_type === 'fixed' ? (dto.fixed_salary ?? 0) : (null as any);
    user.is_active = dto.is_active !== undefined ? dto.is_active : true;

    const saved = await this.userRepo.save(user);
    const full = await this.userRepo.findOne({
      where: { id: saved.id },
      relations: ['role'],
    });
    return this.parseUserPermissions(full!);
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
