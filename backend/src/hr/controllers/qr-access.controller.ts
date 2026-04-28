import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QrAccessService } from '../services/qr-access.service';
import { InternalApiGuard } from '../guards/internal-api.guard';

@Controller()
export class QrAccessController {
  constructor(
    private readonly qrAccessService: QrAccessService,
    private readonly configService: ConfigService,
  ) {}

  // =======================
  // INTERNAL API ENDPOINTS
  // =======================

  @Post('api/internal/qr-access/create')
  @UseGuards(InternalApiGuard)
  async createToken(
    @Body() body: { device_id: string; purpose: string; ttl_seconds?: number },
  ) {
    const token = await this.qrAccessService.createToken(
      body.device_id,
      body.purpose,
      body.ttl_seconds,
    );
    const baseUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const qrUrl = `${baseUrl}/attendance/check-in?token=${token.access_token}&type=attendance`;

    return {
      success: true,
      access_token: token.access_token,
      expires_at: token.expires_at,
      qr_url: qrUrl,
      ttl_seconds: body.ttl_seconds || 60,
      message: 'Token created successfully',
    };
  }

  @Get('api/internal/qr-access/device/:device_id/stats')
  @UseGuards(InternalApiGuard)
  async getDeviceStats(@Param('device_id') deviceId: string) {
    return this.qrAccessService.getDeviceStats(deviceId);
  }

  @Get('api/internal/qr-access/token-status/:access_token')
  @UseGuards(InternalApiGuard)
  async getTokenStatus(@Param('access_token') accessToken: string) {
    return this.qrAccessService.getTokenStatus(accessToken);
  }

  // =======================
  // PUBLIC API ENDPOINTS
  // =======================

  @Post('api/qr-access/validate')
  async validateToken(
    @Body() body: { access_token: string; user_pin?: string },
  ) {
    const result = await this.qrAccessService.validateToken(body.access_token);

    if (!result.valid) {
      return {
        valid: false,
        message: result.message,
        error_code: result.code,
      };
    }

    return {
      valid: true,
      message: 'Token hợp lệ. Có thể truy cập trang chấm công',
      redirect_url: '/attendance/check-in',
      expires_in_seconds: result.expires_in_seconds,
    };
  }

  @Post('api/qr-access/consume')
  async consumeToken(@Body() body: { access_token: string; user_pin: string }) {
    await this.qrAccessService.consumeToken(body.access_token, body.user_pin);
    return {
      success: true,
      message: 'Token đã được đánh dấu đã sử dụng',
    };
  }
}
