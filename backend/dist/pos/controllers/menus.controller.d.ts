import { MenusService } from '../services/menus.service';
import { CreateMenuDto, UpdateMenuDto, ReorderMenuDto } from '../dto/menu.dto';
export declare class MenusController {
    private readonly menusService;
    constructor(menusService: MenusService);
    findAll(): Promise<{
        id: number;
        name: string;
        icon: string;
        image: string;
        productIds: number[];
        sort_order: number;
        createdAt: string;
    }[]>;
    findOne(id: number): Promise<{
        id: number;
        name: string;
        icon: string;
        image: string;
        productIds: number[];
        sort_order: number;
        createdAt: string;
    }>;
    create(dto: CreateMenuDto): Promise<{
        id: number;
        name: string;
        icon: string;
        image: string;
        productIds: number[];
        sort_order: number;
        createdAt: string;
    }>;
    update(id: number, dto: UpdateMenuDto): Promise<{
        id: number;
        name: string;
        icon: string;
        image: string;
        productIds: number[];
        sort_order: number;
        createdAt: string;
    }>;
    remove(id: number): Promise<null>;
    reorder(items: ReorderMenuDto[]): Promise<{
        id: number;
        name: string;
        icon: string;
        image: string;
        productIds: number[];
        sort_order: number;
        createdAt: string;
    }[]>;
}
