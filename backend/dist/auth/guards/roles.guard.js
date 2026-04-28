"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountantOrAdminGuard = exports.PermissionsGuard = exports.RolesGuard = exports.AdminGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
let AdminGuard = class AdminGuard {
    canActivate(context) {
        const user = context.switchToHttp().getRequest().user;
        if (!user?.is_admin) {
            throw new common_1.ForbiddenException('Admin access required');
        }
        return true;
    }
};
exports.AdminGuard = AdminGuard;
exports.AdminGuard = AdminGuard = __decorate([
    (0, common_1.Injectable)()
], AdminGuard);
let RolesGuard = class RolesGuard {
    reflector;
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        const requiredRoles = this.reflector.get('roles', context.getHandler());
        if (!requiredRoles)
            return true;
        const user = context.switchToHttp().getRequest().user;
        if (user.is_admin)
            return true;
        if (!user.role || !requiredRoles.includes(user.role.name)) {
            throw new common_1.ForbiddenException(`Required roles: ${requiredRoles.join(', ')}`);
        }
        return true;
    }
};
exports.RolesGuard = RolesGuard;
exports.RolesGuard = RolesGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], RolesGuard);
let PermissionsGuard = class PermissionsGuard {
    reflector;
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        const requiredPerm = this.reflector.get('permission', context.getHandler());
        if (!requiredPerm)
            return true;
        const user = context.switchToHttp().getRequest().user;
        if (user.is_admin)
            return true;
        let userPerms = [];
        try {
            userPerms = user.role?.permissions
                ? JSON.parse(user.role.permissions)
                : [];
        }
        catch {
            userPerms = [];
        }
        if (!userPerms.includes(requiredPerm)) {
            throw new common_1.ForbiddenException(`Permission denied: ${requiredPerm}`);
        }
        return true;
    }
};
exports.PermissionsGuard = PermissionsGuard;
exports.PermissionsGuard = PermissionsGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], PermissionsGuard);
let AccountantOrAdminGuard = class AccountantOrAdminGuard {
    canActivate(context) {
        const user = context.switchToHttp().getRequest().user;
        if (user.is_admin)
            return true;
        if (!user.role)
            throw new common_1.ForbiddenException('User has no role');
        if (['Thu ngân', 'accountant'].includes(user.role.name) ||
            user.role_id === 5)
            return true;
        throw new common_1.ForbiddenException('Accountant or Admin access required');
    }
};
exports.AccountantOrAdminGuard = AccountantOrAdminGuard;
exports.AccountantOrAdminGuard = AccountantOrAdminGuard = __decorate([
    (0, common_1.Injectable)()
], AccountantOrAdminGuard);
//# sourceMappingURL=roles.guard.js.map