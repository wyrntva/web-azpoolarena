import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { UserEntity } from '../users/entities/user.entity';
import { DeviceEntity } from '../devices/entities/device.entity';
import { ALL_PERMISSIONS } from './constants/permissions';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(DeviceEntity)
    private readonly deviceRepo: Repository<DeviceEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ==================== Password ====================
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async verifyPassword(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }

  // ==================== Tokens ====================
  createAccessToken(userId: number): string {
    const payload: JwtPayload = { sub: String(userId), type: 'access' };
    return this.jwtService.sign(payload, {
      expiresIn: `${this.configService.get('ACCESS_TOKEN_EXPIRE_MINUTES', 30)}m`,
    });
  }

  createRefreshToken(userId: number): string {
    const payload: JwtPayload = { sub: String(userId), type: 'refresh' };
    return this.jwtService.sign(payload, {
      expiresIn: `${this.configService.get('REFRESH_TOKEN_EXPIRE_DAYS', 7)}d`,
    });
  }

  decodeToken(token: string): JwtPayload | null {
    try {
      return this.jwtService.verify<JwtPayload>(token);
    } catch {
      return null;
    }
  }

  // ==================== Login ====================
  async login(username: string, password: string) {
    const user = await this.userRepo.findOne({
      where: { username },
      relations: ['role'],
    });

    if (!user || !(await this.verifyPassword(password, user.hashed_password))) {
      throw new UnauthorizedException('Incorrect username or password');
    }

    if (!user.is_active) {
      throw new ForbiddenException('Inactive user');
    }

    return {
      access_token: this.createAccessToken(user.id),
      refresh_token: this.createRefreshToken(user.id),
      token_type: 'bearer',
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role_name: user.role?.name || null,
      },
    };
  }

  // ==================== POS Login ====================
  async posLogin(pin: string, deviceCode: string) {
    // Validate device
    if (!deviceCode) {
      throw new UnauthorizedException('Device authentication required');
    }

    const device = await this.deviceRepo.findOne({
      where: { device_code: deviceCode.toUpperCase() },
    });

    if (!device) {
      throw new ForbiddenException('Device code không hợp lệ');
    }
    if (!device.is_activated) {
      throw new ForbiddenException('Device chưa được kích hoạt');
    }

    // Find user by PIN
    const user = await this.userRepo.findOne({
      where: { pin, is_active: true },
      relations: ['role'],
    });

    if (!user) {
      throw new UnauthorizedException(
        'Mã PIN không đúng hoặc tài khoản không tồn tại',
      );
    }

    return {
      access_token: this.createAccessToken(user.id),
      refresh_token: this.createRefreshToken(user.id),
      token_type: 'bearer',
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role_name: user.role?.name || null,
      },
    };
  }

  // ==================== Refresh ====================
  async refresh(refreshToken: string) {
    const payload = this.decodeToken(refreshToken);

    if (!payload || payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const userId = parseInt(payload.sub, 10);
    if (isNaN(userId)) {
      throw new UnauthorizedException('Invalid user ID in refresh token');
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || !user.is_active) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return {
      access_token: this.createAccessToken(user.id),
      token_type: 'bearer',
    };
  }

  // ==================== Me ====================
  parseUserPermissions(user: UserEntity) {
    const now = new Date();
    const userData: any = {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      pin: user.pin,
      is_active: user.is_active,
      is_admin: user.is_admin,
      role_id: user.role_id,
      salary_type: user.salary_type,
      hourly_rate: user.hourly_rate,
      fixed_salary: user.fixed_salary,
      created_at: (user.created_at || now).toISOString(),
      updated_at: (user.updated_at || now).toISOString(),
    };

    if (user.role) {
      const roleData: any = {
        id: user.role.id,
        name: user.role.name,
        description: user.role.description,
        is_active: user.role.is_active,
        is_system: user.role.is_system,
        requires_timekeeping: user.role.requires_timekeeping,
        created_at: (user.role.created_at || now).toISOString(),
        updated_at: (user.role.updated_at || now).toISOString(),
      };

      if (user.is_admin) {
        roleData.permissions = ALL_PERMISSIONS;
      } else {
        try {
          const perms = user.role.permissions
            ? JSON.parse(user.role.permissions)
            : [];
          roleData.permissions = Array.isArray(perms) ? perms : [];
        } catch {
          roleData.permissions = [];
        }
      }

      userData.role = roleData;
    }

    return userData;
  }

  getUserPermissions(user: UserEntity): string[] {
    if (user.is_admin) return ALL_PERMISSIONS;
    if (!user.role?.permissions) return [];
    try {
      const perms = JSON.parse(user.role.permissions);
      return Array.isArray(perms) ? perms : [];
    } catch {
      return [];
    }
  }
}
