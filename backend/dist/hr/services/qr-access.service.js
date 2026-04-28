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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QrAccessService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../entities");
const crypto = __importStar(require("crypto"));
const moment_1 = __importDefault(require("moment"));
let QrAccessService = class QrAccessService {
    tokenRepo;
    deviceRepo;
    constructor(tokenRepo, deviceRepo) {
        this.tokenRepo = tokenRepo;
        this.deviceRepo = deviceRepo;
    }
    async createToken(deviceId, purpose, ttlSeconds = 60) {
        const token = crypto.randomUUID();
        const expiresAt = (0, moment_1.default)().add(ttlSeconds, 'seconds').toDate();
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
    async validateToken(tokenOption) {
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
            const gracePeriod = (0, moment_1.default)(token.used_at).add(60, 'seconds').toDate();
            if (new Date() > gracePeriod) {
                return {
                    valid: false,
                    message: 'Mã QR đã được sử dụng',
                    code: 'TOKEN_ALREADY_USED',
                    token,
                };
            }
        }
        else if (token.expires_at < new Date()) {
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
            expires_in_seconds: (0, moment_1.default)(token.expires_at).diff((0, moment_1.default)(), 'seconds'),
        };
    }
    async consumeToken(tokenStr, userPin) {
        const token = await this.tokenRepo.findOne({
            where: { access_token: tokenStr },
        });
        if (!token)
            throw new common_1.BadRequestException('Token không tồn tại');
        if (token.is_used)
            throw new common_1.BadRequestException('Token đã được sử dụng');
        token.is_used = true;
        token.used_at = new Date();
        token.used_by_pin = userPin;
        await this.tokenRepo.save(token);
        return { success: true, message: 'Token đã được sử dụng' };
    }
    async getDeviceStats(deviceId) {
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
    async getTokenStatus(accessToken) {
        const token = await this.tokenRepo.findOne({
            where: { access_token: accessToken },
        });
        if (!token)
            return { status: 'not_found' };
        if (token.is_used && token.used_by_pin) {
            return { status: 'completed', used_by_pin: token.used_by_pin };
        }
        else if (token.is_used) {
            return { status: 'scanned' };
        }
        else if (token.expires_at < new Date()) {
            return { status: 'expired' };
        }
        return { status: 'pending' };
    }
};
exports.QrAccessService = QrAccessService;
exports.QrAccessService = QrAccessService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.QRAccessTokenEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.QRAccessDeviceEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], QrAccessService);
//# sourceMappingURL=qr-access.service.js.map