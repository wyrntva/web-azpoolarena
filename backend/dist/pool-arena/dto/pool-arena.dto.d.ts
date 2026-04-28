import { PoolArenaUserGender } from '../entities';
export declare class CreatePoolArenaUserDto {
    full_name: string;
    phone_number: string;
    email?: string;
    hashed_password?: string;
    gender?: PoolArenaUserGender;
    address?: string;
    tiktok_url?: string;
    facebook_url?: string;
    instagram_url?: string;
}
export declare class UpdatePoolArenaUserDto {
    full_name?: string;
    email?: string;
    gender?: PoolArenaUserGender;
    address?: string;
    tiktok_url?: string;
    facebook_url?: string;
    instagram_url?: string;
    avatar_url?: string;
    rank?: string;
}
