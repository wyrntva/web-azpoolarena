import { Repository } from 'typeorm';
import { UnitEntity } from '../entities';
import { CreateUnitDto, UpdateUnitDto } from '../dto/inventory.dto';
export declare class UnitsService {
    private readonly unitsRepo;
    constructor(unitsRepo: Repository<UnitEntity>);
    create(dto: CreateUnitDto): Promise<UnitEntity>;
    findAll(): Promise<UnitEntity[]>;
    findOne(id: number): Promise<UnitEntity>;
    update(id: number, dto: UpdateUnitDto): Promise<UnitEntity>;
    remove(id: number): Promise<null>;
}
