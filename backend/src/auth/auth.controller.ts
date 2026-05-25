import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto, PosLoginDto, RefreshDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/auth.decorators';
import { UserEntity } from '../users/entities/user.entity';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.username, dto.password);
  }

  @Post('pos-login')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async posLogin(
    @Body() dto: PosLoginDto,
    @Headers('x-device-code') deviceCode: string,
  ) {
    return this.authService.posLogin(dto.pin, deviceCode);
  }

  @Post('refresh')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refresh_token);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() user: UserEntity) {
    return this.authService.parseUserPermissions(user);
  }

  @Get('permissions')
  @UseGuards(JwtAuthGuard)
  getPermissions(@CurrentUser() user: UserEntity) {
    return this.authService.getUserPermissions(user);
  }

  @Post('logout')
  logout() {
    // Stateless JWT — nothing to invalidate server-side; guard removed so
    // logout works even when the access token is already expired.
    return { message: 'Successfully logged out' };
  }
}
