import api from '@/config/axios';

export const authAPI = {
  login: async (data: { emailOrPhone: string; password: string }) => {
    // Backend expects snake_case: email_or_phone
    const payload = {
      email_or_phone: data.emailOrPhone,
      password: data.password
    };
    const response = await api.post('/api/pool-arena/auth/login', payload)
    return response.data
  },
  register: async (data: any) => {
    // Backend expects snake_case field names
    const payload = {
      full_name: data.fullName,
      phone_number: data.phoneNumber,
      email: data.email,
      password: data.password,
      gender: data.gender,
      rank: data.rank,
      address: data.address,
      role: data.role || 'player'
    };
    const response = await api.post('/api/pool-arena/auth/register', payload)
    return response.data
  },
  forgotPassword: async (email: string) => {
    const response = await api.post('/api/pool-arena/auth/forgot-password', { email })
    return response.data
  },
  sendNewPassword: async (email: string) => {
    const response = await api.post('/api/pool-arena/auth/send-new-password', { email })
    return response.data
  },
  verifyOtp: async (data: { email: string; code: string }) => {
    const response = await api.post('/api/pool-arena/auth/verify-otp', data)
    return response.data
  },
  resetPassword: async (data: { email: string; token: string; password: string }) => {
    const response = await api.post('/api/pool-arena/auth/reset-password', data)
    return response.data
  },
  profile: async () => {
    const response = await api.get('/api/pool-arena/auth/me')
    return response.data
  },
  changePassword: async (data: { currentPassword: string; newPassword: string }) => {
    // Backend expects snake_case: current_password, new_password
    const payload = {
      current_password: data.currentPassword,
      new_password: data.newPassword,
    };
    const response = await api.post('/api/pool-arena/auth/change-password', payload);
    return response.data;
  },
};
