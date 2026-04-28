import { RolesService } from '../services/roles.service';
export declare class RolesController {
    private readonly rolesService;
    constructor(rolesService: RolesService);
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
    findOne(id: string): Promise<{
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
    create(createRoleDto: any): Promise<{
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
    update(id: string, updateRoleDto: any): Promise<{
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
    remove(id: string): Promise<{
        detail: string;
    }>;
}
