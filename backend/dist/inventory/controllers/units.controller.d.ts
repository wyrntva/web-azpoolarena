import { UnitsService } from '../services/units.service';
import { CreateUnitDto, UpdateUnitDto } from '../dto/inventory.dto';
export declare class UnitsController {
    private readonly unitsService;
    constructor(unitsService: UnitsService);
    create(dto: CreateUnitDto): Promise<import("../entities").UnitEntity>;
    findAll(): Promise<import("../entities").UnitEntity[]>;
    findOne(id: number): Promise<import("../entities").UnitEntity>;
    update(id: number, dto: UpdateUnitDto): Promise<import("../entities").UnitEntity>;
    remove(id: number): Promise<null>;
}
