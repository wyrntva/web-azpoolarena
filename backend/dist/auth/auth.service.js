"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = __importStar(require("bcryptjs"));
const user_entity_1 = require("../users/entities/user.entity");
const device_entity_1 = require("../devices/entities/device.entity");
const permissions_1 = require("./constants/permissions");
let AuthService = class AuthService {
    userRepo;
    deviceRepo;
    jwtService;
    configService;
    constructor(userRepo, deviceRepo, jwtService, configService) {
        this.userRepo = userRepo;
        this.deviceRepo = deviceRepo;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async hashPassword(password) {
        return bcrypt.hash(password, 10);
    }
    async verifyPassword(plain, hashed) {
        return bcrypt.compare(plain, hashed);
    }
    createAccessToken(userId) {
        const payload = { sub: String(userId), type: 'access' };
        return this.jwtService.sign(payload, {
            expiresIn: `${this.configService.get('ACCESS_TOKEN_EXPIRE_MINUTES', 30)}m`,
        });
    }
    createRefreshToken(userId) {
        const payload = { sub: String(userId), type: 'refresh' };
        return this.jwtService.sign(payload, {
            expiresIn: `${this.configService.get('REFRESH_TOKEN_EXPIRE_DAYS', 7)}d`,
        });
    }
    decodeToken(token) {
        try {
            return this.jwtService.verify(token);
        }
        catch {
            return null;
        }
    }
    async login(username, password) {
        const user = await this.userRepo.findOne({
            where: { username },
            relations: ['role'],
        });
        if (!user || !(await this.verifyPassword(password, user.hashed_password))) {
            throw new common_1.UnauthorizedException('Incorrect username or password');
        }
        if (!user.is_active) {
            throw new common_1.ForbiddenException('Inactive user');
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
    async posLogin(pin, deviceCode) {
        if (!deviceCode) {
            throw new common_1.UnauthorizedException('Device authentication required');
        }
        const device = await this.deviceRepo.findOne({
            where: { device_code: deviceCode.toUpperCase() },
        });
        if (!device) {
            throw new common_1.ForbiddenException('Device code không hợp lệ');
        }
        if (!device.is_activated) {
            throw new common_1.ForbiddenException('Device chưa được kích hoạt');
        }
        const user = await this.userRepo.findOne({
            where: { pin, is_active: true },
            relations: ['role'],
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Mã PIN không đúng hoặc tài khoản không tồn tại');
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
    async refresh(refreshToken) {
        const payload = this.decodeToken(refreshToken);
        if (!payload || payload.type !== 'refresh') {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        const userId = parseInt(payload.sub, 10);
        if (isNaN(userId)) {
            throw new common_1.UnauthorizedException('Invalid user ID in refresh token');
        }
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user || !user.is_active) {
            throw new common_1.UnauthorizedException('User not found or inactive');
        }
        return {
            access_token: this.createAccessToken(user.id),
            token_type: 'bearer',
        };
    }
    parseUserPermissions(user) {
        const now = new Date();
        const userData = {
            id: user.id,
            username: user.username,
            email: user.email,
            full_name: user.full_name,
            pin: user.pin,
            is_active: user.is_active,
            is_admin: user.is_admin,
            role_id: user.role_id,
            salary_type: user.salary_type,
            fixed_salary: user.fixed_salary,
            created_at: (user.created_at || now).toISOString(),
            updated_at: (user.updated_at || now).toISOString(),
        };
        if (user.role) {
            const roleData = {
                id: user.role.id,
                name: user.role.name,
                description: user.role.description,
                is_active: user.role.is_active,
                is_system: user.role.is_system,
                created_at: (user.role.created_at || now).toISOString(),
                updated_at: (user.role.updated_at || now).toISOString(),
            };
            if (user.is_admin) {
                roleData.permissions = permissions_1.ALL_PERMISSIONS;
            }
            else {
                try {
                    const perms = user.role.permissions
                        ? JSON.parse(user.role.permissions)
                        : [];
                    roleData.permissions = Array.isArray(perms) ? perms : [];
                }
                catch {
                    roleData.permissions = [];
                }
            }
            userData.role = roleData;
        }
        return userData;
    }
    getUserPermissions(user) {
        if (user.is_admin)
            return permissions_1.ALL_PERMISSIONS;
        if (!user.role?.permissions)
            return [];
        try {
            const perms = JSON.parse(user.role.permissions);
            return Array.isArray(perms) ? perms : [];
        }
        catch {
            return [];
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.UserEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(device_entity_1.DeviceEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map