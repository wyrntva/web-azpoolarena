/**
 * Table Edit Modal — edit table name, device code, and view device info.
 * Extracted from AreaDetail.tsx for maintainability.
 */
import { useState, useEffect } from 'react';
import { Label, TextInput } from 'flowbite-react';
import toast from 'react-hot-toast';
import BaseDialog from '../../../components/shared/BaseDialog';
import { areaAPI, type Table } from '../../../api/area.api';

// ============================================
// TYPES
// ============================================

interface TableEditModalProps {
    open: boolean;
    onClose: () => void;
    areaId: number;
    table: Table | null;
    onSaved: () => void;
}

// ============================================
// COMPONENT
// ============================================

const TableEditModal = ({ open, onClose, areaId, table, onSaved }: TableEditModalProps) => {
    const [formData, setFormData] = useState({ name: '', device_code: '', camera_main_stream: '', camera_sub_stream: '' });
    const [saving, setSaving] = useState(false);

    // Sync form when modal opens or table data changes
    useEffect(() => {
        if (open && table) {
            setFormData({
                name: table.name,
                device_code: table.device_code || '',
                camera_main_stream: table.camera_main_stream || '',
                camera_sub_stream: table.camera_sub_stream || '',
            });
        }
    }, [open, table]);

    const handleUpdateTableName = async () => {
        if (!table || !formData.name.trim()) return;
        try {
            setSaving(true);
            await areaAPI.updateTable(areaId, table.id, {
                name: formData.name,
                device_code: formData.device_code,
                camera_main_stream: formData.camera_main_stream,
                camera_sub_stream: formData.camera_sub_stream,
            });
            toast.success('Đã cập nhật thông tin bàn');
            onClose();
            onSaved();
        } catch (error) {
            toast.error('Không thể cập nhật thông tin bàn');
        } finally {
            setSaving(false);
        }
    };

    const generateNewDeviceCode = async () => {
        if (!table) return;
        if (table.device_activated_at) {
            const confirmed = confirm('Bàn này đã có thiết bị kết nối. Tạo mã mới sẽ ngắt kết nối thiết bị hiện tại. Bạn có chắc chắn?');
            if (!confirmed) return;
        }

        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let newCode = '';
        for (let i = 0; i < 6; i++) newCode += chars.charAt(Math.floor(Math.random() * chars.length));

        setFormData(prev => ({ ...prev, device_code: newCode }));
        try {
            setSaving(true);
            await areaAPI.updateTable(areaId, table.id, { device_code: newCode });
            toast.success('Đã tạo mã thiết bị mới');
            onSaved();
        } catch (error) {
            toast.error('Không thể tạo mã mới');
            setFormData(prev => ({ ...prev, device_code: table.device_code || '' }));
        } finally {
            setSaving(false);
        }
    };

    return (
        <BaseDialog
            open={open}
            onClose={onClose}
            title="Sửa thông tin bàn"
            onConfirm={handleUpdateTableName}
            confirmText="Cập nhật"
            loading={saving}
        >
            <div className="space-y-6">
                {/* Table Name */}
                <div>
                    <div className="mb-2 block"><Label htmlFor="table_name" value="Tên bàn" /></div>
                    <TextInput id="table_name" value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Nhập tên bàn mới" required />
                </div>

                {/* Device Code Section */}
                <DeviceCodeSection
                    code={formData.device_code}
                    onCodeChange={(code) => setFormData(prev => ({ ...prev, device_code: code }))}
                    onGenerateNew={generateNewDeviceCode}
                    isActivated={!!table?.device_activated_at}
                    originalCode={table?.device_code || ''}
                />

                {/* Device Info — only for activated devices */}
                {table?.device_activated_at && (
                    <DeviceInfoSection table={table} />
                )}

                {/* Camera URLs — only for activated devices */}
                {table?.device_activated_at && (
                    <CameraUrlSection
                        mainStream={formData.camera_main_stream}
                        subStream={formData.camera_sub_stream}
                        onMainStreamChange={(v) => setFormData(prev => ({ ...prev, camera_main_stream: v }))}
                        onSubStreamChange={(v) => setFormData(prev => ({ ...prev, camera_sub_stream: v }))}
                    />
                )}
            </div>
        </BaseDialog>
    );
};

export default TableEditModal;

// ============================================
// SUB-COMPONENT: Device Code Input
// ============================================

function DeviceCodeSection({ code, onCodeChange, onGenerateNew, isActivated, originalCode }: {
    code: string;
    onCodeChange: (code: string) => void;
    onGenerateNew: () => void;
    isActivated: boolean;
    originalCode: string;
}) {
    return (
        <div>
            <div className="mb-2 block"><Label value="Mã thiết bị bảng tỉ số" /></div>
            <div className="bg-emerald-50/30 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between gap-1 mb-2">
                    {[0, 1, 2, 3, 4, 5].map((idx) => (
                        <input
                            key={idx}
                            type="text"
                            maxLength={1}
                            value={code[idx] || ''}
                            onChange={(e) => {
                                const val = e.target.value.toUpperCase();
                                const codeArray = code.padEnd(6, ' ').split('');
                                codeArray[idx] = val || ' ';
                                onCodeChange(codeArray.join('').trimEnd());
                                if (val && e.target.nextElementSibling) {
                                    (e.target.nextElementSibling as HTMLInputElement).focus();
                                }
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Backspace' && !code[idx] && (e.target as HTMLInputElement).previousElementSibling) {
                                    ((e.target as HTMLInputElement).previousElementSibling as HTMLInputElement).focus();
                                }
                            }}
                            className="w-12 h-14 text-center text-xl font-bold text-emerald-500 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 uppercase transition-all"
                        />
                    ))}
                </div>
                <div className="flex justify-between items-center px-1">
                    <button type="button" className="text-sm text-blue-600 hover:underline">Gửi mã</button>
                    <button type="button" className="text-sm text-blue-600 hover:underline"
                        onClick={onGenerateNew}>Tạo mã mới</button>
                </div>
                {isActivated && code !== originalCode && (
                    <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-md">
                        <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1">
                            <WarningIcon />
                            Lưu ý: Thay đổi mã sẽ ngắt kết nối thiết bị hiện tại
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ============================================
// SUB-COMPONENT: Device Info
// ============================================

function DeviceInfoSection({ table }: { table: Table }) {
    const items = [
        { label: 'Loại thiết bị', value: table.device_type || 'N/A' },
        { label: 'Hệ điều hành', value: table.device_os || 'N/A' },
        { label: 'Phiên bản ứng dụng', value: table.device_app_version || 'N/A' },
        { label: 'Địa chỉ MAC', value: table.device_mac || 'N/A', mono: true },
        { label: 'Địa chỉ IP', value: table.device_ip || 'N/A', mono: true },
        { label: 'Kích hoạt lúc', value: table.device_activated_at ? new Date(table.device_activated_at).toLocaleString('vi-VN') : 'N/A' },
    ];

    return (
        <div>
            <div className="mb-2 block"><Label value="Thông tin thiết bị" /></div>
            <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400">
                        <span className="w-2 h-2 mr-1.5 bg-green-500 rounded-full animate-pulse" />
                        Đã kích hoạt
                    </span>
                </div>
                <div className="space-y-2 text-sm">
                    {items.map(({ label, value, mono }) => (
                        <div key={label} className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">{label}:</span>
                            <span className={`font-medium text-gray-900 dark:text-white ${mono ? 'font-mono text-xs' : ''}`}>
                                {value}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ============================================
// SUB-COMPONENT: Camera URL Inputs
// ============================================

function CameraUrlSection({ mainStream, subStream, onMainStreamChange, onSubStreamChange }: {
    mainStream: string;
    subStream: string;
    onMainStreamChange: (v: string) => void;
    onSubStreamChange: (v: string) => void;
}) {
    const inputTheme = { field: { input: { colors: { gray: "bg-gray-50 border-gray-300 text-gray-900 placeholder-[#8690A7] focus:border-cyan-500 focus:ring-cyan-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-[#8690A7] dark:focus:border-cyan-500 dark:focus:ring-cyan-500" } } } };

    return (
        <div>
            <div className="mb-2 block"><Label value="Camera IP" /></div>
            <div className="bg-purple-50/30 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/50 rounded-lg p-4 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Main Stream <span className="text-xs text-gray-400 font-normal">(ghi hình / DVR)</span>
                    </label>
                    <TextInput
                        value={mainStream}
                        onChange={(e) => onMainStreamChange(e.target.value)}
                        placeholder="rtsp://admin:password@192.168.1.7:554/Streaming/Channels/801"
                        sizing="sm"
                        theme={inputTheme}
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        URL RTSP chất lượng cao, dùng để ghi hình và xem lại
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Sub Stream <span className="text-xs text-gray-400 font-normal">(hiển thị trực tiếp)</span>
                    </label>
                    <TextInput
                        value={subStream}
                        onChange={(e) => onSubStreamChange(e.target.value)}
                        placeholder="rtsp://admin:password@192.168.1.7:554/Streaming/Channels/802"
                        sizing="sm"
                        theme={inputTheme}
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        URL RTSP bitrate thấp, dùng cho live stream trên bảng tỉ số
                    </p>
                </div>
            </div>
        </div>
    );
}

// ============================================
// INLINE ICON
// ============================================

function WarningIcon() {
    return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
    );
}
