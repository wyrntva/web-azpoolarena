import { Repository } from 'typeorm';
import { RoleEntity } from '../entities/role.entity';
export declare class RolesService {
    private repo;
    constructor(repo: Repository<RoleEntity>);
    findAll(): Promise<{
        permissions: any;
        id: number;
        name: string;
        description: string;
        is_active: boolean;
        is_system: boolean;
        requires_timekeeping: boolean;
        created_at: Date;
        updated_at: Date;
    }[]>;
    findOne(id: number): Promise<{
        permissions: any;
        id: number;
        name: string;
        description: string;
        is_active: boolean;
        is_system: boolean;
        requires_timekeeping: boolean;
        created_at: Date;
        updated_at: Date;
    }>;
    create(data: any): Promise<{
        permissions: any;
        id: number;
        name: string;
        description: string;
        is_active: boolean;
        is_system: boolean;
        requires_timekeeping: boolean;
        created_at: Date;
        updated_at: Date;
    }>;
    update(id: number, data: any): Promise<{
        permissions: any;
        id: number;
        name: string;
        description: string;
        is_active: boolean;
        is_system: boolean;
        requires_timekeeping: boolean;
        created_at: Date;
        updated_at: Date;
    }>;
    remove(id: number): Promise<void>;
}
