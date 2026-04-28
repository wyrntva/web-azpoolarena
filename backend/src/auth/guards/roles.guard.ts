import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserEntity } from '../../users/entities/user.entity';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user: UserEntity = context.switchToHttp().getRequest().user;
    if (!user?.is_admin) {
      throw new ForbiddenException('Admin access required');
    }
    return true;
  }
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );
    if (!requiredRoles) return true;

    const user: UserEntity = context.switchToHttp().getRequest().user;
    if (user.is_admin) return true;

    if (!user.role || !requiredRoles.includes(user.role.name)) {
      throw new ForbiddenException(
        `Required roles: ${requiredRoles.join(', ')}`,
      );
    }
    return true;
  }
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPerm = this.reflector.get<string>(
      'permission',
      context.getHandler(),
    );
    if (!requiredPerm) return true;

    const user: UserEntity = context.switchToHttp().getRequest().user;
    if (user.is_admin) return true;

    let userPerms: string[] = [];
    try {
      userPerms = user.role?.permissions
        ? JSON.parse(user.role.permissions)
        : [];
    } catch {
      userPerms = [];
    }

    if (!userPerms.includes(requiredPerm)) {
      throw new ForbiddenException(`Permission denied: ${requiredPerm}`);
    }
    return true;
  }
}

@Injectable()
export class AccountantOrAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user: UserEntity = context.switchToHttp().getRequest().user;
    if (user.is_admin) return true;
    if (!user.role) throw new ForbiddenException('User has no role');
    if (
      ['Thu ngân', 'accountant'].includes(user.role.name) ||
      user.role_id === 5
    )
      return true;
    throw new ForbiddenException('Accountant or Admin access required');
  }
}
