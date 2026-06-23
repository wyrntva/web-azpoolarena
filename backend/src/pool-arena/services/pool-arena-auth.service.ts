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
import * as nodemailer from 'nodemailer';
import * as crypto from 'crypto';
import { UserEntity } from '../../users/entities/user.entity';
import { TournamentRankEntity } from '../../tournaments/entities';

const TOKEN_EXPIRY = '30d';

@Injectable()
export class PoolArenaAuthService {
  private resetCodes = new Map<string, { code: string; expires: number }>();

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(TournamentRankEntity)
    private readonly rankRepo: Repository<TournamentRankEntity>,
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
    if (payload.user_type !== 'pool_arena')
      throw new UnauthorizedException('Token không hợp lệ');
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

    if (!user) {
      throw new UnauthorizedException('Số điện thoại không đúng');
    }

    if (!(await bcrypt.compare(password, user.hashed_password))) {
      throw new UnauthorizedException('Mật khẩu không đúng');
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

    const userRank = data.rank || 'K';
    let defaultPoints = 0;
    const rankEntity = await this.rankRepo.findOne({
      where: { name: userRank },
    });
    if (rankEntity) {
      defaultPoints = rankEntity.default_score;
    }

    const user = this.userRepo.create({
      user_type: 'player',
      full_name: data.full_name,
      phone_number: normalizedPhone,
      email: data.email || undefined,
      hashed_password: await bcrypt.hash(data.password, 10),
      gender: data.gender || undefined,
      address: data.address || undefined,
      rank: userRank,
      points: defaultPoints,
    });

    const saved = await this.userRepo.save(user);
    return this.strip(saved);
  }

  async getMe(auth: string) {
    const userId = this.verifyToken(auth);
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || !user.is_active)
      throw new UnauthorizedException('Không tìm thấy người dùng');

    try {
      const {
        TournamentRegistrationEntity,
      } = require('../../tournaments/entities');
      const count = await this.userRepo.manager.count(
        TournamentRegistrationEntity,
        {
          where: { user_id: userId },
        },
      );
      (user as any).tournaments_count = count;
    } catch {
      (user as any).tournaments_count = 0;
    }

    return this.strip(user);
  }

  async changePassword(
    auth: string,
    currentPassword: string,
    newPassword: string,
  ) {
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

  async forgotPassword(email: string) {
    if (!email) {
      throw new BadRequestException('Email không được để trống');
    }

    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      throw new BadRequestException('Email không tồn tại trong hệ thống');
    }

    const code = String(crypto.randomInt(100000, 1000000));
    const expires = Date.now() + 10 * 60 * 1000;
    this.resetCodes.set(email, { code, expires });

    const mailHost =
      this.configService.get<string>('MAIL_HOST') || 'smtp.gmail.com';
    const mailPort = parseInt(
      this.configService.get<string>('MAIL_PORT') || '587',
      10,
    );
    const mailUser =
      this.configService.get<string>('MAIL_USER') || 'poolarena.vn@gmail.com';
    const mailPass =
      this.configService.get<string>('MAIL_PASS') || 'ywigsoudiofrlwmw';
    const mailFrom =
      this.configService.get<string>('MAIL_FROM') || 'poolarena.vn@gmail.com';

    const transporter = nodemailer.createTransport({
      host: mailHost,
      port: mailPort,
      secure: false,
      auth: {
        user: mailUser,
        pass: mailPass,
      },
    });

    const mailOptions = {
      from: `"Pool Arena" <${mailFrom}>`,
      to: email,
      subject: 'Mã xác thực khôi phục mật khẩu - Pool Arena',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #37393E; text-align: center;">Khôi phục mật khẩu Pool Arena</h2>
          <p>Chào bạn,</p>
          <p>Chúng tôi nhận được yêu cầu khôi phục mật khẩu cho tài khoản liên kết với email này. Dưới đây là mã xác thực của bạn:</p>
          <div style="font-size: 24px; font-weight: bold; text-align: center; margin: 30px 0; letter-spacing: 5px; color: #37393E;">
            ${code}
          </div>
          <p style="color: #d9534f; font-weight: bold;">Lưu ý: Mã xác thực này sẽ hết hạn trong vòng 10 phút.</p>
          <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
          <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #777777; text-align: center;">© 2026 Pool Arena. All rights reserved.</p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Lỗi gửi email:', error);
      throw new BadRequestException(
        'Không thể gửi email xác thực. Vui lòng thử lại sau.',
      );
    }

    return { message: 'Mã xác thực đã được gửi đến email của bạn' };
  }

  private generatePassword(): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars[crypto.randomInt(0, chars.length)];
    }
    return password;
  }

  async sendNewPassword(email: string) {
    if (!email) {
      throw new BadRequestException('Email không được để trống');
    }

    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      throw new BadRequestException('Email không tồn tại trong hệ thống');
    }

    const newPassword = this.generatePassword();

    const mailHost =
      this.configService.get<string>('MAIL_HOST') || 'smtp.gmail.com';
    const mailPort = parseInt(
      this.configService.get<string>('MAIL_PORT') || '587',
      10,
    );
    const mailUser =
      this.configService.get<string>('MAIL_USER') || 'poolarena.vn@gmail.com';
    const mailPass =
      this.configService.get<string>('MAIL_PASS') || 'ywigsoudiofrlwmw';
    const mailFrom =
      this.configService.get<string>('MAIL_FROM') || 'poolarena.vn@gmail.com';

    const transporter = nodemailer.createTransport({
      host: mailHost,
      port: mailPort,
      secure: false,
      auth: { user: mailUser, pass: mailPass },
    });

    const mailOptions = {
      from: `"Pool Arena" <${mailFrom}>`,
      to: email,
      subject: 'Mật khẩu mới của bạn - Pool Arena',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #37393E; text-align: center;">Khôi phục mật khẩu Pool Arena</h2>
          <p>Chào <strong>${user.full_name || 'bạn'}</strong>,</p>
          <p>Chúng tôi đã tạo mật khẩu mới cho tài khoản của bạn. Dưới đây là mật khẩu mới:</p>
          <div style="font-size: 28px; font-weight: bold; text-align: center; margin: 30px 0; letter-spacing: 6px; color: #37393E; background: #f5f5f5; padding: 16px; border-radius: 8px;">
            ${newPassword}
          </div>
          <p>Vui lòng đăng nhập bằng mật khẩu mới này và đổi lại mật khẩu trong phần cài đặt tài khoản.</p>
          <p style="color: #d9534f; font-weight: bold;">Lưu ý: Không chia sẻ mật khẩu này với bất kỳ ai.</p>
          <p>Nếu bạn không thực hiện yêu cầu này, vui lòng liên hệ với chúng tôi ngay.</p>
          <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #777777; text-align: center;">© 2026 Pool Arena. All rights reserved.</p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Lỗi gửi email:', error);
      throw new BadRequestException(
        'Không thể gửi email. Vui lòng thử lại sau.',
      );
    }

    user.hashed_password = await bcrypt.hash(newPassword, 10);
    await this.userRepo.save(user);

    return { message: 'Mật khẩu mới đã được gửi đến email của bạn' };
  }

  async resetWithTempPassword(
    email: string,
    tempPassword: string,
    newPassword: string,
  ) {
    if (!email || !tempPassword || !newPassword) {
      throw new BadRequestException('Thông tin không đầy đủ');
    }

    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      throw new BadRequestException('Email không tồn tại trong hệ thống');
    }

    const isMatch = await bcrypt.compare(tempPassword, user.hashed_password);
    if (!isMatch) {
      throw new BadRequestException('Mật khẩu tạm thời không chính xác');
    }

    user.hashed_password = await bcrypt.hash(newPassword, 10);
    await this.userRepo.save(user);

    return { message: 'Đổi mật khẩu thành công' };
  }

  async verifyOtp(email: string, code: string) {
    if (!email || !code) {
      throw new BadRequestException('Thông tin không đầy đủ');
    }

    const resetInfo = this.resetCodes.get(email);
    if (!resetInfo) {
      throw new BadRequestException('Mã OTP không hợp lệ hoặc đã hết hạn');
    }
    if (resetInfo.code !== code) {
      throw new BadRequestException('Mã OTP không chính xác');
    }
    if (Date.now() > resetInfo.expires) {
      this.resetCodes.delete(email);
      throw new BadRequestException('Mã OTP đã hết hạn');
    }

    return { message: 'OTP hợp lệ' };
  }

  async resetPassword(email: string, token: string, password: string) {
    if (!email || !token || !password) {
      throw new BadRequestException('Thông tin không đầy đủ');
    }

    const resetInfo = this.resetCodes.get(email);
    if (!resetInfo) {
      throw new BadRequestException('Mã xác thực không hợp lệ hoặc đã hết hạn');
    }

    if (resetInfo.code !== token) {
      throw new BadRequestException('Mã xác thực không chính xác');
    }

    if (Date.now() > resetInfo.expires) {
      this.resetCodes.delete(email);
      throw new BadRequestException('Mã xác thực đã hết hạn');
    }

    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      throw new BadRequestException('Email không tồn tại trong hệ thống');
    }

    user.hashed_password = await bcrypt.hash(password, 10);
    await this.userRepo.save(user);

    this.resetCodes.delete(email);

    return { message: 'Khôi phục mật khẩu thành công' };
  }
}
