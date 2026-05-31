// Type definitions for auth.api.js
declare module '../api/auth.api' {
    export const authAPI: {
        login: (credentials: { username: string; password: string }) => Promise<unknown>;
        logout: () => Promise<unknown>;
        getCurrentUser: () => Promise<unknown>;
    };
}
