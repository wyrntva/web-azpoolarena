import { useState } from 'react';
import LogoSection from '../components/LogoSection.jsx';
import Footer from '../components/Footer.jsx';

function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setDone(true);
    }, 600);
  };

  if (done) {
    return (
      <div className="auth-page">
        <div className="auth-hero auth-hero-dark">
          <div className="auth-container">
            <div className="auth-card auth-success">
              <div className="auth-title">Yêu cầu đã được gửi!</div>
              <p>
                Chúng tôi đã gửi mã xác thực đến số điện thoại của bạn. Vui lòng kiểm tra tin
                nhắn và làm theo hướng dẫn.
              </p>
              <a className="auth-submit" href="/login">
                Quay lại đăng nhập
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-hero">
        <div className="auth-container">
          <div className="auth-header">
            <LogoSection />
            <div className="auth-welcome">
              Chào mừng bạn đến với <span>Pool Arena</span>!
            </div>
          </div>

          <div className="auth-card forgot-card">
            <div className="auth-title">Quên mật khẩu?</div>
            <form className="auth-form" onSubmit={handleSubmit}>
              <label>
                <span>Số điện thoại</span>
                <input
                  type="tel"
                  placeholder="Nhập số điện thoại"
                  pattern="^\\+84[0-9]{9,10}$"
                  required
                />
              </label>

              <div className="auth-register-actions">
                <button className="auth-submit forgot-submit" type="submit" disabled={loading}>
                  {loading ? 'Đang xử lý...' : 'Khôi phục mật khẩu'}
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

export default ForgotPassword;
