import { CategoriesService } from '../services/categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto/inventory.dto';
export declare class CategoriesController {
    private readonly categoriesService;
    constructor(categoriesService: CategoriesService);
    create(dto: CreateCategoryDto): Promise<import("../entities").CategoryEntity>;
    findAll(): Promise<import("../entities").CategoryEntity[]>;
    findOne(id: number): Promise<import("../entities").CategoryEntity>;
    update(id: number, dto: UpdateCategoryDto): Promise<import("../entities").CategoryEntity>;
    remove(id: number): Promise<null>;
}
