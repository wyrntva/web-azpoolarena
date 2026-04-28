import axiosClient from './axiosClient.ts';
import type { AxiosResponse } from 'axios';
import type { Attendance, WorkSchedule, AttendanceSettings, PaginatedResponse } from '../types/api';

interface CheckAttendanceData {
    qr_token: string;
    pin: string;
    wifi_ssid?: string | null;
    wifi_bssid?: string | null;
    ip_address?: string | null;
}

interface TimesheetParams {
    start_date?: string;
    end_date?: string;
    user_id?: number;
    page?: number;
    page_size?: number;
}

interface QRGenerateResponse {
    qr_url: string;
    token: string;
    expires_at: string;
}

interface UpdateAttendanceData {
    check_in_time?: string;
    check_out_time?: string;
    status?: 'present' | 'late' | 'absent' | 'early_checkout';
    notes?: string;
}

interface ManualAttendanceData {
    user_id: number;
    date: string;
    check_in_time: string;
    check_out_time?: string;
    notes?: string;
}

export const attendanceAPI = {
    checkAttendance: (data: CheckAttendanceData): Promise<AxiosResponse<any>> => {
        return axiosClient.post('/api/attendance/check', data);
    },

    publicCheckAttendance: (data: CheckAttendanceData): Promise<AxiosResponse<any>> => {
        // Public API - no auth required
        return axiosClient.post('/api/attendance/public-check', data);
    },

    getTimesheet: (params?: TimesheetParams): Promise<AxiosResponse<PaginatedResponse<Attendance>>> => {
        return axiosClient.get('/api/attendance/timesheet', { params });
    },

    getMyTimesheet: (params?: TimesheetParams): Promise<AxiosResponse<PaginatedResponse<Attendance>>> => {
        return axiosClient.get('/api/attendance/my-timesheet', { params });
    },

    generateQRCode: (tokenType: 'check_in' | 'check_out' | 'attendance'): Promise<AxiosResponse<QRGenerateResponse>> => {
        return axiosClient.post('/api/attendance/qr/generate', null, {
            params: { token_type: tokenType }
        });
    },

    updateAttendance: (id: number, data: UpdateAttendanceData): Promise<AxiosResponse<Attendance>> => {
        return axiosClient.put(`/api/attendance/${id}`, data);
    },

    deleteAttendance: (id: number): Promise<AxiosResponse<void>> => {
        return axiosClient.delete(`/api/attendance/${id}`);
    },

    createManualAttendance: (data: ManualAttendanceData): Promise<AxiosResponse<Attendance>> => {
        return axiosClient.post('/api/attendance/manual', data);
    },
};

interface WorkScheduleData {
    user_id: number;
    work_date: string;
    start_time: string;
    end_time: string;
    is_active?: boolean;
    allowed_late_minutes?: number;
}

interface WorkScheduleParams {
    start_date?: string;
    end_date?: string;
    user_id?: number;
}

interface CopyScheduleData {
    from_date: string;
    to_dates: string[];
    user_id: number;
}

interface CopyWeekScheduleData {
    from_week_start: string;
    to_week_start: string;
    user_ids?: number[];
}

interface CopyScheduleResponse {
    status: string;
    created: number;
    skipped: number;
    message: string;
}

export const workScheduleAPI = {
    create: (data: WorkScheduleData): Promise<AxiosResponse<WorkSchedule>> => {
        return axiosClient.post('/api/work-schedules', data);
    },

    getAll: (params?: WorkScheduleParams): Promise<AxiosResponse<WorkSchedule[]>> => {
        return axiosClient.get('/api/work-schedules', { params });
    },

    getMy: (params?: WorkScheduleParams): Promise<AxiosResponse<WorkSchedule[]>> => {
        return axiosClient.get('/api/work-schedules/my', { params });
    },

    getById: (id: number): Promise<AxiosResponse<WorkSchedule>> => {
        return axiosClient.get(`/api/work-schedules/${id}`);
    },

    update: (id: number, data: Partial<WorkScheduleData>): Promise<AxiosResponse<WorkSchedule>> => {
        return axiosClient.put(`/api/work-schedules/${id}`, data);
    },

    delete: (id: number): Promise<AxiosResponse<void>> => {
        return axiosClient.delete(`/api/work-schedules/${id}`);
    },

    copySchedule: (data: CopyScheduleData): Promise<AxiosResponse<CopyScheduleResponse>> => {
        return axiosClient.post('/api/work-schedules/copy-schedule', data);
    },

    copyWeekSchedule: (data: CopyWeekScheduleData): Promise<AxiosResponse<CopyScheduleResponse>> => {
        return axiosClient.post('/api/work-schedules/copy-week-schedule', data);
    },
};

export const attendanceSettingsAPI = {
    get: (): Promise<AxiosResponse<AttendanceSettings>> => {
        return axiosClient.get('/api/attendance-settings/');
    },

    update: (data: Partial<AttendanceSettings>): Promise<AxiosResponse<AttendanceSettings>> => {
        return axiosClient.put('/api/attendance-settings/', data);
    },

    create: (data: Omit<AttendanceSettings, 'id' | 'is_active'>): Promise<AxiosResponse<AttendanceSettings>> => {
        return axiosClient.post('/api/attendance-settings/', data);
    },
};
