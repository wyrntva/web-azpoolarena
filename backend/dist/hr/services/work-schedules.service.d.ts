import { Repository } from 'typeorm';
import { WorkScheduleEntity, AttendanceEntity } from '../entities';
import { UserEntity } from '../../users/entities/user.entity';
import { CreateWorkScheduleDto, UpdateWorkScheduleDto, CopyScheduleRequestDto, CopyWeekScheduleRequestDto } from '../dto/hr.dto';
export declare class WorkSchedulesService {
    private readonly scheduleRepo;
    private readonly attendanceRepo;
    private readonly userRepo;
    constructor(scheduleRepo: Repository<WorkScheduleEntity>, attendanceRepo: Repository<AttendanceEntity>, userRepo: Repository<UserEntity>);
    create(dto: CreateWorkScheduleDto): Promise<WorkScheduleEntity>;
    findAll(userId?: number, startDate?: string, endDate?: string, isActive?: boolean): Promise<any[]>;
    findMySchedules(userId: number, startDate?: string, endDate?: string): Promise<WorkScheduleEntity[]>;
    findOne(id: number, currentUserId: number, isAdmin: boolean): Promise<{
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
        attendances: AttendanceEntity[];
    }>;
    update(id: number, dto: UpdateWorkScheduleDto): Promise<WorkScheduleEntity>;
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
