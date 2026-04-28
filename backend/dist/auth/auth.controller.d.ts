import { AuthService } from './auth.service';
import { LoginDto, PosLoginDto, RefreshDto } from './dto/auth.dto';
import { UserEntity } from '../users/entities/user.entity';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(dto: LoginDto): Promise<{
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
    posLogin(dto: PosLoginDto, deviceCode: string): Promise<{
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
    refresh(dto: RefreshDto): Promise<{
        access_token: string;
        token_type: string;
    }>;
    getMe(user: UserEntity): any;
    getPermissions(user: UserEntity): string[];
    logout(): {
        message: string;
    };
}
