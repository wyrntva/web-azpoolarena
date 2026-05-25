import { request } from './httpClient';

export const authService = {
    login: async (emailOrPhone, password) => {
        // Backend expects snake_case: email_or_phone
        const payload = {
            email_or_phone: emailOrPhone,
            password: password
        };
        // The request function already handles response.json() and error checking
        return request('/api/pool-arena/auth/login', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    },

    register: async (data) => {
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
        return request('/api/pool-arena/auth/register', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    },

    profile: async () => {
        // Retrieve token from local storage (if stored) - httpClient might need an interceptor logic
        // For now, assuming httpClient handles basic headers or we pass them manually.
        // However, usually login response returns a token. 
        // We should check how httpClient handles auth headers.
        return request('/api/pool-arena/auth/me');
    }
};
