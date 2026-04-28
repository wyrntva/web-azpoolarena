export declare enum PoolArenaUserGender {
    MALE = "male",
    FEMALE = "female",
    OTHER = "other"
}
export declare class PoolArenaUserEntity {
    id: number;
    full_name: string;
    gender: PoolArenaUserGender;
    address: string;
    rank: string;
    phone_number: string;
    email: string;
    avatar_url: string;
    hashed_password: string;
    role: string;
    is_active: boolean;
    is_phone_verified: boolean;
    is_email_verified: boolean;
    points: number;
    tiktok_url: string;
    facebook_url: string;
    instagram_url: string;
    total_games: number;
    wins: number;
    losses: number;
    created_at: Date;
    updated_at: Date;
}
