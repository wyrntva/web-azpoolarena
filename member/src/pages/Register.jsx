import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LogoSection from '../components/LogoSection.jsx';
import Footer from '../components/Footer.jsx';
import { authService } from '../services/authService';
import { tournamentService } from '../services/tournamentService';
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

function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [ranks, setRanks] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formData, setFormData] = useState({
    fullName: '',
    gender: '',
    address: '',
    rank: '',
    phoneNumber: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const fetchRanks = async () => {
      try {
        const response = await tournamentService.getRanks();
        if (Array.isArray(response)) {
          setRanks(response);
        } else if (response && response.data) {
          setRanks(response.data);
        }
      } catch (err) {
        console.error('Failed to fetch ranks:', err);
      }
    };
    fetchRanks();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Real-time validation
    if (name === 'password') {
      if (value.length > 0 && value.length < 6) {
        setFieldErrors((prev) => ({ ...prev, password: 'Mật khẩu phải có ít nhất 6 kí tự!' }));
      } else {
        setFieldErrors((prev) => ({ ...prev, password: '' }));
      }
    }
    // Confirm password check
    if (name === 'confirmPassword' || name === 'password') {
      const pass = name === 'password' ? value : formData.password;
      const confirm = name === 'confirmPassword' ? value : formData.confirmPassword;
      if (confirm && pass !== confirm) {
        if (name === 'confirmPassword') setFieldErrors(prev => ({ ...prev, confirmPassword: 'Mật khẩu không khớp' }));
      } else if (name === 'confirmPassword') {
        setFieldErrors(prev => ({ ...prev, confirmPassword: '' }));
      }
    }

    // Clear required error
    if (fieldErrors[name] && value.trim()) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Validate fields
    const errors = {};
    if (!formData.fullName.trim()) errors.fullName = 'Họ và tên không được để trống';
    if (!formData.gender) errors.gender = 'Vui lòng chọn giới tính';
    // Rank is optional now
    if (!formData.phoneNumber.trim()) errors.phoneNumber = 'Số điện thoại không được để trống';
    if (!formData.email.trim()) errors.email = 'Email không được để trống';

    if (!formData.password) {
      errors.password = 'Mật khẩu không được để trống';
    } else if (formData.password.length < 6) {
      errors.password = 'Mật khẩu phải có ít nhất 6 kí tự!';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Vui lòng nhập lại mật khẩu';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Mật khẩu nhập lại không khớp';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setShowToast(true);
      return;
    }

    setLoading(true);
    setFieldErrors({});

    try {
      await authService.register(formData);
      alert('Đăng ký thành công! Vui lòng đăng nhập.');
      navigate('/login');
    } catch (err) {
      console.error('Register error:', err);
      // Determine where to show error based on message or default to phone/email
      // For simplicity, showing generic error for phone since it's common ID
      const msg = err.message || 'Đăng ký thất bại';
      if (msg.includes('phone') || msg.includes('exist')) {
        setFieldErrors({ phoneNumber: msg });
      } else {
        // fallback to generic toast or spread error
      }
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {showToast && (
        <Toast
          message="Đăng ký không thành công!"
          onClose={() => setShowToast(false)}
        />
      )}
      <div className="auth-hero register-hero">
        <div className="auth-container">
          <div className="auth-header">
            <LogoSection />
            <div className="auth-welcome">
              Chào mừng bạn đến với <span>Pool Arena</span>!
            </div>
          </div>

          <div className="auth-card register-card">
            <div className="auth-title">Đăng ký</div>
            <form className="auth-form" onSubmit={handleSubmit}>
              <label>
                <span>
                  Họ và tên <em>*</em>
                </span>
                <div className="input-wrapper">
                  <input
                    type="text"
                    name="fullName"
                    placeholder="Nhập họ và tên"
                    value={formData.fullName}
                    onChange={handleChange}
                    className={fieldErrors.fullName ? 'input-error' : ''}
                  />
                  {fieldErrors.fullName && <div className="input-icon"><ErrorIcon /></div>}
                </div>
                {fieldErrors.fullName && <span className="error-text">{fieldErrors.fullName}</span>}
              </label>

              <label>
                <span>
                  Giới tính <em>*</em>
                </span>
                <div className="input-wrapper">
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className={fieldErrors.gender ? 'input-error' : ''}
                  >
                    <option value="">Chọn giới tính</option>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
                {fieldErrors.gender && <span className="error-text">{fieldErrors.gender}</span>}
              </label>

              <label>
                <span>Địa chỉ</span>
                <div className="input-wrapper">
                  <input
                    type="text"
                    name="address"
                    placeholder="Nhập địa chỉ"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>
              </label>

              <label>
                <span>Hạng</span>
                <div className="input-wrapper">
                  <select
                    name="rank"
                    value={formData.rank}
                    onChange={handleChange}
                  >
                    <option value="">Hạng của bạn</option>
                    {ranks.map((rank) => (
                      <option key={rank.id} value={rank.name}>
                        {rank.name}
                      </option>
                    ))}
                    {ranks.length === 0 && (
                      <>
                        <option value="Hạng A">Hạng A</option>
                        <option value="Hạng B">Hạng B</option>
                        <option value="Hạng C">Hạng C</option>
                      </>
                    )}
                  </select>
                </div>
              </label>

              <label>
                <span>
                  Số điện thoại <em>*</em>
                </span>
                <div className="input-wrapper">
                  <input
                    type="tel"
                    name="phoneNumber"
                    placeholder="VD: 0999888777"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className={fieldErrors.phoneNumber ? 'input-error' : ''}
                  />
                  {fieldErrors.phoneNumber && <div className="input-icon"><ErrorIcon /></div>}
                </div>
                {fieldErrors.phoneNumber && <span className="error-text">{fieldErrors.phoneNumber}</span>}
              </label>

              <label>
                <span>Email <em>*</em></span>
                <div className="input-wrapper">
                  <input
                    type="email"
                    name="email"
                    placeholder="Nhập địa chỉ email"
                    value={formData.email}
                    onChange={handleChange}
                    className={fieldErrors.email ? 'input-error' : ''}
                  />
                  {fieldErrors.email && <div className="input-icon"><ErrorIcon /></div>}
                </div>
                {fieldErrors.email && <span className="error-text">{fieldErrors.email}</span>}
              </label>

              <label>
                <span>
                  Mật khẩu <em>*</em>
                </span>
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

              <label>
                <span>
                  Nhập lại mật khẩu <em>*</em>
                </span>
                <div className="input-wrapper">
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Nhập lại mật khẩu"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={fieldErrors.confirmPassword ? 'input-error' : ''}
                  />
                  {fieldErrors.confirmPassword && <div className="input-icon"><ErrorIcon /></div>}
                </div>
                {fieldErrors.confirmPassword && <span className="error-text">{fieldErrors.confirmPassword}</span>}
              </label>

              <div className="auth-register-actions">
                <button className="auth-submit" type="submit" disabled={loading}>
                  {loading ? 'Đang xử lý...' : 'Đăng ký'}
                </button>
                <a className="auth-link back" href="/login">
                  Trở lại đăng nhập
                </a>
              </div>
            </form>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}

export default Register;
