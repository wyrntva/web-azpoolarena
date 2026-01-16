import { useState, useEffect } from "react";
import {
  Card,
  Input,
  Button,
  Alert,
  Space,
  Typography,
  Spin
} from "antd";
import { message as antdMessage } from "../../utils/antdGlobal";
import {
  ClockCircleOutlined,
  WifiOutlined,
  CheckCircleOutlined,
  LockOutlined
} from "@ant-design/icons";
import { useSearchParams } from "react-router-dom";
import { attendanceAPI } from "../../api/attendance.api";

const { Title, Text } = Typography;

export default function MobileAttendance() {
  const [searchParams] = useSearchParams();

  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [wifiInfo, setWifiInfo] = useState(null);
  const [checkingWifi, setCheckingWifi] = useState(true);
  const [wifiError, setWifiError] = useState(null);
  const [actionType, setActionType] = useState("");
  const [checkedInInfo, setCheckedInInfo] = useState(null);

  const qrToken = searchParams.get("token");
  const initialType = searchParams.get("type"); // check_in, check_out, or attendance

  useEffect(() => {
    let isMounted = true;

    if (!qrToken || !initialType) {
      antdMessage.error("Link không hợp lệ. Vui lòng quét lại mã QR.");
      return;
    }

    setActionType(initialType);

    const init = async () => {
      if (isMounted) {
        await checkWifiConnection();
        loadCheckedInStatus();
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, [qrToken, initialType]);

  // Tạo device fingerprint từ navigator
  const getDeviceFingerprint = () => {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    const language = navigator.language;
    return btoa(`${userAgent}-${platform}-${language}`);
  };

  // Load trạng thái đã chấm công từ localStorage
  const loadCheckedInStatus = () => {
    try {
      const deviceId = getDeviceFingerprint();
      const storageKey = `attendance_${deviceId}`;
      const stored = localStorage.getItem(storageKey);

      if (stored) {
        const data = JSON.parse(stored);
        const now = new Date().getTime();
        const checkInTime = new Date(data.checkInTime).getTime();
        const hoursDiff = (now - checkInTime) / (1000 * 60 * 60);

        // Reset sau 8 tiếng
        if (hoursDiff >= 8) {
          localStorage.removeItem(storageKey);
          setCheckedInInfo(null);
        } else if (data.pin) {
          setCheckedInInfo(data);
        }
      }
    } catch (error) {
      console.error("Error loading checked-in status:", error);
    }
  };

  // Lưu trạng thái đã chấm công
  const saveCheckedInStatus = (pin, checkInTime) => {
    try {
      const deviceId = getDeviceFingerprint();
      const storageKey = `attendance_${deviceId}`;
      const data = {
        pin,
        checkInTime,
        deviceId,
      };
      localStorage.setItem(storageKey, JSON.stringify(data));
      setCheckedInInfo(data);
    } catch (error) {
      console.error("Error saving checked-in status:", error);
    }
  };

  const checkWifiConnection = async () => {
    setCheckingWifi(true);

    try {
      // Try to get WiFi info from browser (limited support)
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

      // Try to get WiFi SSID from browser (very limited support - mainly Android)
      let detectedSSID = "auto-detected";

      // Check if NetworkInformation API is available
      if (connection && 'effectiveType' in connection) {
        // Only works on some Android devices with Chrome
        try {
          // @ts-ignore - experimental API
          if (navigator.connection?.ssid) {
            detectedSSID = navigator.connection.ssid;
          }
        } catch (e) {
          console.log("SSID detection not available");
        }
      }

      // Backend sẽ tự động lấy IP từ request.client.host
      setWifiInfo({
        ip: "auto-detected",
        ssid: detectedSSID,
        effectiveType: connection?.effectiveType || "unknown"
      });

      setWifiError(null);
    } catch (error) {
      console.error("Error checking WiFi:", error);
      setWifiError("Không thể kiểm tra kết nối mạng. Vui lòng đảm bảo bạn đã kết nối WiFi công ty.");
    } finally {
      setCheckingWifi(false);
    }
  };

  const handleCheckAttendance = async () => {
    if (!pin || pin.length !== 4) {
      antdMessage.error("Vui lòng nhập mã PIN 4 số");
      return;
    }

    if (!wifiInfo) {
      antdMessage.error("Chưa kiểm tra được kết nối mạng");
      return;
    }

    // Kiểm tra xem thiết bị này đã chấm công với PIN khác chưa
    if (checkedInInfo && checkedInInfo.pin !== pin) {
      antdMessage.error("Thiết bị này đã được sử dụng để chấm công với mã PIN khác. Mỗi thiết bị chỉ được chấm công 1 mã PIN.");
      return;
    }

    setLoading(true);

    try {
      const response = await attendanceAPI.publicCheckAttendance({
        qr_token: qrToken,
        pin: pin,
        wifi_ssid: wifiInfo.ssid || "auto-detected", // Use detected SSID if available
        wifi_bssid: null,
        ip_address: wifiInfo.ip,
      });

      const { action, message, check_in_time, check_out_time } = response.data;

      antdMessage.success(message, 5);

      if (action === "check_in") {
        const checkInTimeStr = new Date(check_in_time).toLocaleTimeString('vi-VN');
        antdMessage.info(`Giờ vào: ${checkInTimeStr}`, 5);

        // Lưu trạng thái đã chấm công vào
        saveCheckedInStatus(pin, check_in_time);

        // Update action type for next scan
        if (actionType === "attendance") {
          setActionType("attendance"); // Will auto-detect as check_out next time
        }
      } else if (action === "check_out") {
        const checkOutTimeStr = new Date(check_out_time).toLocaleTimeString('vi-VN');
        antdMessage.info(`Giờ ra: ${checkOutTimeStr}`, 5);

        // Xóa trạng thái đã chấm công sau khi chấm ra
        const deviceId = getDeviceFingerprint();
        const storageKey = `attendance_${deviceId}`;
        localStorage.removeItem(storageKey);
        setCheckedInInfo(null);
      }

      // Clear PIN only
      setPin("");

    } catch (error) {
      const errorMsg = error.response?.data?.detail || "Chấm công thất bại";
      antdMessage.error(errorMsg, 5);
    } finally {
      setLoading(false);
    }
  };

  if (!qrToken || !actionType) {
    return (
      <div style={{ padding: 24, maxWidth: 500, margin: "0 auto" }}>
        <Alert
          message="Link không hợp lệ"
          description="Vui lòng quét lại mã QR để chấm công"
          type="error"
          showIcon
        />
      </div>
    );
  }

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
        styles={{ body: { padding: "24px 16px" } }}
      >
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <ClockCircleOutlined style={{ fontSize: 56, color: "#667eea" }} />
          <Title level={2} style={{ marginTop: 12, marginBottom: 8, fontSize: "24px" }}>
            Chấm công
          </Title>
          <Text type="secondary" style={{ fontSize: "14px" }}>
            {actionType === "attendance"
              ? "Tự động nhận diện Vào/Tan ca"
              : actionType === "check_in"
                ? "Vào ca"
                : "Tan ca"}
          </Text>
        </div>

        {checkingWifi ? (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <Spin size="large" />
            <div style={{ marginTop: 12 }}>
              <Text type="secondary" style={{ fontSize: "14px" }}>Đang kiểm tra kết nối WiFi...</Text>
            </div>
          </div>
        ) : (
          <Space direction="vertical" style={{ width: "100%" }} size="middle">
            {checkedInInfo && (
              <Alert
                message={<span style={{ fontSize: "14px" }}>Đã chấm công vào ca</span>}
                description={
                  <div style={{ fontSize: "13px" }}>
                    <div>Giờ vào: {new Date(checkedInInfo.checkInTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                    <div style={{ fontSize: 12, marginTop: 4, opacity: 0.8 }}>
                      Thiết bị này đã chấm công với mã PIN {checkedInInfo.pin.replace(/./g, '•')}
                    </div>
                  </div>
                }
                type="info"
                showIcon
                icon={<CheckCircleOutlined />}
                style={{ backgroundColor: '#e6f7ff', border: '1px solid #91d5ff' }}
              />
            )}

            {wifiError && (
              <Alert
                message={<span style={{ fontSize: "14px" }}>Cảnh báo kết nối</span>}
                description={<span style={{ fontSize: "13px" }}>{wifiError}</span>}
                type="warning"
                showIcon
                icon={<WifiOutlined />}
                action={
                  <Button size="small" onClick={checkWifiConnection}>
                    Thử lại
                  </Button>
                }
              />
            )}

            <div>
              <Text strong style={{ fontSize: 15 }}>
                <LockOutlined /> Mã PIN chấm công
              </Text>
              <Input.Password
                size="large"
                placeholder="Nhập mã PIN 4 số"
                value={pin}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  if (value.length <= 4) {
                    setPin(value);
                  }
                }}
                maxLength={4}
                style={{ marginTop: 8, fontSize: 20, textAlign: "center", letterSpacing: "6px" }}
                autoFocus
              />
              <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 8 }}>
                Nhập mã PIN cá nhân của bạn để chấm công
              </Text>
            </div>

            <Button
              type="primary"
              size="large"
              onClick={handleCheckAttendance}
              loading={loading}
              disabled={pin.length !== 4}
              block
              style={{
                height: 50,
                fontSize: 16,
                fontWeight: 600,
                borderRadius: 8
              }}
            >
              {actionType === "attendance"
                ? "Chấm công ngay"
                : actionType === "check_in"
                  ? "Vào ca ngay"
                  : "Tan ca ngay"}
            </Button>
          </Space>
        )}
      </Card>
    </div>
  );
}
