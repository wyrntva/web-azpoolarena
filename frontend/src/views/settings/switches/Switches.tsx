import React, { useState, useEffect } from 'react';
import { Card, Button, Modal, Label, TextInput, Select, Textarea, Spinner, ToggleSwitch } from 'flowbite-react';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import { switchAPI, type SwitchItem, type CreateSwitchRequest } from '../../../api/switch.api';

// ============================================
// CONSTANTS
// ============================================

const SWITCH_CATEGORIES = [
    { value: 'light', label: 'Đèn bàn', icon: 'solar:lightbulb-bolt-outline', color: 'yellow' },
    { value: 'scoreboard', label: 'Scoreboard', icon: 'solar:monitor-smartphone-outline', color: 'blue' },
    { value: 'tv', label: 'Tivi', icon: 'solar:tv-outline', color: 'purple' },
    { value: 'ac', label: 'Điều hoà', icon: 'solar:snowflake-outline', color: 'cyan' },
    { value: 'ceiling_light', label: 'Đèn điện', icon: 'solar:lamp-outline', color: 'orange' },
    { value: 'fan', label: 'Quạt', icon: 'solar:wind-outline', color: 'teal' },
    { value: 'exhaust_fan', label: 'Quạt hút mùi', icon: 'solar:tornado-outline', color: 'rose' },
    { value: 'sign_light', label: 'Đèn biển', icon: 'solar:signpost-outline', color: 'emerald' },
    { value: 'other', label: 'Khác', icon: 'solar:widget-outline', color: 'gray' },
] as const;

function getSwitchTypeInfo(type: string) {
    return SWITCH_CATEGORIES.find((t) => t.value === type) || SWITCH_CATEGORIES[8];
}

const HARDWARE_TYPES = [
    { value: 'switch', label: 'Công tắc', icon: 'solar:lightbulb-bolt-outline' },
    { value: 'ir', label: 'Điều khiển IR', icon: 'solar:tv-outline' },
] as const;

// ============================================
// MAIN COMPONENT
// ============================================

const Switches: React.FC = () => {
    const [switches, setSwitches] = useState<SwitchItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingSwitch, setEditingSwitch] = useState<SwitchItem | null>(null);

    // Form state
    const [formData, setFormData] = useState<CreateSwitchRequest>({
        name: '',
        switch_type: 'light',
        description: '',
        device_code: null,
        port: undefined,
        area_name: 'switch',
        sort_order: 0,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isBulkToggling, setIsBulkToggling] = useState(false);

    useEffect(() => {
        loadSwitches();

        // Auto-refresh mỗi 5 giây để cập nhật trạng thái bật/tắt
        const interval = setInterval(() => {
            refreshSwitches();
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const loadSwitches = async () => {
        try {
            setLoading(true);
            const response = await switchAPI.getAll();
            setSwitches(response.data);
        } catch (error) {
            toast.error('Không thể tải danh sách công tắc');
        } finally {
            setLoading(false);
        }
    };

    // Refresh im lặng (không hiện loading spinner)
    const refreshSwitches = async () => {
        try {
            const response = await switchAPI.getAll();
            setSwitches(response.data);
        } catch {
            // Bỏ qua lỗi khi refresh nền
        }
    };

    const handleOpenAddModal = () => {
        setEditingSwitch(null);
        setFormData({
            name: '',
            switch_type: 'light',
            description: '',
            device_code: null,
            port: undefined,
            area_name: 'switch',
            sort_order: 0,
            schedule_on: null,
            schedule_off: null,
        });
        setShowAddModal(true);
    };

    const handleOpenEditModal = (sw: SwitchItem) => {
        setEditingSwitch(sw);
        setFormData({
            name: sw.name,
            switch_type: sw.switch_type,
            description: sw.description || '',
            device_code: sw.device_code || null,
            port: sw.port || undefined,
            area_name: sw.area_name || 'switch',
            sort_order: sw.sort_order,
            schedule_on: sw.schedule_on || null,
            schedule_off: sw.schedule_off || null,
        });
        setShowAddModal(true);
    };

    const handleCloseModal = () => {
        setShowAddModal(false);
        setEditingSwitch(null);
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            toast.error('Vui lòng nhập tên công tắc');
            return;
        }

        try {
            setIsSubmitting(true);

            const payload: any = {
                name: formData.name.trim(),
                switch_type: formData.switch_type,
                description: formData.description?.trim() || null,
                device_code: formData.device_code?.trim() || null,
                port: formData.area_name === 'ir' ? null : (formData.port || null),
                area_name: formData.area_name?.trim() || null,
                sort_order: formData.sort_order || 0,
                schedule_on: formData.schedule_on || null,
                schedule_off: formData.schedule_off || null,
            };

            if (editingSwitch) {
                await switchAPI.update(editingSwitch.id, payload);
                toast.success('Đã cập nhật công tắc');
            } else {
                await switchAPI.create(payload);
                toast.success('Đã tạo công tắc mới');
            }

            handleCloseModal();
            await loadSwitches();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Không thể lưu công tắc');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleActive = async (sw: SwitchItem) => {
        const oldStatus = sw.is_active;
        const newStatus = !oldStatus;

        // 1. Cập nhật UI ngay lập tức (Optimistic UI)
        setSwitches((prev) =>
            prev.map((s) => (s.id === sw.id ? { ...s, is_active: newStatus } : s)),
        );

        try {
            // 2. Gọi API ngầm
            await switchAPI.update(sw.id, { is_active: newStatus });
            toast.success(newStatus ? 'Đã bật' : 'Đã tắt');
        } catch (error) {
            // 3. Nếu lỗi thì hoàn tác lại trạng thái cũ
            setSwitches((prev) =>
                prev.map((s) => (s.id === sw.id ? { ...s, is_active: oldStatus } : s)),
            );
            toast.error('Không thể thay đổi trạng thái');
        }
    };

    const handleDelete = async (sw: SwitchItem) => {
        if (!confirm(`Bạn có chắc muốn xóa công tắc "${sw.name}"?`)) return;

        try {
            await switchAPI.delete(sw.id);
            toast.success('Đã xóa công tắc');
            await loadSwitches();
        } catch (error) {
            toast.error('Không thể xóa công tắc');
        }
    };

    const handleBulkToggle = async (turnOn: boolean, switchType?: string) => {
        // Lọc theo danh mục nếu có, chỉ lấy những switch cần đổi trạng thái
        const targetSwitches = switches.filter(
            (s) => s.is_active !== turnOn && (switchType ? s.switch_type === switchType : true),
        );
        const categoryLabel = switchType
            ? SWITCH_CATEGORIES.find((c) => c.value === switchType)?.label || switchType
            : 'Tất cả';

        if (targetSwitches.length === 0) {
            toast.success(turnOn ? `${categoryLabel} đã bật sẵn` : `${categoryLabel} đã tắt sẵn`);
            return;
        }

        // Optimistic UI: cập nhật ngay những switch cần đổi
        const targetIds = new Set(targetSwitches.map((s) => s.id));
        setSwitches((prev) =>
            prev.map((s) => (targetIds.has(s.id) ? { ...s, is_active: turnOn } : s)),
        );
        setIsBulkToggling(true);

        let failCount = 0;
        const failedIds = new Set<number>();

        await Promise.allSettled(
            targetSwitches.map(async (sw) => {
                try {
                    await switchAPI.update(sw.id, { is_active: turnOn });
                } catch {
                    failCount++;
                    failedIds.add(sw.id);
                }
            }),
        );

        // Rollback các switch lỗi
        if (failCount > 0) {
            setSwitches((prev) =>
                prev.map((s) =>
                    failedIds.has(s.id) ? { ...s, is_active: !turnOn } : s,
                ),
            );
            toast.error(`${failCount} công tắc không thể ${turnOn ? 'bật' : 'tắt'}`);
        } else {
            toast.success(turnOn ? `Đã bật toàn bộ ${categoryLabel}` : `Đã tắt toàn bộ ${categoryLabel}`);
        }

        setIsBulkToggling(false);
    };

    // Group switches by type
    const groupedSwitches = SWITCH_CATEGORIES.map((cat) => ({
        ...cat,
        items: switches.filter((s) => s.switch_type === cat.value),
    })).filter((group) => group.items.length > 0);

    return (
        <div className="p-6">
            <div className="mb-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white uppercase">
                            Thiết lập công tắc
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Quản lý các công tắc điều khiển thiết bị trong cửa hàng
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            color="green"
                            onClick={() => handleBulkToggle(true)}
                            disabled={isBulkToggling || loading || switches.length === 0}
                        >
                            <Icon icon="solar:power-bold" className="mr-2 h-5 w-5" />
                            Bật toàn bộ
                        </Button>
                        <Button
                            color="red"
                            onClick={() => handleBulkToggle(false)}
                            disabled={isBulkToggling || loading || switches.length === 0}
                        >
                            <Icon icon="solar:power-outline" className="mr-2 h-5 w-5" />
                            Tắt toàn bộ
                        </Button>
                        <Button color="blue" onClick={handleOpenAddModal}>
                            <Icon icon="solar:add-circle-bold" className="mr-2 h-5 w-5" />
                            Thêm công tắc
                        </Button>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center py-16">
                        <Spinner size="xl" />
                    </div>
                ) : switches.length === 0 ? (
                    <Card>
                        <div className="text-center py-12">
                            <Icon icon="solar:power-outline" className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                Chưa có công tắc nào
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                Thêm công tắc đầu tiên để điều khiển thiết bị
                            </p>
                            <Button color="blue" onClick={handleOpenAddModal}>
                                <Icon icon="solar:add-circle-bold" className="mr-2 h-5 w-5" />
                                Thêm công tắc
                            </Button>
                        </div>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {groupedSwitches.map((group) => (
                            <Card key={group.value}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300">
                                            {group.label}
                                        </h3>
                                        <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
                                            {group.items.length}
                                        </span>
                                    </div>
                                    {group.items.length >= 1 && (
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={() => handleBulkToggle(true, group.value)}
                                                disabled={isBulkToggling}
                                                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40 transition-colors disabled:opacity-50"
                                            >
                                                <Icon icon="solar:power-bold" className="w-3.5 h-3.5" />
                                                Bật tất cả
                                            </button>
                                            <button
                                                onClick={() => handleBulkToggle(false, group.value)}
                                                disabled={isBulkToggling}
                                                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50"
                                            >
                                                <Icon icon="solar:power-outline" className="w-3.5 h-3.5" />
                                                Tắt tất cả
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {group.items.map((sw) => (
                                        <SwitchCard
                                            key={sw.id}
                                            sw={sw}
                                            onToggle={() => handleToggleActive(sw)}
                                            onEdit={() => handleOpenEditModal(sw)}
                                            onDelete={() => handleDelete(sw)}
                                        />
                                    ))}
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            <SwitchFormModal
                show={showAddModal}
                onClose={handleCloseModal}
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                isEditing={!!editingSwitch}
            />


        </div>
    );
};

export default Switches;

// ============================================
// SUB-COMPONENT: Switch Card
// ============================================

function SwitchCard({
    sw,
    onToggle,
    onEdit,
    onDelete,
}: {
    sw: SwitchItem;
    onToggle: () => void;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const typeInfo = getSwitchTypeInfo(sw.switch_type);

    const colorClasses: Record<string, { bg: string; icon: string; activeBg: string }> = {
        yellow: {
            bg: 'bg-yellow-50 dark:bg-yellow-900/20',
            icon: 'text-yellow-500 dark:text-yellow-400',
            activeBg: 'border-yellow-200 dark:border-yellow-800',
        },
        blue: {
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            icon: 'text-blue-500 dark:text-blue-400',
            activeBg: 'border-blue-200 dark:border-blue-800',
        },
        purple: {
            bg: 'bg-purple-50 dark:bg-purple-900/20',
            icon: 'text-purple-500 dark:text-purple-400',
            activeBg: 'border-purple-200 dark:border-purple-800',
        },
        cyan: {
            bg: 'bg-cyan-50 dark:bg-cyan-900/20',
            icon: 'text-cyan-500 dark:text-cyan-400',
            activeBg: 'border-cyan-200 dark:border-cyan-800',
        },
        orange: {
            bg: 'bg-orange-50 dark:bg-orange-900/20',
            icon: 'text-orange-500 dark:text-orange-400',
            activeBg: 'border-orange-200 dark:border-orange-800',
        },
        teal: {
            bg: 'bg-teal-50 dark:bg-teal-900/20',
            icon: 'text-teal-500 dark:text-teal-400',
            activeBg: 'border-teal-200 dark:border-teal-800',
        },
        rose: {
            bg: 'bg-rose-50 dark:bg-rose-900/20',
            icon: 'text-rose-500 dark:text-rose-400',
            activeBg: 'border-rose-200 dark:border-rose-800',
        },
        emerald: {
            bg: 'bg-emerald-50 dark:bg-emerald-900/20',
            icon: 'text-emerald-500 dark:text-emerald-400',
            activeBg: 'border-emerald-200 dark:border-emerald-800',
        },
        gray: {
            bg: 'bg-gray-50 dark:bg-gray-800',
            icon: 'text-gray-500 dark:text-gray-400',
            activeBg: 'border-gray-200 dark:border-gray-700',
        },
    };

    const colors = colorClasses[typeInfo.color] || colorClasses.gray;

    return (
        <div
            className={`relative rounded-xl border-2 p-4 transition-all ${
                sw.is_active
                    ? `${colors.activeBg} ${colors.bg}`
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 opacity-60'
            }`}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors.bg}`}>
                        <Icon icon={typeInfo.icon} className={`w-5 h-5 ${colors.icon}`} />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{sw.name}</h4>
                        {sw.area_name && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">{sw.area_name}</p>
                        )}
                    </div>
                </div>
                <ToggleSwitch
                    checked={sw.is_active}
                    onChange={onToggle}
                    sizing="sm"
                />
            </div>

            {sw.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{sw.description}</p>
            )}

            {sw.device_code && (
                <div className="flex items-center gap-1 mb-3">
                    <Icon icon="solar:cpu-bolt-outline" className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        {sw.device_code}{sw.port ? ` · Kênh ${sw.port}` : ''}
                    </span>
                </div>
            )}

            {(sw.schedule_on || sw.schedule_off) && (
                <div className="flex items-center gap-1 mb-3">
                    <Icon icon="solar:clock-circle-outline" className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        {sw.schedule_on && `Bật ${sw.schedule_on}`}
                        {sw.schedule_on && sw.schedule_off && ' — '}
                        {sw.schedule_off && `Tắt ${sw.schedule_off}`}
                    </span>
                </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-gray-200/60 dark:border-gray-700/60">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    sw.is_active
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                }`}>
                    {sw.is_active ? 'Đang bật' : 'Đã tắt'}
                </span>
                <div className="flex items-center gap-1">
                    <button
                        onClick={onEdit}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                        title="Sửa"
                    >
                        <Icon icon="solar:pen-2-outline" className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                        title="Xóa"
                    >
                        <Icon icon="solar:trash-bin-trash-outline" className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================
// SUB-COMPONENT: Switch Form Modal
// ============================================

function SwitchFormModal({
    show,
    onClose,
    formData,
    setFormData,
    onSubmit,
    isSubmitting,
    isEditing,
}: {
    show: boolean;
    onClose: () => void;
    formData: CreateSwitchRequest;
    setFormData: React.Dispatch<React.SetStateAction<CreateSwitchRequest>>;
    onSubmit: () => void;
    isSubmitting: boolean;
    isEditing: boolean;
}) {
    return (
        <Modal show={show} onClose={onClose} size="lg">
            <div className="relative bg-white dark:bg-gray-800 rounded-[2rem] overflow-hidden">
                {/* Header */}
                <div className="p-8 pb-4 flex justify-between items-center">
                    <h3 className="text-2xl font-black italic text-[#1e266d] dark:text-blue-400 uppercase tracking-wide">
                        {isEditing ? 'Sửa công tắc' : 'Thêm công tắc mới'}
                    </h3>
                    <button onClick={onClose} className="text-gray-300 hover:text-gray-500 transition-colors">
                        <Icon icon="solar:close-circle-linear" className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-10 py-4 space-y-5 overflow-y-auto max-h-[70vh]">
                    {/* Tên công tắc */}
                    <div className="space-y-2">
                        <Label htmlFor="switchName" className="text-[15px] font-bold text-gray-800 dark:text-gray-300 ml-1">
                            Tên công tắc <span className="text-red-500">*</span>
                        </Label>
                        <TextInput
                            id="switchName"
                            placeholder="VD: Đèn bàn 1, Tivi khu vực A..."
                            value={formData.name}
                            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                            disabled={isSubmitting}
                            className="[&>div>input]:rounded-full [&>div>input]:py-3.5 [&>div>input]:px-6 [&>div>input]:border-gray-200 [&>div>input]:placeholder:text-gray-400 [&>div>input]:text-gray-700"
                        />
                    </div>

                    {/* Danh mục */}
                    <div className="space-y-2">
                        <Label htmlFor="switchCategory" className="text-[15px] font-bold text-gray-800 dark:text-gray-300 ml-1">
                            Danh mục
                        </Label>
                        <div className="grid grid-cols-3 gap-2">
                            {SWITCH_CATEGORIES.filter(cat => isEditing && formData.switch_type === 'scoreboard' ? cat.value === 'scoreboard' : cat.value !== 'scoreboard').map((cat) => {
                                const isSelected = formData.switch_type === cat.value;
                                return (
                                    <button
                                        key={cat.value}
                                        type="button"
                                        onClick={() => setFormData((prev) => ({ ...prev, switch_type: cat.value }))}
                                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                                            isSelected
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                                        }`}
                                    >
                                        <Icon icon={cat.icon} className={`w-6 h-6 ${isSelected ? 'text-blue-500' : 'text-gray-400'}`} />
                                        <span className={`text-xs font-medium ${isSelected ? 'text-blue-600' : 'text-gray-500'}`}>
                                            {cat.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Loại công tắc */}
                    {formData.switch_type !== 'scoreboard' && (
                        <div className="space-y-2">
                            <Label htmlFor="hardwareType" className="text-[15px] font-bold text-gray-800 dark:text-gray-300 ml-1">
                                Loại công tắc
                            </Label>
                            <div className="grid grid-cols-2 gap-2">
                                {HARDWARE_TYPES.map((ht) => {
                                    const isSelected = (formData.area_name || 'switch') === ht.value;
                                    return (
                                        <button
                                            key={ht.value}
                                            type="button"
                                            onClick={() => setFormData((prev) => ({ ...prev, area_name: ht.value }))}
                                            className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                                                isSelected
                                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                                            }`}
                                        >
                                            <Icon icon={ht.icon} className={`w-6 h-6 ${isSelected ? 'text-blue-500' : 'text-gray-400'}`} />
                                            <span className={`text-xs font-medium ${isSelected ? 'text-blue-600' : 'text-gray-500'}`}>
                                                {ht.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Mô tả */}
                    <div className="space-y-2">
                        <Label htmlFor="switchDesc" className="text-[15px] font-bold text-gray-800 dark:text-gray-300 ml-1">
                            Mô tả
                        </Label>
                        <Textarea
                            id="switchDesc"
                            placeholder="Mô tả công tắc (tùy chọn)"
                            value={formData.description || ''}
                            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                            disabled={isSubmitting}
                            rows={2}
                            className="rounded-2xl border-gray-200 placeholder:text-gray-400 text-gray-700"
                        />
                    </div>

                    {/* Mã thiết bị & Kênh relay */}
                    {formData.switch_type !== 'scoreboard' && (
                        <div className={`grid gap-3 ${formData.area_name === 'ir' ? 'grid-cols-1' : 'grid-cols-3'}`}>
                            <div className={`${formData.area_name === 'ir' ? '' : 'col-span-2'} space-y-2`}>
                                <div className="flex items-center justify-between ml-1">
                                    <Label htmlFor="switchDeviceCode" className="text-[15px] font-bold text-gray-800 dark:text-gray-300">
                                        Mã thiết bị
                                    </Label>
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                                            let result = '';
                                            for (let i = 0; i < 6; i++) {
                                                result += chars.charAt(Math.floor(Math.random() * chars.length));
                                            }
                                            setFormData(prev => ({ ...prev, device_code: result }));
                                        }}
                                        className="text-xs text-blue-500 hover:text-blue-700 font-bold flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-full transition-all"
                                    >
                                        <Icon icon="solar:magic-stick-3-bold" className="w-3.5 h-3.5" />
                                        Tạo tự động
                                    </button>
                                </div>
                                <TextInput
                                    id="switchDeviceCode"
                                    placeholder="VD: ABC123"
                                    value={formData.device_code || ''}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, device_code: e.target.value.toUpperCase() || null }))}
                                    disabled={isSubmitting}
                                    maxLength={10}
                                    className="[&>div>input]:rounded-full [&>div>input]:py-3.5 [&>div>input]:px-6 [&>div>input]:border-gray-200 [&>div>input]:placeholder:text-gray-400 [&>div>input]:text-gray-700 [&>div>input]:uppercase [&>div>input]:tracking-widest [&>div>input]:font-mono"
                                />
                            </div>
                            {formData.area_name !== 'ir' && (
                                <div className="space-y-2">
                                    <Label htmlFor="switchPort" className="text-[15px] font-bold text-gray-800 dark:text-gray-300 ml-1">
                                        Kênh relay
                                    </Label>
                                    <TextInput
                                        id="switchPort"
                                        type="number"
                                        placeholder="1, 2..."
                                        value={formData.port || ''}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                port: e.target.value ? parseInt(e.target.value) : undefined,
                                            }))
                                        }
                                        disabled={isSubmitting}
                                        className="[&>div>input]:rounded-full [&>div>input]:py-3.5 [&>div>input]:px-6 [&>div>input]:border-gray-200 [&>div>input]:placeholder:text-gray-400 [&>div>input]:text-gray-700"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Hẹn giờ bật */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between ml-1">
                            <Label className="text-[15px] font-bold text-gray-800 dark:text-gray-300">
                                <Icon icon="solar:sun-2-outline" className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                                Hẹn giờ bật
                            </Label>
                            <button
                                type="button"
                                onClick={() => {
                                    if (formData.schedule_on) {
                                        setFormData((prev) => ({ ...prev, schedule_on: null }));
                                    } else {
                                        setFormData((prev) => ({ ...prev, schedule_on: '08:00' }));
                                    }
                                }}
                                className={`text-xs font-medium px-3 py-1 rounded-full transition-all ${
                                    formData.schedule_on
                                        ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                            >
                                {formData.schedule_on ? 'Đang bật' : 'Đang tắt'}
                            </button>
                        </div>
                        {formData.schedule_on !== null && (
                            <TextInput
                                type="time"
                                value={formData.schedule_on || ''}
                                onChange={(e) => setFormData((prev) => ({ ...prev, schedule_on: e.target.value || null }))}
                                disabled={isSubmitting}
                                className="[&>div>input]:rounded-full [&>div>input]:py-3 [&>div>input]:px-6 [&>div>input]:border-gray-200 [&>div>input]:text-gray-700"
                            />
                        )}
                    </div>

                    {/* Hẹn giờ tắt */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between ml-1">
                            <Label className="text-[15px] font-bold text-gray-800 dark:text-gray-300">
                                <Icon icon="solar:moon-sleep-outline" className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                                Hẹn giờ tắt
                            </Label>
                            <button
                                type="button"
                                onClick={() => {
                                    if (formData.schedule_off) {
                                        setFormData((prev) => ({ ...prev, schedule_off: null }));
                                    } else {
                                        setFormData((prev) => ({ ...prev, schedule_off: '02:00' }));
                                    }
                                }}
                                className={`text-xs font-medium px-3 py-1 rounded-full transition-all ${
                                    formData.schedule_off
                                        ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                            >
                                {formData.schedule_off ? 'Đang bật' : 'Đang tắt'}
                            </button>
                        </div>
                        {formData.schedule_off !== null && (
                            <TextInput
                                type="time"
                                value={formData.schedule_off || ''}
                                onChange={(e) => setFormData((prev) => ({ ...prev, schedule_off: e.target.value || null }))}
                                disabled={isSubmitting}
                                className="[&>div>input]:rounded-full [&>div>input]:py-3 [&>div>input]:px-6 [&>div>input]:border-gray-200 [&>div>input]:text-gray-700"
                            />
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-10 pt-6 flex gap-5">
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-2xl py-3.5 font-bold text-gray-700 border border-gray-200 hover:bg-gray-50 transition-all text-base"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={onSubmit}
                        disabled={isSubmitting || !formData.name.trim()}
                        className="flex-[1.5] rounded-2xl py-3.5 font-bold bg-[#8ea8ed] text-white hover:bg-blue-500 transition-all shadow-md shadow-blue-200/50 flex items-center justify-center gap-2 text-base disabled:bg-gray-300 disabled:shadow-none"
                    >
                        {isSubmitting ? (
                            <Spinner size="sm" />
                        ) : (
                            <Icon icon={isEditing ? 'solar:check-circle-bold' : 'solar:add-circle-bold'} className="h-5 w-5" />
                        )}
                        {isEditing ? 'Cập nhật' : 'Tạo công tắc'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

