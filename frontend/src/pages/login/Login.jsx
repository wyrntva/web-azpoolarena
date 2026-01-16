import { useState } from 'react';
import { Form, Input, Button, Card } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import Logo from '../../assets/logo-login.png';
import AuthBackground from '../../assets/images/auth_img.png';
import { COLORS, SHADOWS, BORDER_RADIUS } from '../../constants/theme';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    const result = await login(values);
    setLoading(false);

    if (result.success) {
      navigate('/');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundImage: `url(${AuthBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
      }}
    >
      {/* Overlay để làm nổi bật form */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(2px)',
        }}
      />

      <Card
        className="fade-in"
        style={{
          width: 420,
          borderRadius: BORDER_RADIUS.xl,
          boxShadow: SHADOWS.modal,
          border: 'none',
          position: 'relative',
          zIndex: 1,
        }}
        styles={{
          body: { padding: 48 },
        }}
      >
        {/* Logo và tiêu đề */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div
            style={{
              display: 'inline-block',
              padding: 16,
              backgroundColor: `${COLORS.primary}08`,
              borderRadius: '50%',
              marginBottom: 16,
            }}
          >
            <img
              src={Logo}
              alt="AZ POOLARENA"
              style={{
                width: 80,
                height: 80,
                objectFit: 'contain',
              }}
            />
          </div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              margin: '0 0 8px 0',
              color: COLORS.primary,
              letterSpacing: '-0.5px',
            }}
          >
            AZ POOLARENA
          </h1>
          <p
            style={{
              color: COLORS.textSecondary,
              fontSize: 15,
              margin: 0,
            }}
          >
            Đăng nhập để tiếp tục
          </p>
        </div>

        {/* Form */}
        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          layout="vertical"
          requiredMark={false}
        >
          <Form.Item
            name="username"
            label={<span style={{ fontWeight: 500 }}>Tên đăng nhập</span>}
            rules={[
              { required: true, message: 'Vui lòng nhập tên đăng nhập' },
            ]}
          >
            <Input
              prefix={<UserOutlined style={{ color: COLORS.textSecondary }} />}
              placeholder="Nhập tên đăng nhập"
              size="large"
              style={{
                borderRadius: BORDER_RADIUS.md,
              }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={<span style={{ fontWeight: 500 }}>Mật khẩu</span>}
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: COLORS.textSecondary }} />}
              placeholder="Nhập mật khẩu"
              size="large"
              style={{
                borderRadius: BORDER_RADIUS.md,
              }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 32 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              block
              icon={!loading && <LoginOutlined />}
              style={{
                background: COLORS.primary,
                borderColor: COLORS.primary,
                height: 48,
                fontSize: 16,
                fontWeight: 600,
                borderRadius: BORDER_RADIUS.md,
                boxShadow: `0 4px 12px ${COLORS.primary}40`,
              }}
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
          </Form.Item>
        </Form>

        {/* Footer */}
        <div
          style={{
            textAlign: 'center',
            marginTop: 32,
            paddingTop: 24,
            borderTop: `1px solid ${COLORS.borderLight}`,
          }}
        >
          <p
            style={{
              fontSize: 13,
              color: COLORS.textSecondary,
              margin: 0,
            }}
          >
            © 2024 AZ POOLARENA. All rights reserved.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Login;
