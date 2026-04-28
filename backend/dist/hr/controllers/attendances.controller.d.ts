import { AttendancesService } from '../services/attendances.service';
import { PublicAttendanceCheckRequestDto, AttendanceCheckRequestDto, UpdateAttendanceDto, CreateManualAttendanceDto, CreateQRTokenDto } from '../dto/hr.dto';
export declare class AttendancesController {
    private readonly attendancesService;
    constructor(attendancesService: AttendancesService);
    publicCheck(dto: PublicAttendanceCheckRequestDto, req: any): Promise<{
        success: boolean;
        action: string;
        message: string;
        attendance_id: number;
        check_in_time: Date | null;
        status: import("../../common/enums").AttendanceStatus;
        check_out_time?: undefined;
    } | {
        success: boolean;
        action: string;
        message: string;
        attendance_id: number;
        check_in_time: Date;
        check_out_time: Date;
        status: import("../../common/enums").AttendanceStatus;
    } | undefined>;
    check(dto: AttendanceCheckRequestDto, req: any): Promise<{
        success: boolean;
        action: string;
        message: string;
        attendance_id: number;
        check_in_time: Date | null;
        status: import("../../common/enums").AttendanceStatus;
        check_out_time?: undefined;
    } | {
        success: boolean;
        action: string;
        message: string;
        attendance_id: number;
        check_in_time: Date;
        check_out_time: Date;
        status: import("../../common/enums").AttendanceStatus;
    } | undefined>;
    getTimesheet(req: any, userIdStr?: string, startDate?: string, endDate?: string, statusFilter?: string, page?: number, pageSize?: number): Promise<{
        total: number;
        page: number;
        page_size: number;
        items: {
            id: number;
            user_id: number;
            work_schedule_id: number;
            date: string;
            check_in_time: Date | null;
            check_out_time: Date | null;
            wifi_ssid: string;
            wifi_bssid: string;
            ip_address: string;
            status: import("../../common/enums").AttendanceStatus;
            notes: string;
            created_at: Date;
            updated_at: Date;
            user: {
                id: any;
                full_name: any;
                username: any;
                email: any;
            };
            work_schedule: {
                id: number;
                work_date: string;
                start_time: string;
                end_time: string;
                allowed_late_minutes: number;
            } | null;
        }[];
    }>;
    getMyTimesheet(req: any, startDate?: string, endDate?: string, page?: number, pageSize?: number): Promise<{
        total: number;
        page: number;
        page_size: number;
        items: {
            id: number;
            user_id: number;
            work_schedule_id: number;
            date: string;
            check_in_time: Date | null;
            check_out_time: Date | null;
            wifi_ssid: string;
            wifi_bssid: string;
            ip_address: string;
            status: import("../../common/enums").AttendanceStatus;
            notes: string;
            created_at: Date;
            updated_at: Date;
            user: {
                id: any;
                full_name: any;
                username: any;
                email: any;
            };
            work_schedule: {
                id: number;
                work_date: string;
                start_time: string;
                end_time: string;
                allowed_late_minutes: number;
            } | null;
        }[];
    }>;
    generateQrCode(dto: CreateQRTokenDto, req: any): Promise<import("../entities").QRSessionEntity>;
    updateAttendance(id: number, dto: UpdateAttendanceDto): Promise<import("../entities").AttendanceEntity>;
    createManualAttendance(dto: CreateManualAttendanceDto): Promise<import("../entities").AttendanceEntity>;
}
