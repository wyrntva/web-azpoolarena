import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QRAccessTokenEntity, QRAccessDeviceEntity } from '../entities';
import * as crypto from 'crypto';
import moment from 'moment';

@Injectable()
export class QrAccessService {
  constructor(
    @InjectRepository(QRAccessTokenEntity)
    private readonly tokenRepo: Repository<QRAccessTokenEntity>,
    @InjectRepository(QRAccessDeviceEntity)
    private readonly deviceRepo: Repository<QRAccessDeviceEntity>,
  ) {}

  async createToken(
    deviceId: string,
    purpose: string,
    ttlSeconds: number = 60,
  ) {
    const token = crypto.randomUUID();
    const expiresAt = moment().add(ttlSeconds, 'seconds').toDate();

    const result = this.tokenRepo.create({
      access_token: token,
      device_id: deviceId,
      purpose,
      expires_at: expiresAt,
      is_used: false,
    });

    await this.tokenRepo.save(result);
    return result;
  }

  async validateToken(tokenOption: string) {
    const token = await this.tokenRepo.findOne({
      where: { access_token: tokenOption },
    });

    if (!token)
      return {
        valid: false,
        message: 'Mã QR không tồn tại',
        code: 'TOKEN_NOT_FOUND',
      };

    if (token.is_used) {
      // Small grace period check
      const gracePeriod = moment(token.used_at).add(60, 'seconds').toDate();
      if (new Date() > gracePeriod) {
        return {
          valid: false,
          message: 'Mã QR đã được sử dụng',
          code: 'TOKEN_ALREADY_USED',
          token,
        };
      }
    } else if (token.expires_at < new Date()) {
      return {
        valid: false,
        message: 'Mã QR đã hết hạn',
        code: 'TOKEN_EXPIRED',
        token,
      };
    }

    return {
      valid: true,
      message: 'Token hợp lệ',
      expires_in_seconds: moment(token.expires_at).diff(moment(), 'seconds'),
    };
  }

  async consumeToken(tokenStr: string, userPin: string) {
    const token = await this.tokenRepo.findOne({
      where: { access_token: tokenStr },
    });
    if (!token) throw new BadRequestException('Token không tồn tại');
    if (token.is_used) throw new BadRequestException('Token đã được sử dụng');

    token.is_used = true;
    token.used_at = new Date();
    token.used_by_pin = userPin;

    await this.tokenRepo.save(token);
    return { success: true, message: 'Token đã được sử dụng' };
  }

  async getDeviceStats(deviceId: string) {
    const total = await this.tokenRepo.count({
      where: { device_id: deviceId },
    });
    const used = await this.tokenRepo.count({
      where: { device_id: deviceId, is_used: true },
    });
    return {
      device_id: deviceId,
      total_tokens_generated: total,
      total_tokens_used: used,
    };
  }

  async getTokenStatus(accessToken: string) {
    const token = await this.tokenRepo.findOne({
      where: { access_token: accessToken },
    });
    if (!token) return { status: 'not_found' };

    if (token.is_used && token.used_by_pin) {
      return { status: 'completed', used_by_pin: token.used_by_pin };
    } else if (token.is_used) {
      return { status: 'scanned' };
    } else if (token.expires_at < new Date()) {
      return { status: 'expired' };
    }
    return { status: 'pending' };
  }
}
