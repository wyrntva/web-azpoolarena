import { useState, useEffect } from 'react';
import { Card, Alert, Spinner } from 'flowbite-react';
import { useSearchParams, useNavigate } from 'react-router';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://192.168.1.188:8000';

const QRAccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [validating, setValidating] = useState(true);
    const [validationResult, setValidationResult] = useState<any>(null);
    const [expiresIn, setExpiresIn] = useState<number | null>(null);

    const accessToken = searchParams.get('token');

    useEffect(() => {
        if (!accessToken) {
            setValidating(false);
            setValidationResult({
                valid: false,
                message: 'Link không hợp lệ. Vui lòng quét lại mã QR.',
                error_code: 'MISSING_TOKEN',
            });
            return;
        }

        validateToken();

        const handleCopy = (e: any) => e.preventDefault();
        document.addEventListener('copy', handleCopy);
        document.addEventListener('contextmenu', (e) => e.preventDefault());

        return () => {
            document.removeEventListener('copy', handleCopy);
        };
    }, [accessToken]);

    useEffect(() => {
        if (expiresIn && expiresIn > 0 && validationResult?.valid) {
            const timer = setInterval(() => {
                setExpiresIn((prev) => {
                    if (prev && prev <= 1) {
                        clearInterval(timer);
                        setValidationResult({
                            valid: false,
                            message: 'Mã QR đã hết hạn',
                            error_code: 'TOKEN_EXPIRED',
                        });
                        return 0;
                    }
                    return (prev || 0) - 1;
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

                try {
                    await axios.post(`${API_BASE_URL}/api/qr-access/consume`, { access_token: accessToken });
                } catch (e) { }

                setTimeout(() => {
                    navigate(`/mobile-attendance?token=${accessToken}&type=attendance`);
                }, 2000);
            }
        } catch (error: any) {
            setValidationResult({
                valid: false,
                message: error.response?.data?.message || 'Không thể xác thực mã QR',
                error_code: error.response?.data?.error_code || 'VALIDATION_ERROR',
            });
        } finally {
            setValidating(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center p-4">
            <Card className="max-w-md w-full shadow-xl">
                {validating ? (
                    <div className="text-center py-10 space-y-4">
                        <Spinner size="xl" />
                        <p className="text-lg font-bold text-gray-700">Đang xác thực mã QR...</p>
                        <p className="text-sm text-gray-500">Vui lòng đợi trong giây lát</p>
                    </div>
                ) : !validationResult?.valid ? (
                    <div className="text-center py-6 space-y-4">
                        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-3xl">
                            ❌
                        </div>
                        <h2 className="text-xl font-bold text-red-600">Mã QR không hợp lệ</h2>
                        <p className="text-gray-600">{validationResult?.message || 'Vui lòng quét lại mã QR mới'}</p>
                        <Alert color="info" className="text-left mt-6">
                            <ul className="text-xs space-y-1 list-disc list-inside">
                                <li>Mỗi mã QR chỉ dùng được 1 lần</li>
                                <li>Mã QR có thời hạn (thường 60 giây)</li>
                                <li>Vui lòng yêu cầu tạo mã QR mới tại máy quản lý</li>
                            </ul>
                        </Alert>
                    </div>
                ) : (
                    <div className="text-center py-6 space-y-4">
                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl">
                            ✅
                        </div>
                        <h2 className="text-xl font-bold text-green-600">Xác thực thành công!</h2>
                        <p className="text-gray-600">Đang chuyển đến trang chấm công...</p>

                        {expiresIn !== null && expiresIn > 0 && (
                            <div className="mt-4">
                                <p className="text-xs text-gray-400">Thời gian còn lại:</p>
                                <p className={`text-4xl font-black mt-1 ${expiresIn <= 10 ? 'text-red-500' : 'text-green-500'}`}>
                                    {formatTime(expiresIn)}
                                </p>
                            </div>
                        )}
                        <div className="pt-4"><Spinner /></div>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default QRAccess;
