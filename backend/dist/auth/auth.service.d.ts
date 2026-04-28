import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { DeviceEntity } from '../devices/entities/device.entity';
import { JwtPayload } from './strategies/jwt.strategy';
export declare class AuthService {
    private readonly userRepo;
    private readonly deviceRepo;
    private readonly jwtService;
    private readonly configService;
    constructor(userRepo: Repository<UserEntity>, deviceRepo: Repository<DeviceEntity>, jwtService: JwtService, configService: ConfigService);
    hashPassword(password: string): Promise<string>;
    verifyPassword(plain: string, hashed: string): Promise<boolean>;
    createAccessToken(userId: number): string;
    createRefreshToken(userId: number): string;
    decodeToken(token: string): JwtPayload | null;
    login(username: string, password: string): Promise<{
        access_token: string;
        refresh_token: string;
        token_type: string;
        user: {
            id: number;
            username: string;
            full_name: string;
            role_name: string | null;
        };
    }>;
    posLogin(pin: string, deviceCode: string): Promise<{
        access_token: string;
        refresh_token: string;
        token_type: string;
        user: {
            id: number;
            username: string;
            full_name: string;
            role_name: string | null;
        };
    }>;
    refresh(refreshToken: string): Promise<{
        access_token: string;
        token_type: string;
    }>;
    parseUserPermissions(user: UserEntity): any;
    getUserPermissions(user: UserEntity): string[];
}
