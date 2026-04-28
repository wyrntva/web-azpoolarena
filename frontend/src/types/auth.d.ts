// Type definitions for auth.api.js
declare module '../api/auth.api' {
    export const authAPI: {
        login: (credentials: { username: string; password: string }) => Promise<any>;
        logout: () => Promise<any>;
        getCurrentUser: () => Promise<any>;
    };
}
