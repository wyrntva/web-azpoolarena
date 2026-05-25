import { useState, useEffect } from 'react';
import { Button, Card, Label, TextInput, Dropdown } from 'flowbite-react';
import { Icon } from '@iconify/react';
import { Link } from 'react-router';
import toast from 'react-hot-toast';
import BaseDialog from '../../../components/shared/BaseDialog';
import { areaAPI, AreaListItem } from '../../../api/area.api';

const Areas = () => {
    const [areas, setAreas] = useState<AreaListItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingArea, setEditingArea] = useState<AreaListItem | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '', table_count: 0 });

    useEffect(() => {
        loadAreas();
    }, []);

    const loadAreas = async () => {
        try {
            setLoading(true);
            const response = await areaAPI.getAll();
            const sorted = [...response.data].sort((a, b) => {
                const aTime = a.created_at ? new Date(a.created_at).getTime() : Number.NaN;
                const bTime = b.created_at ? new Date(b.created_at).getTime() : Number.NaN;

                if (!Number.isNaN(aTime) && !Number.isNaN(bTime) && aTime !== bTime) {
                    return aTime - bTime;
                }

                return a.id - b.id;
            });
            setAreas(sorted);
        } catch (_error) {
            toast.error('Không thể tải danh sách khu vực');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (area?: AreaListItem) => {
        if (area) {
            setEditingArea(area);
            setFormData({ name: area.name, description: area.description || '', table_count: area.table_count || 0 });
        } else {
            setEditingArea(null);
            setFormData({ name: '', description: '', table_count: 0 });
        }
        setModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast.error('Vui lòng nhập tên khu vực');
            return;
        }

        try {
            if (editingArea) {
                await areaAPI.update(editingArea.id, formData);
                toast.success('Cập nhật khu vực thành công');
            } else {
                await areaAPI.create(formData);
                toast.success('Thêm khu vực thành công');
            }
            setModalOpen(false);
            loadAreas();
        } catch (_error) {
            toast.error('Có lỗi xảy ra khi lưu khu vực');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Bạn có chắc chắn muốn xóa khu vực này?')) return;

        try {
            await areaAPI.delete(id);
            toast.success('Xóa khu vực thành công');
            loadAreas();
        } catch (_error) {
            toast.error('Có lỗi xảy ra khi xóa khu vực');
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <Link
                        to="/settings"
                        className="flex items-center text-sm text-gray-500 hover:text-blue-600 transition-colors mb-2"
                    >
                        <Icon icon="solar:alt-arrow-left-outline" className="mr-1" />
                        Quay lại thiết lập cửa hàng
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white uppercase">
                        Thiết lập bàn
                    </h1>
                </div>
                <div>
                    <Button color="blue" onClick={() => handleOpenModal()}>
                        <Icon icon="solar:add-circle-bold" className="mr-2 h-5 w-5" />
                        Thêm khu vực
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Info Panel */}
                <div className="lg:col-span-1 space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Danh sách khu vực
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Cho phép thiết lập, sắp xếp, chỉnh sửa các khu vực, bàn/ phòng trong cửa hàng.
                        </p>
                    </div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Tổng số: <span className="text-blue-600">{areas.reduce((acc, curr) => acc + (curr.table_count || 0), 0)} bàn/ phòng</span> / <span className="text-blue-600">{areas.length} khu vực</span>
                    </div>
                </div>

                {/* Right List Panel */}
                <div className="lg:col-span-2">
                    <Card className="p-0 overflow-hidden">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-base font-semibold text-blue-600">
                                Tất cả khu vực
                                <div className="h-0.5 w-full bg-blue-600 mt-2 rounded-full"></div>
                            </h3>
                        </div>

                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 grid grid-cols-12 gap-4 font-medium text-xs text-gray-500 uppercase tracking-wider">
                                <div className="col-span-8">Tên khu vực</div>
                                <div className="col-span-4 text-center">Số lượng bàn/ phòng</div>
                            </div>

                            {loading ? (
                                <div className="p-8 text-center text-gray-500">Đang tải...</div>
                            ) : areas.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">Chưa có khu vực nào</div>
                            ) : (
                                areas.map((area) => (
                                    <div key={area.id} className="p-4 grid grid-cols-12 gap-4 items-center hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors group">
                                        <div className="col-span-8 font-medium text-blue-600 dark:text-blue-400">
                                            <Link to={`/settings/areas/${area.id}`} className="hover:underline">
                                                {area.id < 10 ? `0${area.id}` : area.id}. {area.name}
                                            </Link>
                                        </div>
                                        <div className="col-span-3 text-center text-gray-900 dark:text-white font-medium">
                                            {area.table_count || 0}
                                        </div>
                                        <div className="col-span-1 flex justify-end">
                                            <Dropdown
                                                label=""
                                                dismissOnClick={false}
                                                renderTrigger={() => (
                                                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500">
                                                        <Icon icon="solar:menu-dots-bold" className="w-5 h-5 rotate-90" />
                                                    </button>
                                                )}
                                            >
                                                <Dropdown.Item onClick={() => handleOpenModal(area)} icon={() => <Icon icon="solar:pen-new-square-outline" className="mr-2 w-4 h-4" />}>
                                                    Chỉnh sửa
                                                </Dropdown.Item>
                                                <Dropdown.Item onClick={() => handleDelete(area.id)} icon={() => <Icon icon="solar:trash-bin-trash-outline" className="mr-2 w-4 h-4 text-red-600" />} className="text-red-600">
                                                    Xóa
                                                </Dropdown.Item>
                                            </Dropdown>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </div>
            </div>

            <BaseDialog
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editingArea ? "Cập nhật khu vực" : "Thêm khu vực mới"}
                onConfirm={handleSave}
                confirmText="Lưu"
            >
                <div className="space-y-4">
                    <div>
                        <div className="mb-2 block">
                            <Label htmlFor="area_name" value="Tên khu vực" />
                            <span className="text-red-500 ml-1">*</span>
                        </div>
                        <TextInput
                            id="area_name"
                            placeholder="Nhập tên khu vực"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <div className="mb-2 block">
                            <Label htmlFor="table_count" value="Số lượng bàn" />
                            <span className="text-red-500 ml-1">*</span>
                        </div>
                        <TextInput
                            id="table_count"
                            type="number"
                            placeholder="Nhập số lượng bàn"
                            value={formData.table_count}
                            onChange={(e) => setFormData({ ...formData, table_count: parseInt(e.target.value) || 0 })}
                            min={0}
                        />
                    </div>
                    <div>
                        <div className="mb-2 block">
                            <Label htmlFor="area_desc" value="Mô tả" />
                        </div>
                        <TextInput
                            id="area_desc"
                            placeholder="Nhập mô tả khu vực (tùy chọn)"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                </div>
            </BaseDialog>
        </div>
    );
};

export default Areas;
