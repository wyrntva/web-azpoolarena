import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { UserEntity } from '../../users/entities/user.entity';

const TOKEN_EXPIRY = '30d';

@Injectable()
export class PoolArenaAuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private get secret(): string {
    return this.configService.get<string>('SECRET_KEY')!;
  }

  private sign(userId: number): string {
    return this.jwtService.sign(
      { sub: String(userId), type: 'access', user_type: 'pool_arena' },
      { secret: this.secret, expiresIn: TOKEN_EXPIRY },
    );
  }

  private strip(user: UserEntity) {
    const {
      hashed_password,
      pin,
      salary_type,
      hourly_rate,
      fixed_salary,
      display_order,
      role_id,
      role,
      ...safe
    } = user as any;
    return safe;
  }

  private verifyToken(auth: string): number {
    if (!auth?.startsWith('Bearer ')) throw new UnauthorizedException();
    const token = auth.slice(7);
    let payload: any;
    try {
      payload = this.jwtService.verify(token, { secret: this.secret });
    } catch {
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
    }
    if (payload.user_type !== 'pool_arena') throw new UnauthorizedException('Token không hợp lệ');
    return parseInt(payload.sub, 10);
  }

  private normalizePhone(value: string): string {
    const trimmed = value.trim();
    if (/^0[0-9]{9,10}$/.test(trimmed)) {
      return '+84' + trimmed.slice(1);
    }
    return trimmed;
  }

  async login(emailOrPhone: string, password: string) {
    const normalized = this.normalizePhone(emailOrPhone);
    const user = await this.userRepo
      .createQueryBuilder('u')
      .where('u.phone_number = :val OR u.email = :val', { val: normalized })
      .getOne();

    if (!user || !(await bcrypt.compare(password, user.hashed_password))) {
      throw new UnauthorizedException('Số điện thoại/email hoặc mật khẩu không đúng');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Tài khoản đã bị khóa');
    }

    return { access_token: this.sign(user.id), users: this.strip(user) };
  }

  async register(data: {
    full_name: string;
    phone_number: string;
    email?: string;
    password: string;
    gender?: string;
    address?: string;
    rank?: string;
  }) {
    const normalizedPhone = this.normalizePhone(data.phone_number);
    const conditions: any[] = [{ phone_number: normalizedPhone }];
    if (data.email) conditions.push({ email: data.email });

    const existing = await this.userRepo.findOne({ where: conditions });
    if (existing) {
      throw new BadRequestException('Số điện thoại hoặc email đã được đăng ký');
    }

    const user = this.userRepo.create({
      user_type: 'player',
      full_name: data.full_name,
      phone_number: normalizedPhone,
      email: data.email || undefined,
      hashed_password: await bcrypt.hash(data.password, 10),
      gender: data.gender || undefined,
      address: data.address || undefined,
      rank: data.rank || 'K',
    });

    const saved = await this.userRepo.save(user);
    return this.strip(saved);
  }

  async getMe(auth: string) {
    const userId = this.verifyToken(auth);
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || !user.is_active) throw new UnauthorizedException('Không tìm thấy người dùng');
    return this.strip(user);
  }

  async changePassword(auth: string, currentPassword: string, newPassword: string) {
    const userId = this.verifyToken(auth);
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    if (!(await bcrypt.compare(currentPassword, user.hashed_password))) {
      throw new UnauthorizedException('Mật khẩu hiện tại không đúng');
    }

    user.hashed_password = await bcrypt.hash(newPassword, 10);
    await this.userRepo.save(user);
    return { message: 'Đổi mật khẩu thành công' };
  }
}
