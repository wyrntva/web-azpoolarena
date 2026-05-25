import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class InternalApiGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const internalKey = this.configService.get<string>('INTERNAL_API_KEY');

    if (!internalKey) {
      throw new InternalServerErrorException(
        'Internal API key not configured on server',
      );
    }

    const requestKey = request.headers['x-internal-api-key'];

    if (!requestKey) {
      throw new UnauthorizedException('Missing X-Internal-API-Key header');
    }

    if (requestKey !== internalKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }
}
