import { Repository } from 'typeorm';
import { QRAccessTokenEntity, QRAccessDeviceEntity } from '../entities';
export declare class QrAccessService {
    private readonly tokenRepo;
    private readonly deviceRepo;
    constructor(tokenRepo: Repository<QRAccessTokenEntity>, deviceRepo: Repository<QRAccessDeviceEntity>);
    createToken(deviceId: string, purpose: string, ttlSeconds?: number): Promise<QRAccessTokenEntity>;
    validateToken(tokenOption: string): Promise<{
        valid: boolean;
        message: string;
        code: string;
        token?: undefined;
        expires_in_seconds?: undefined;
    } | {
        valid: boolean;
        message: string;
        code: string;
        token: QRAccessTokenEntity;
        expires_in_seconds?: undefined;
    } | {
        valid: boolean;
        message: string;
        expires_in_seconds: number;
        code?: undefined;
        token?: undefined;
    }>;
    consumeToken(tokenStr: string, userPin: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getDeviceStats(deviceId: string): Promise<{
        device_id: string;
        total_tokens_generated: number;
        total_tokens_used: number;
    }>;
    getTokenStatus(accessToken: string): Promise<{
        status: string;
        used_by_pin?: undefined;
    } | {
        status: string;
        used_by_pin: string;
    }>;
}
