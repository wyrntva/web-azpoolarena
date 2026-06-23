import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { PoolArenaAuthService } from '../services/pool-arena-auth.service';

@Controller('api/pool-arena/auth')
export class PoolArenaAuthController {
  constructor(private readonly authService: PoolArenaAuthService) {}

  @Post('login')
  async login(@Body() body: { email_or_phone: string; password: string }) {
    if (!body.email_or_phone || !body.password) {
      throw new BadRequestException(
        'Email/số điện thoại và mật khẩu không được để trống',
      );
    }
    return this.authService.login(body.email_or_phone, body.password);
  }

  @Post('register')
  async register(@Body() body: any) {
    return this.authService.register(body);
  }

  @Get('me')
  async getMe(@Headers('authorization') auth: string) {
    return this.authService.getMe(auth);
  }

  @Post('change-password')
  async changePassword(
    @Headers('authorization') auth: string,
    @Body() body: { current_password: string; new_password: string },
  ) {
    return this.authService.changePassword(
      auth,
      body.current_password,
      body.new_password,
    );
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('send-new-password')
  async sendNewPassword(@Body() body: { email: string }) {
    return this.authService.sendNewPassword(body.email);
  }

  @Post('reset-with-temp-password')
  async resetWithTempPassword(
    @Body() body: { email: string; temp_password: string; new_password: string },
  ) {
    return this.authService.resetWithTempPassword(
      body.email,
      body.temp_password,
      body.new_password,
    );
  }

  @Post('verify-otp')
  async verifyOtp(@Body() body: { email: string; code: string }) {
    return this.authService.verifyOtp(body.email, body.code);
  }

  @Post('reset-password')
  async resetPassword(
    @Body() body: { email: string; token: string; password: string },
  ) {
    return this.authService.resetPassword(
      body.email,
      body.token,
      body.password,
    );
  }
}
