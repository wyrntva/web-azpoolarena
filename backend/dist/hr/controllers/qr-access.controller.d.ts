import { ConfigService } from '@nestjs/config';
import { QrAccessService } from '../services/qr-access.service';
export declare class QrAccessController {
    private readonly qrAccessService;
    private readonly configService;
    constructor(qrAccessService: QrAccessService, configService: ConfigService);
    createToken(body: {
        device_id: string;
        purpose: string;
        ttl_seconds?: number;
    }): Promise<{
        success: boolean;
        access_token: string;
        expires_at: Date;
        qr_url: string;
        ttl_seconds: number;
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
    validateToken(body: {
        access_token: string;
        user_pin?: string;
    }): Promise<{
        valid: boolean;
        message: string;
        error_code: string | undefined;
        redirect_url?: undefined;
        expires_in_seconds?: undefined;
    } | {
        valid: boolean;
        message: string;
        redirect_url: string;
        expires_in_seconds: number | undefined;
        error_code?: undefined;
    }>;
    consumeToken(body: {
        access_token: string;
        user_pin: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
}
