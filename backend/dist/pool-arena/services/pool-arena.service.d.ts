import { Repository } from 'typeorm';
import { PoolArenaUserEntity } from '../entities';
import { CreatePoolArenaUserDto, UpdatePoolArenaUserDto } from '../dto/pool-arena.dto';
export declare class PoolArenaService {
    private readonly repo;
    constructor(repo: Repository<PoolArenaUserEntity>);
    create(dto: CreatePoolArenaUserDto): Promise<PoolArenaUserEntity>;
    findAll(skip?: number, limit?: number, search?: string): Promise<[PoolArenaUserEntity[], number]>;
    findOne(id: number): Promise<PoolArenaUserEntity>;
    update(id: number, dto: UpdatePoolArenaUserDto): Promise<PoolArenaUserEntity>;
    getRankings(limit?: number): Promise<PoolArenaUserEntity[]>;
}
