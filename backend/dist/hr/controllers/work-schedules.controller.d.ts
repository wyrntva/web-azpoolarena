import { WorkSchedulesService } from '../services/work-schedules.service';
import { CreateWorkScheduleDto, UpdateWorkScheduleDto, CopyScheduleRequestDto, CopyWeekScheduleRequestDto } from '../dto/hr.dto';
export declare class WorkSchedulesController {
    private readonly schedulesService;
    constructor(schedulesService: WorkSchedulesService);
    create(dto: CreateWorkScheduleDto): Promise<import("../entities").WorkScheduleEntity>;
    findAll(req: any, userIdStr?: string, startDate?: string, endDate?: string, isActiveStr?: string): Promise<any[]>;
    getMySchedules(req: any, startDate?: string, endDate?: string): Promise<import("../entities").WorkScheduleEntity[]>;
    findOne(id: number, req: any): Promise<{
        user: {
            id: number;
            full_name: string;
            username: string;
            email: string;
            role: string | null;
        } | null;
        id: number;
        user_id: number;
        work_date: string;
        start_time: string;
        end_time: string;
        allowed_late_minutes: number;
        is_active: boolean;
        created_at: Date;
        updated_at: Date;
        attendances: import("../entities").AttendanceEntity[];
    }>;
    update(id: number, dto: UpdateWorkScheduleDto): Promise<import("../entities").WorkScheduleEntity>;
    remove(id: number): Promise<null>;
    copySchedule(dto: CopyScheduleRequestDto): Promise<{
        status: string;
        created: number;
        skipped: number;
        message: string;
    }>;
    copyWeekSchedule(dto: CopyWeekScheduleRequestDto): Promise<{
        status: string;
        created: number;
        skipped: number;
        message: string;
    }>;
}
