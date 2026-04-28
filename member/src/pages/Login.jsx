import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LogoSection from '../components/LogoSection.jsx';
import Footer from '../components/Footer.jsx';
import { authService } from '../services/authService';
import Toast from '../components/Toast.jsx';

const ErrorIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path d="M10.75 20.75C16.273 20.75 20.75 16.273 20.75 10.75C20.75 5.227 16.273 0.75 10.75 0.75C5.227 0.75 0.75 5.227 0.75 10.75C0.75 16.273 5.227 20.75 10.75 20.75Z" stroke="#ED1C1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <g transform="translate(10, 6)">
      <path d="M0.75 0.75V4.75" stroke="#ED1C1F" strokeWidth="1.5" strokeLinecap="round" />
    </g>
    <g transform="translate(10, 13)">
      <path d="M0.75 0.761101L0.76 0.75" stroke="#ED1C1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
);

function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [formData, setFormData] = useState({
    phone: '',
    password: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Real-time password validation
    if (name === 'password') {
      if (value.length > 0 && value.length < 6) {
        setFieldErrors((prev) => ({ ...prev, password: 'Mật khẩu phải có ít nhất 6 kí tự!' }));
      } else {
        setFieldErrors((prev) => ({ ...prev, password: '' }));
      }
    } else if (fieldErrors[name]) {
      // Clear other errors
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Validate fields
    const errors = {};
    if (!formData.phone.trim()) {
      errors.phone = 'Số điện thoại không được để trống';
    }
    if (!formData.password) {
      errors.password = 'Mật khẩu không được để trống';
    } else if (formData.password.length < 6) {
      errors.password = 'Mật khẩu phải có ít nhất 6 kí tự!';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setShowToast(true);
      return;
    }

    setLoading(true);
    setError('');
    setFieldErrors({});

    try {
      const response = await authService.login(formData.phone, formData.password);

      const token = response.access_token || response.token;
      if (token) {
        localStorage.setItem('token', token);
        if (response.users) {
          localStorage.setItem('user', JSON.stringify(response.users));
        }
        navigate('/');
      } else {
        setError('Không nhận được token xác thực.');
      }
    } catch (err) {
      console.error('Login error:', err);
      // On login error, show error under password field and highlight both inputs
      setFieldErrors({
        phone: true, // Mark as error but no message
        password: 'Số điện thoại hoặc mật khẩu không chính xác'
      });
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {showToast && (
        <Toast
          message="Đăng nhập không thành công!"
          onClose={() => setShowToast(false)}
        />
      )}
      <div className="auth-hero">
        <div className="auth-container">
          <div className="auth-header">
            <LogoSection />
            <div className="auth-welcome">
              Chào mừng bạn đến với <span>Pool Arena</span>!
            </div>
          </div>

          <div className="auth-card">
            <div className="auth-title">Đăng nhập</div>
            <form className="auth-form" onSubmit={handleSubmit}>
              <label>
                <span>Số điện thoại</span>
                <div className="input-wrapper">
                  <input
                    type="text"
                    name="phone"
                    placeholder="Nhập số điện thoại"
                    value={formData.phone}
                    onChange={handleChange}
                    className={fieldErrors.phone ? 'input-error' : ''}
                  />
                  {fieldErrors.phone && <div className="input-icon"><ErrorIcon /></div>}
                </div>
                {fieldErrors.phone && typeof fieldErrors.phone === 'string' && (
                  <span className="error-text">{fieldErrors.phone}</span>
                )}
              </label>
              <label>
                <span>Mật khẩu</span>
                <div className="input-wrapper">
                  <input
                    type="password"
                    name="password"
                    placeholder="Nhập mật khẩu"
                    value={formData.password}
                    onChange={handleChange}
                    className={fieldErrors.password ? 'input-error' : ''}
                  />
                  {fieldErrors.password && <div className="input-icon"><ErrorIcon /></div>}
                </div>
                {fieldErrors.password && <span className="error-text">{fieldErrors.password}</span>}
              </label>
              <div className="auth-actions">
                <a className="auth-link" href="/forgot-password">
                  Quên mật khẩu
                </a>
              </div>
              <button className="auth-submit" type="submit" disabled={loading}>
                {loading ? 'Đang xử lý...' : 'Đăng nhập'}
              </button>
            </form>

            <div className="auth-divider"></div>

            <div className="auth-register">
              <div className="auth-register-title">Bạn chưa có tài khoản?</div>
              <a className="auth-outline" href="/register">
                Đăng ký ngay
              </a>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}

export default Login;
