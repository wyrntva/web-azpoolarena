import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { hasRole } from './roles';
import { Spin } from 'antd';

export const RequireAuth = ({ children, allowedRoles = [] }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !hasRole(user, allowedRoles)) {
    return (
      <div style={{
        padding: '50px',
        textAlign: 'center'
      }}>
        <h2>Không có quyền truy cập</h2>
        <p>Bạn không có quyền truy cập trang này.</p>
      </div>
    );
  }

  return children;
};
