import React, { useState, useEffect } from 'react';
import { Card, Button, Modal, Label, TextInput, Alert, Spinner } from 'flowbite-react';
import { Icon } from '@iconify/react';
import { deviceAPI, DeviceListItem } from '../../../api/device.api';

const Devices: React.FC = () => {
    const [devices, setDevices] = useState<DeviceListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    // Form state
    const [deviceName, setDeviceName] = useState('');
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);
    const [createSuccess, setCreateSuccess] = useState(false);

    // Load devices
    useEffect(() => {
        loadDevices();
    }, []);

    const loadDevices = async () => {
        try {
            setLoading(true);
            const response = await deviceAPI.getAll();
            setDevices(response.data);
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAddModal = () => {
        setDeviceName('');
        setGeneratedCode(null);
        setCreateError(null);
        setCreateSuccess(false);
        setShowAddModal(true);
    };

    const handleGenerateCode = async () => {
        if (!deviceName.trim()) {
            setCreateError('Vui lòng nhập tên thiết bị');
            return;
        }

        try {
            setIsCreating(true);
            setCreateError(null);

            const response = await deviceAPI.createDeviceCode({
                deviceName: deviceName.trim()
            });

            if (response.data.success) {
                setGeneratedCode(response.data.deviceCode);
                setCreateSuccess(true);
                // Reload devices list
                await loadDevices();
            }
        } catch (error: any) {
            setCreateError(error.response?.data?.detail || 'Không thể tạo mã thiết bị');
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteDevice = async (deviceId: number) => {
        if (!confirm('Bạn có chắc chắn muốn xóa thiết bị này?')) {
            return;
        }

        try {
            await deviceAPI.delete(deviceId);
            await loadDevices();
        } catch (error) {
            alert('Không thể xóa thiết bị');
        }
    };

    const handleCloseModal = () => {
        setShowAddModal(false);
        setDeviceName('');
        setGeneratedCode(null);
        setCreateError(null);
        setCreateSuccess(false);
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Quản lý thiết bị
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Quản lý các thiết bị thu ngân (POS)
                        </p>
                    </div>
                    <Button color="blue" onClick={handleOpenAddModal}>
                        <Icon icon="solar:add-circle-bold" className="mr-2 h-5 w-5" />
                        Thêm thiết bị
                    </Button>
                </div>

                <div className="grid gap-4">
                    <Card>
                        <div className="overflow-x-auto">
                            {loading ? (
                                <div className="flex justify-center py-8">
                                    <Spinner size="xl" />
                                </div>
                            ) : devices.length === 0 ? (
                                <div className="text-center py-12">
                                    <Icon icon="solar:devices-outline" className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                        Chưa có thiết bị nào
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                                        Thêm thiết bị đầu tiên để bắt đầu
                                    </p>
                                    <Button color="blue" onClick={handleOpenAddModal}>
                                        <Icon icon="solar:add-circle-bold" className="mr-2 h-5 w-5" />
                                        Thêm thiết bị
                                    </Button>
                                </div>
                            ) : (
                                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                        <tr>
                                            <th scope="col" className="px-6 py-3">Tên thiết bị</th>
                                            <th scope="col" className="px-6 py-3">Mã thiết bị</th>
                                            <th scope="col" className="px-6 py-3">Loại</th>
                                            <th scope="col" className="px-6 py-3">Trạng thái</th>
                                            <th scope="col" className="px-6 py-3">Thông tin</th>
                                            <th scope="col" className="px-6 py-3">Ngày tạo</th>
                                            <th scope="col" className="px-6 py-3">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {devices.map((device) => (
                                            <tr key={device.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                                    {device.device_name}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-1">
                                                        {device.device_code.split('').map((char, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="w-8 h-10 flex items-center justify-center bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
                                                            >
                                                                <span className="text-sm font-bold text-green-600 dark:text-green-400">
                                                                    {char}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded dark:bg-blue-900 dark:text-blue-300">
                                                        {device.device_type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {device.is_activated ? (
                                                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded dark:bg-green-900 dark:text-green-300">
                                                            Đã kích hoạt
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded dark:bg-yellow-900 dark:text-yellow-300">
                                                            Chưa kích hoạt
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {device.is_activated && device.device_os ? (
                                                        <div className="text-xs">
                                                            <div className="font-medium">{device.device_os}</div>
                                                            {device.device_app_version && (
                                                                <div className="text-gray-500">v{device.device_app_version}</div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-xs">
                                                    {new Date(device.created_at).toLocaleString('vi-VN')}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Button
                                                        size="xs"
                                                        color="failure"
                                                        onClick={() => handleDeleteDevice(device.id)}
                                                    >
                                                        <Icon icon="solar:trash-bin-trash-bold" className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </Card>
                </div>
            </div>

            {/* Add Device Modal */}
            <Modal show={showAddModal} onClose={handleCloseModal} size="lg">
                <div className="relative bg-white dark:bg-gray-800 rounded-[2rem] overflow-hidden">
                    <div className="p-8 pb-4 flex justify-between items-center">
                        <h3 className="text-2xl font-black italic text-[#1e266d] dark:text-blue-400 uppercase tracking-wide">
                            Thêm thiết bị mới
                        </h3>
                        <button
                            onClick={handleCloseModal}
                            className="text-gray-300 hover:text-gray-500 transition-colors"
                        >
                            <Icon icon="solar:close-circle-linear" className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="px-10 py-4 space-y-6">
                        {createSuccess ? (
                            <Alert color="success" icon={() => <Icon icon="solar:check-circle-bold" className="w-5 h-5" />} className="rounded-2xl">
                                <div className="font-bold mb-2">Tạo thiết bị thành công!</div>
                                <div className="text-sm">
                                    Mã thiết bị <span className="font-mono font-bold">{generatedCode}</span> đã được tạo.
                                    Sử dụng mã này để kích hoạt phần mềm thu ngân.
                                </div>
                            </Alert>
                        ) : (
                            <>
                                <div className="space-y-3">
                                    <Label htmlFor="deviceName" className="text-[15px] font-bold text-gray-800 dark:text-gray-300 ml-1">
                                        Tên thiết bị <span className="text-red-500">*</span>
                                    </Label>
                                    <TextInput
                                        id="deviceName"
                                        placeholder="VD: Thu ngân tầng 1"
                                        value={deviceName}
                                        onChange={(e) => setDeviceName(e.target.value)}
                                        disabled={isCreating}
                                        className="[&>div>input]:rounded-full [&>div>input]:py-3.5 [&>div>input]:px-6 [&>div>input]:border-gray-200 [&>div>input]:placeholder:text-gray-400 [&>div>input]:text-gray-700"
                                    />
                                    <p className="text-xs text-gray-500 ml-2">
                                        Đặt tên mô tả cho thiết bị để dễ quản lý
                                    </p>
                                </div>

                                {generatedCode && (
                                    <div className="pt-2">
                                        <div className="h-px bg-gray-100 w-full mb-6"></div>
                                        <Label className="text-[15px] font-bold text-gray-800 dark:text-gray-300 ml-1 mb-4 block">
                                            Mã thiết bị bằng tự số
                                        </Label>

                                        <div className="flex-1 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-[2rem] p-6 shadow-sm flex justify-center gap-2">
                                            {generatedCode.split('').map((char, idx) => (
                                                <div
                                                    key={idx}
                                                    className="w-14 h-18 flex items-center justify-center bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-[2.5rem] shadow-sm"
                                                >
                                                    <span className="text-3xl font-bold text-[#006d44] dark:text-green-400">
                                                        {char}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {createError && (
                                    <Alert color="failure" icon={() => <Icon icon="solar:danger-circle-bold" className="w-5 h-5" />} className="rounded-2xl">
                                        {createError}
                                    </Alert>
                                )}
                            </>
                        )}
                    </div>

                    <div className="p-10 pt-6 flex gap-5">
                        <button
                            onClick={handleCloseModal}
                            className="flex-1 rounded-2xl py-3.5 font-bold text-gray-700 border border-gray-200 hover:bg-gray-50 transition-all text-base"
                        >
                            {createSuccess ? 'Đóng' : 'Hủy'}
                        </button>
                        {!createSuccess && (
                            <button
                                onClick={handleGenerateCode}
                                disabled={isCreating || !deviceName.trim()}
                                className="flex-[1.5] rounded-2xl py-3.5 font-bold bg-[#8ea8ed] text-white hover:bg-blue-500 transition-all shadow-md shadow-blue-200/50 flex items-center justify-center gap-2 text-base disabled:bg-gray-300 disabled:shadow-none"
                            >
                                {isCreating ? (
                                    <Spinner size="sm" />
                                ) : (
                                    <Icon icon="solar:add-circle-bold" className="h-5 w-5" />
                                )}
                                Tạo thiết bị
                            </button>
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Devices;
