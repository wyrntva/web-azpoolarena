import { Navigate } from 'react-router';
import { useAuth } from './AuthContext';
import { Spinner } from 'flowbite-react';
import { ReactNode } from 'react';

interface RequireAuthProps {
    children: ReactNode;
    allowedRoles?: string[];
}

export const RequireAuth = ({ children, allowedRoles = [] }: RequireAuthProps) => {
    const { user, loading, isAuthenticated } = useAuth();

    // Show loading spinner while checking auth
    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Spinner size="xl" />
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/auth/login" replace />;
    }

    // Check role permissions if specified
    if (allowedRoles.length > 0 && user) {
        const userRole = user.role?.name;
        if (!allowedRoles.includes(userRole)) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen p-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Không có quyền truy cập
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            Bạn không có quyền truy cập trang này.
                        </p>
                    </div>
                </div>
            );
        }
    }

    return <>{children}</>;
};
