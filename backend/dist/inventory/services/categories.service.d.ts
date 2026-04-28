import { Repository } from 'typeorm';
import { CategoryEntity } from '../entities';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto/inventory.dto';
export declare class CategoriesService {
    private readonly categoriesRepo;
    constructor(categoriesRepo: Repository<CategoryEntity>);
    create(dto: CreateCategoryDto): Promise<CategoryEntity>;
    findAll(): Promise<CategoryEntity[]>;
    findOne(id: number): Promise<CategoryEntity>;
    update(id: number, dto: UpdateCategoryDto): Promise<CategoryEntity>;
    remove(id: number): Promise<null>;
}
