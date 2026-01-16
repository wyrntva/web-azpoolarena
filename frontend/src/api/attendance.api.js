import axiosClient from './axiosClient';

export const attendanceAPI = {
  checkAttendance: (data) => {
    return axiosClient.post('/api/attendance/check', data);
  },

  publicCheckAttendance: (data) => {
    // Public API - no auth required
    return axiosClient.post('/api/attendance/public-check', data);
  },

  getTimesheet: (params) => {
    return axiosClient.get('/api/attendance/timesheet', { params });
  },

  getMyTimesheet: (params) => {
    return axiosClient.get('/api/attendance/my-timesheet', { params });
  },

  generateQRCode: (tokenType) => {
    return axiosClient.post('/api/attendance/qr/generate', null, {
      params: { token_type: tokenType }
    });
  },

  updateAttendance: (id, data) => {
    return axiosClient.put(`/api/attendance/${id}`, data);
  },

  deleteAttendance: (id) => {
    return axiosClient.delete(`/api/attendance/${id}`);
  },

  createManualAttendance: (data) => {
    return axiosClient.post('/api/attendance/manual', data);
  },
};

export const workScheduleAPI = {
  create: (data) => {
    return axiosClient.post('/api/work-schedules', data);
  },

  getAll: (params) => {
    return axiosClient.get('/api/work-schedules', { params });
  },

  getMy: (params) => {
    return axiosClient.get('/api/work-schedules/my', { params });
  },

  getById: (id) => {
    return axiosClient.get(`/api/work-schedules/${id}`);
  },

  update: (id, data) => {
    return axiosClient.put(`/api/work-schedules/${id}`, data);
  },

  delete: (id) => {
    return axiosClient.delete(`/api/work-schedules/${id}`);
  },

  copySchedule: (data) => {
    return axiosClient.post('/api/work-schedules/copy-schedule', data);
  },

  copyWeekSchedule: (data) => {
    return axiosClient.post('/api/work-schedules/copy-week-schedule', data);
  },
};

export const attendanceSettingsAPI = {
  get: () => {
    return axiosClient.get('/api/attendance-settings/');
  },

  update: (data) => {
    return axiosClient.put('/api/attendance-settings/', data);
  },

  create: (data) => {
    return axiosClient.post('/api/attendance-settings/', data);
  },
};

