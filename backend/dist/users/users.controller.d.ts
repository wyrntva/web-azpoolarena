import { UsersService } from './users.service';
import { UserEntity } from './entities/user.entity';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(dto: any): Promise<any>;
    findAll(skip?: number, limit?: number): Promise<any[]>;
    findOne(id: number): Promise<any>;
    update(id: number, dto: any): Promise<any>;
    remove(id: number, user: UserEntity): Promise<void>;
    updateDisplayOrder(body: {
        user_orders: {
            user_id: number;
            display_order: number;
        }[];
    }): Promise<{
        status: string;
        message: string;
    }>;
}
