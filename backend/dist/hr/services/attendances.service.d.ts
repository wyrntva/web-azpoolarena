import { Repository } from 'typeorm';
import { AttendanceEntity, WorkScheduleEntity, QRSessionEntity, QRAccessTokenEntity, WiFiConfigEntity } from '../entities';
import { UserEntity } from '../../users/entities/user.entity';
import { PublicAttendanceCheckRequestDto, AttendanceCheckRequestDto, UpdateAttendanceDto, CreateManualAttendanceDto, CreateQRTokenDto } from '../dto/hr.dto';
import { AttendanceStatus } from '../../common/enums';
export declare class AttendancesService {
    private readonly attendanceRepo;
    private readonly scheduleRepo;
    private readonly userRepo;
    private readonly qrSessionRepo;
    private readonly qrAccessTokenRepo;
    private readonly wifiConfigRepo;
    constructor(attendanceRepo: Repository<AttendanceEntity>, scheduleRepo: Repository<WorkScheduleEntity>, userRepo: Repository<UserEntity>, qrSessionRepo: Repository<QRSessionEntity>, qrAccessTokenRepo: Repository<QRAccessTokenEntity>, wifiConfigRepo: Repository<WiFiConfigEntity>);
    private validateWifiConnection;
    private validateQrAccessToken;
    private consumeQrAccessToken;
    generateQrCode(dto: CreateQRTokenDto, currentUserId: number): Promise<QRSessionEntity>;
    publicCheckAttendance(dto: PublicAttendanceCheckRequestDto, ipAddress: string): Promise<{
        success: boolean;
        action: string;
        message: string;
        attendance_id: number;
        check_in_time: Date | null;
        status: AttendanceStatus;
        check_out_time?: undefined;
    } | {
        success: boolean;
        action: string;
        message: string;
        attendance_id: number;
        check_in_time: Date;
        check_out_time: Date;
        status: AttendanceStatus;
    } | undefined>;
    checkAttendance(dto: AttendanceCheckRequestDto, user: any, ipAddress: string): Promise<{
        success: boolean;
        action: string;
        message: string;
        attendance_id: number;
        check_in_time: Date | null;
        status: AttendanceStatus;
        check_out_time?: undefined;
    } | {
        success: boolean;
        action: string;
        message: string;
        attendance_id: number;
        check_in_time: Date;
        check_out_time: Date;
        status: AttendanceStatus;
    } | undefined>;
    getTimesheet(userId: number | null, startDate?: string, endDate?: string, statusFilter?: string, page?: number, pageSize?: number, currentUser?: any): Promise<{
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
            status: AttendanceStatus;
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
    updateAttendance(id: number, dto: UpdateAttendanceDto): Promise<AttendanceEntity>;
    createManualAttendance(dto: CreateManualAttendanceDto): Promise<AttendanceEntity>;
}
