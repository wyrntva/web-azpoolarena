import { useState, useEffect } from 'react';
import { Card, Button, Label, TextInput, Alert } from 'flowbite-react';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router';
import { attendanceAPI } from '../../api/attendance.api';

const MobileAttendance = () => {
    const [searchParams] = useSearchParams();
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [actionType, setActionType] = useState<string | null>(null);
    const [checkedInInfo, setCheckedInInfo] = useState<any>(null);

    const qrToken = searchParams.get('token');
    const initialType = searchParams.get('type'); // check_in, check_out, or attendance

    useEffect(() => {
        if (!qrToken || !initialType) {
            toast.error('Link không hợp lệ. Vui lòng quét lại mã QR.');
            return;
        }
        setActionType(initialType);
        loadCheckedInStatus();
    }, [qrToken, initialType]);

    const getDeviceFingerprint = () => {
        const userAgent = navigator.userAgent;
        const platform = navigator.platform;
        const language = navigator.language;
        return btoa(`${userAgent}-${platform}-${language}`);
    };

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

                if (hoursDiff >= 8) {
                    localStorage.removeItem(storageKey);
                    setCheckedInInfo(null);
                } else if (data.pin) {
                    setCheckedInInfo(data);
                }
            }
        } catch (error) { }
    };

    const saveCheckedInStatus = (pin: string, checkInTime: string) => {
        try {
            const deviceId = getDeviceFingerprint();
            const storageKey = `attendance_${deviceId}`;
            const data = { pin, checkInTime, deviceId };
            localStorage.setItem(storageKey, JSON.stringify(data));
            setCheckedInInfo(data);
        } catch (error) { }
    };

    const handleCheckAttendance = async () => {
        if (!pin || pin.length !== 4) {
            toast.error('Vui lòng nhập mã PIN 4 số');
            return;
        }

        if (checkedInInfo && checkedInInfo.pin !== pin) {
            toast.error('Thiết bị này đã được sử dụng để chấm công với mã PIN khác.');
            return;
        }

        setLoading(true);
        try {
            const response = await attendanceAPI.publicCheckAttendance({
                qr_token: qrToken || '',
                pin: pin,
                wifi_ssid: null,
                wifi_bssid: null,
                ip_address: null,
            });

            const { action, message, check_in_time } = response.data;
            toast.success(message);

            if (action === 'check_in') {
                saveCheckedInStatus(pin, check_in_time);
            } else if (action === 'check_out') {
                const deviceId = getDeviceFingerprint();
                localStorage.removeItem(`attendance_${deviceId}`);
                setCheckedInInfo(null);
            }
            setPin('');
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Chấm công thất bại');
        } finally {
            setLoading(false);
        }
    };

    if (!qrToken || !actionType) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <Alert color="failure" withBorderAccent>
                    <span>
                        <span className="font-medium">Link không hợp lệ!</span> Vui lòng quét lại mã QR từ màn hình quản lý.
                    </span>
                </Alert>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center p-4">
            <Card className="max-w-md w-full shadow-2xl">
                <div className="text-center space-y-2">

                    <h1 className="text-2xl font-bold text-gray-900">Chấm công</h1>
                    <p className="text-sm text-gray-500">
                        {actionType === 'attendance' ? 'Tự động nhận diện Vào/Tan ca' : actionType === 'check_in' ? 'Vào ca' : 'Tan ca'}
                    </p>
                </div>

                {checkedInInfo && (
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg my-4">
                        <div className="flex items-center gap-2 text-blue-800 font-bold mb-1">
                            Đã chấm công vào ca
                        </div>
                        <p className="text-sm text-blue-600">Giờ vào: {new Date(checkedInInfo.checkInTime).toLocaleTimeString('vi-VN')}</p>
                        <p className="text-xs text-blue-400 mt-2 italic">Mã PIN: {checkedInInfo.pin.replace(/./g, '•')}</p>
                    </div>
                )}

                <div className="space-y-4 mt-4">
                    <div>
                        <Label value="Mã PIN chấm công (4 số)" className="mb-2 block" />
                        <TextInput
                            type="password"
                            placeholder="xxxx"
                            value={pin}
                            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            className="text-center text-2xl tracking-[10px]"
                            autoFocus
                        />
                    </div>

                    <Button
                        onClick={handleCheckAttendance}
                        disabled={loading || pin.length !== 4}
                        color="blue"
                        size="xl"
                        className="w-full"
                    >
                        {loading ? 'Đang xử lý...' : actionType === 'attendance' ? 'Chấm công ngay' : actionType === 'check_in' ? 'Vào ca ngay' : 'Tan ca ngay'}
                    </Button>
                </div>

                <p className="text-center text-[10px] text-gray-400 mt-6">
                    © AzPoolArena - Hệ thống quản lý thông minh
                </p>
            </Card>
        </div>
    );
};

export default MobileAttendance;
