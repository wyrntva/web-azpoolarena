import { PoolArenaService } from '../services/pool-arena.service';
import { CreatePoolArenaUserDto, UpdatePoolArenaUserDto } from '../dto/pool-arena.dto';
export declare class PoolArenaController {
    private readonly service;
    constructor(service: PoolArenaService);
    create(dto: CreatePoolArenaUserDto): Promise<import("../entities").PoolArenaUserEntity>;
    findAll(skipStr?: string, limitStr?: string, search?: string): Promise<{
        data: import("../entities").PoolArenaUserEntity[];
        meta: {
            total: number;
            skip: number;
            limit: number;
        };
    }>;
    getRankings(limitStr?: string): Promise<import("../entities").PoolArenaUserEntity[]>;
    findOne(id: number): Promise<import("../entities").PoolArenaUserEntity>;
    update(id: number, dto: UpdatePoolArenaUserDto): Promise<import("../entities").PoolArenaUserEntity>;
}
