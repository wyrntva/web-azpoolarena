/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../api/auth.api';


interface User {
    id: number;
    username: string;
    full_name: string;
    is_admin: boolean;
    role: {
        id: number;
        name: string;
        permissions: string[];
    };
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (credentials: { username: string; password: string }) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const checkAuth = async () => {
            const token = localStorage.getItem('access_token');
            if (token) {
                try {
                    const response = await authAPI.getCurrentUser();
                    if (isMounted) {
                        setUser(response.data);
                    }
                } catch {
                    if (isMounted) {
                        logout();
                    }
                }
            }
            if (isMounted) {
                setLoading(false);
            }
        };

        checkAuth();

        return () => {
            isMounted = false;
        };
    }, []);

    const login = async (credentials: { username: string; password: string }) => {
        try {
            const response = await authAPI.login(credentials);
            const { access_token, refresh_token } = response.data;

            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', refresh_token);

            const userResponse = await authAPI.getCurrentUser();
            setUser(userResponse.data);

            return { success: true };
        } catch (error) {
            const errorMessage = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Tài khoản không tồn tại hoặc sai mật khẩu!';
            return { success: false, error: errorMessage };
        }
    };

    const logout = async () => {
        try {
            await authAPI.logout();
        } catch { /* ignore */ } finally {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            setUser(null);
            // Force redirect to login page
            window.location.href = '/auth/login';
        }
    };

    const value = {
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
