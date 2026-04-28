import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { RoleEntity } from '../roles/entities/role.entity';
import { AuthService } from '../auth/auth.service';
export declare class UsersService {
    private readonly userRepo;
    private readonly roleRepo;
    private readonly authService;
    constructor(userRepo: Repository<UserEntity>, roleRepo: Repository<RoleEntity>, authService: AuthService);
    parseUserPermissions(user: UserEntity): any;
    create(dto: any): Promise<any>;
    findAll(skip?: number, limit?: number): Promise<any[]>;
    findOne(id: number): Promise<any>;
    update(id: number, dto: any): Promise<any>;
    remove(id: number, currentUserId: number): Promise<void>;
    updateDisplayOrder(orders: {
        user_id: number;
        display_order: number;
    }[]): Promise<{
        status: string;
        message: string;
    }>;
}
