import React from 'react';
import { Result, Button } from 'antd';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // You can also log the error to an error reporting service here
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '50px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh'
        }}>
          <Result
            status="error"
            title="Oops! Đã xảy ra lỗi"
            subTitle="Xin lỗi, đã có lỗi không mong muốn xảy ra. Vui lòng thử lại."
            extra={[
              <Button type="primary" key="home" onClick={this.handleReset}>
                Về trang chủ
              </Button>,
              <Button key="reload" onClick={this.handleReload}>
                Tải lại trang
              </Button>,
            ]}
          >
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div style={{
                textAlign: 'left',
                marginTop: 20,
                padding: 20,
                background: '#f5f5f5',
                borderRadius: 4,
                maxWidth: 800
              }}>
                <h4>Chi tiết lỗi (chỉ hiển thị ở môi trường development):</h4>
                <pre style={{
                  color: 'red',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {this.state.error.toString()}
                </pre>
                <details style={{ marginTop: 10 }}>
                  <summary>Stack trace</summary>
                  <pre style={{
                    marginTop: 10,
                    fontSize: 12,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}>
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              </div>
            )}
          </Result>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
