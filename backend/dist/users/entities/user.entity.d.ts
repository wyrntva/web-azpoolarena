import { RoleEntity } from '../../roles/entities/role.entity';
import { SalaryType } from '../../common/enums';
export declare class UserEntity {
    id: number;
    username: string;
    email: string;
    full_name: string;
    hashed_password: string;
    pin: string;
    is_active: boolean;
    role_id: number;
    salary_type: SalaryType;
    hourly_rate: number;
    fixed_salary: number;
    display_order: number;
    created_at: Date;
    updated_at: Date;
    role: RoleEntity;
    get is_admin(): boolean;
}
