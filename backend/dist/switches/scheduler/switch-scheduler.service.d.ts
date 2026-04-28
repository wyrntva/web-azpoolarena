import { Repository } from 'typeorm';
import { SwitchEntity } from '../entities/switch.entity';
export declare class SwitchSchedulerService {
    private readonly switchRepo;
    private readonly logger;
    private triggeredToday;
    constructor(switchRepo: Repository<SwitchEntity>);
    checkSchedules(): Promise<void>;
    sendEspCommand(sw: SwitchEntity, command: string): void;
}
