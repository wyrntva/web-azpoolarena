import { useState, useEffect } from 'react';
import { Card, Button, Label, TextInput, Checkbox, ToggleSwitch } from 'flowbite-react';
import toast from 'react-hot-toast';
import { attendanceSettingsAPI } from '../../api/attendance.api';
import { formatCurrency } from '../../utils/formatters';
import type { AttendanceSettings, PenaltyTier } from '../../types/api';

const AttendanceSettings = () => {
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [settings, setSettings] = useState<AttendanceSettings | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setFetching(true);
            const response = await attendanceSettingsAPI.get();
            setSettings(response.data);
        } catch (error) {
            toast.error('Không thể tải thiết lập chấm công');
        } finally {
            setFetching(false);
        }
    };

    const handleSave = async () => {
        if (!settings) return;
        setLoading(true);
        try {
            // Basic validation
            if (settings.penalty_tiers.length === 0) {
                toast.error('Phải có ít nhất 1 mức phạt');
                return;
            }

            await attendanceSettingsAPI.update(settings);
            toast.success('Cập nhật thành công');
            fetchSettings();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Lỗi khi lưu thiết lập');
        } finally {
            setLoading(false);
        }
    };

    const addTier = () => {
        if (!settings) return;
        const newTiers = [...settings.penalty_tiers, { max_minutes: 60, penalty_amount: 100000 }];
        setSettings({ ...settings, penalty_tiers: newTiers });
    };

    const removeTier = (index: number) => {
        if (!settings) return;
        const newTiers = settings.penalty_tiers.filter((_, i) => i !== index);
        setSettings({ ...settings, penalty_tiers: newTiers });
    };

    const updateTier = (index: number, field: keyof PenaltyTier, value: any) => {
        if (!settings) return;
        const newTiers = [...settings.penalty_tiers];
        newTiers[index] = { ...newTiers[index], [field]: value };
        setSettings({ ...settings, penalty_tiers: newTiers });
    };

    if (fetching) return <div className="p-10 text-center flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Thiết lập chấm công
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Cấu hình quy tắc đi muộn, về sớm và các mức phạt tự động
                    </p>
                </div>
                <Button onClick={handleSave} color="blue" disabled={loading}>
                    {loading ? 'Đang lưu...' : 'Lưu thiết lập'}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Late Arrival Settings */}
                    <Card>
                        <h3 className="text-lg font-bold border-b pb-2 mb-4">Cài đặt đi muộn</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label value="Số phút được phép đi muộn (Grace period)" />
                                <div className="flex items-center gap-2">
                                    <TextInput
                                        type="number"
                                        className="flex-1"
                                        value={settings?.allowed_late_minutes}
                                        onChange={(e) => setSettings({ ...settings!, allowed_late_minutes: parseInt(e.target.value) })}
                                    />
                                    <span className="text-sm text-gray-500">phút</span>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">Nhân viên đi muộn trong khoảng này sẽ không bị phạt.</p>
                            </div>
                        </div>

                        <div className="mt-6">
                            <div className="flex justify-between items-center mb-4">
                                <Label value="Các mức phạt theo thời gian muộn" className="text-base font-semibold" />
                                <Button size="xs" color="gray" onClick={addTier}>+ Thêm mức</Button>
                            </div>

                            <div className="space-y-3">
                                {settings?.penalty_tiers.map((tier, idx) => (
                                    <div key={idx} className="flex flex-col md:flex-row gap-4 p-4 bg-gray-50 rounded-lg border">
                                        <div className="flex-1">
                                            <Label value={`Số phút muộn tối đa (Mức ${idx + 1})`} />
                                            <div className="flex items-center gap-2 mt-1">
                                                <TextInput
                                                    type="number"
                                                    className="flex-1"
                                                    disabled={tier.max_minutes === null}
                                                    value={tier.max_minutes === null ? '' : tier.max_minutes}
                                                    onChange={(e) => updateTier(idx, 'max_minutes', e.target.value === '' ? null : parseInt(e.target.value))}
                                                    placeholder="VD: 30"
                                                />
                                                <div className="flex items-center gap-1 min-w-[120px]">
                                                    <Checkbox
                                                        id={`unlimited-${idx}`}
                                                        checked={tier.max_minutes === null}
                                                        onChange={(e) => updateTier(idx, 'max_minutes', e.target.checked ? null : 0)}
                                                    />
                                                    <Label htmlFor={`unlimited-${idx}`} className="text-xs">Không giới hạn</Label>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <Label value="Số tiền phạt" />
                                            <div className="flex items-center gap-2 mt-1">
                                                <TextInput
                                                    type="number"
                                                    className="flex-1"
                                                    value={tier.penalty_amount}
                                                    onChange={(e) => updateTier(idx, 'penalty_amount', parseInt(e.target.value))}
                                                />
                                                <span className="text-sm text-gray-500">đ</span>
                                            </div>
                                        </div>
                                        <div className="flex items-end">
                                            <Button color="failure" size="xs" onClick={() => removeTier(idx)} disabled={(settings?.penalty_tiers.length || 0) <= 1}>Xóa</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>

                    {/* Early & Absent Settings */}
                    <Card>
                        <h3 className="text-lg font-bold border-b pb-2 mb-4">Cài đặt về sớm & Vắng mặt</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-semibold text-gray-700 mb-2">Về sớm</h4>
                                <div className="space-y-4">
                                    <div>
                                        <Label value="Phút được phép về sớm" />
                                        <TextInput
                                            type="number"
                                            value={settings?.early_checkout_grace_minutes}
                                            onChange={(e) => setSettings({ ...settings!, early_checkout_grace_minutes: parseInt(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <Label value="Tiền phạt về sớm" />
                                        <div className="flex items-center gap-2">
                                            <TextInput
                                                type="number"
                                                className="flex-1"
                                                value={settings?.early_checkout_penalty}
                                                onChange={(e) => setSettings({ ...settings!, early_checkout_penalty: parseInt(e.target.value) })}
                                            />
                                            <span className="text-sm text-gray-500">đ</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-700 mb-2">Vắng mặt</h4>
                                <div className="space-y-4">
                                    <div>
                                        <Label value="Tiền phạt vắng mặt (mỗi ca)" />
                                        <div className="flex items-center gap-2">
                                            <TextInput
                                                type="number"
                                                className="flex-1"
                                                value={settings?.absent_penalty}
                                                onChange={(e) => setSettings({ ...settings!, absent_penalty: parseInt(e.target.value) })}
                                            />
                                            <span className="text-sm text-gray-500">đ</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 pt-6">
                                        <ToggleSwitch
                                            checked={settings?.auto_absent_enabled || false}
                                            onChange={(checked) => setSettings({ ...settings!, auto_absent_enabled: checked })}
                                            label="Tự động đánh vắng"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="bg-blue-50 border-blue-200">
                        <h3 className="text-lg font-bold text-blue-800">Tóm tắt quy tắc</h3>
                        <div className="space-y-4 text-sm mt-4">
                            <div className="flex justify-between border-b border-blue-100 pb-2">
                                <span>Đi muộn cho phép:</span>
                                <span className="font-bold">{settings?.allowed_late_minutes} phút</span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-gray-500">Mức phạt đi muộn:</span>
                                {settings?.penalty_tiers.map((t, i) => (
                                    <div key={i} className="flex justify-between pl-2">
                                        <span>{t.max_minutes ? `≤ ${t.max_minutes} phút:` : 'Mức còn lại:'}</span>
                                        <span className="font-bold text-red-600">{formatCurrency(t.penalty_amount)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between border-b border-blue-100 pb-2">
                                <span>Về sớm phạt:</span>
                                <span className="font-bold text-red-600">{formatCurrency(settings?.early_checkout_penalty || 0)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Vắng mặt phạt:</span>
                                <span className="font-bold text-red-600">{formatCurrency(settings?.absent_penalty || 0)}</span>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <Label value="Ghi chú nội bộ" />
                        <textarea
                            className="mt-1 w-full border-gray-300 rounded-lg text-sm"
                            rows={4}
                            value={settings?.notes}
                            onChange={(e) => setSettings({ ...settings!, notes: e.target.value })}
                            placeholder="Ghi chú về các thay đổi chính sách..."
                        />
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default AttendanceSettings;
