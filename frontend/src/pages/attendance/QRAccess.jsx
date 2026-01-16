import { useState, useEffect } from "react";
import {
  Card,
  Alert,
  Space,
  Typography,
  Spin,
  Result,
  Button
} from "antd";
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined
} from "@ant-design/icons";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";

const { Title, Text } = Typography;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export default function QRAccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [validating, setValidating] = useState(true);
  const [validationResult, setValidationResult] = useState(null);
  const [expiresIn, setExpiresIn] = useState(null);

  const accessToken = searchParams.get("token");

  useEffect(() => {
    if (!accessToken) {
      setValidating(false);
      setValidationResult({
        valid: false,
        message: "Link không hợp lệ. Vui lòng quét lại mã QR.",
        error_code: "MISSING_TOKEN"
      });
      return;
    }

    validateToken();

    // No need to consume token on unload anymore
    // Token will be consumed after successful attendance

    // Prevent copying URL
    const handleCopy = (e) => {
      e.preventDefault();
    };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('contextmenu', (e) => e.preventDefault());

    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('contextmenu', handleCopy);
    };
  }, [accessToken]);

  // Countdown timer for expiration
  useEffect(() => {
    if (expiresIn && expiresIn > 0 && validationResult?.valid) {
      const timer = setInterval(() => {
        setExpiresIn((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setValidationResult({
              valid: false,
              message: "Mã QR đã hết hạn",
              error_code: "TOKEN_EXPIRED"
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [expiresIn, validationResult]);

  const validateToken = async () => {
    setValidating(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/qr-access/validate`,
        { access_token: accessToken },
        { timeout: 10000 }
      );

      const result = response.data;
      setValidationResult(result);

      if (result.valid) {
        setExpiresIn(result.expires_in_seconds);

        // No need to consume token here - will be consumed after successful attendance
        // Backend has 20s grace period for reusing the same token

        // Auto-redirect after 2 seconds
        setTimeout(() => {
          navigate(`/mobile-attendance?token=${accessToken}&type=attendance`);
        }, 2000);
      }

    } catch (error) {
      console.error("Validation error:", error);
      setValidationResult({
        valid: false,
        message: error.response?.data?.message || "Không thể xác thực mã QR",
        error_code: error.response?.data?.error_code || "VALIDATION_ERROR"
      });
    } finally {
      setValidating(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (validating) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <Card
          style={{
            maxWidth: 500,
            width: "100%",
            borderRadius: 12,
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)"
          }}
        >
          <div style={{ textAlign: "center", padding: "32px 16px" }}>
            <Spin
              indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />}
              size="large"
            />
            <div style={{ marginTop: 20 }}>
              <Text strong style={{ fontSize: 16 }}>Đang xác thực mã QR...</Text>
            </div>
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 14 }}>Vui lòng đợi trong giây lát</Text>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!validationResult?.valid) {
    // Invalid token
    const getErrorIcon = () => {
      switch (validationResult?.error_code) {
        case "TOKEN_ALREADY_USED":
          return <CloseCircleOutlined style={{ color: "#ff4d4f" }} />;
        case "TOKEN_EXPIRED":
          return <ClockCircleOutlined style={{ color: "#faad14" }} />;
        default:
          return <CloseCircleOutlined style={{ color: "#ff4d4f" }} />;
      }
    };

    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <Card
          style={{
            maxWidth: 500,
            width: "100%",
            borderRadius: 12,
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)"
          }}
          styles={{ body: { padding: "20px 16px" } }}
        >
          <Result
            status="error"
            icon={getErrorIcon()}
            title={<span style={{ fontSize: "18px" }}>Mã QR không hợp lệ</span>}
            subTitle={<span style={{ fontSize: "14px" }}>{validationResult?.message || "Vui lòng quét lại mã QR mới"}</span>}
            extra={[
              <Alert
                key="info"
                message="Thông tin"
                description={
                  <Space direction="vertical" size="small" style={{ fontSize: "13px" }}>
                    <div>• Mỗi mã QR chỉ dùng được 1 lần</div>
                    <div>• Mã QR có thời hạn (thường 60 giây)</div>
                    <div>• Vui lòng yêu cầu tạo mã QR mới</div>
                  </Space>
                }
                type="info"
                showIcon
                style={{ textAlign: "left", fontSize: "13px" }}
              />
            ]}
          />
        </Card>
      </div>
    );
  }

  // Valid token - Show success and redirect
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      padding: "16px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <Card
        style={{
          maxWidth: 500,
          width: "100%",
          borderRadius: 12,
          boxShadow: "0 8px 32px rgba(0,0,0,0.1)"
        }}
        styles={{ body: { padding: "20px 16px" } }}
      >
        <Result
          status="success"
          icon={<CheckCircleOutlined style={{ color: "#52c41a", fontSize: 56 }} />}
          title={<span style={{ fontSize: "18px" }}>Xác thực thành công!</span>}
          subTitle={<span style={{ fontSize: "14px" }}>Đang chuyển đến trang chấm công...</span>}
          extra={[
            <div key="info" style={{ textAlign: "center" }}>
              <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                <Alert
                  message={<span style={{ fontSize: "14px" }}>Mã QR hợp lệ</span>}
                  description={<span style={{ fontSize: "13px" }}>{validationResult?.message}</span>}
                  type="success"
                  showIcon
                />

                {expiresIn && expiresIn > 0 && (
                  <div>
                    <Text type="secondary" style={{ fontSize: "13px" }}>Thời gian còn lại:</Text>
                    <div style={{
                      fontSize: 28,
                      fontWeight: "bold",
                      color: expiresIn <= 10 ? "#ff4d4f" : "#52c41a",
                      marginTop: 8
                    }}>
                      {formatTime(expiresIn)}
                    </div>
                  </div>
                )}

                <Spin size="large" />
              </Space>
            </div>
          ]}
        />
      </Card>
    </div>
  );
}
