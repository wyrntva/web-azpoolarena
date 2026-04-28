export declare class RoleEntity {
    id: number;
    name: string;
    description: string;
    permissions: string;
    is_active: boolean;
    is_system: boolean;
    requires_timekeeping: boolean;
    created_at: Date;
    updated_at: Date;
}
