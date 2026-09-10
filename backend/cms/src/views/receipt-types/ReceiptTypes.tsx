import { useState, useEffect } from 'react';
import { Card, Table, Button, Label, TextInput, Textarea, ToggleSwitch } from 'flowbite-react';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import { receiptTypeAPI } from '../../api/receiptType.api';
import { formatDateTime } from '../../utils/formatters';
import BaseDialog from '../../components/shared/BaseDialog';
import type { ReceiptType } from '../../types/api';
import CustomPagination from '../../components/shared/CustomPagination';

const ReceiptTypes = () => {
    const [receiptTypes, setReceiptTypes] = useState<ReceiptType[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingType, setEditingType] = useState<ReceiptType | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        is_active: true,
        is_inventory: false,
    });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const itemsPerPage = 50;

    useEffect(() => {
        fetchReceiptTypes(currentPage);
    }, [currentPage]);

    const fetchReceiptTypes = async (page: number) => {
        setLoading(true);
        try {
            const response = await receiptTypeAPI.getAll({
                skip: (page - 1) * itemsPerPage,
                limit: itemsPerPage,
            });
            const list = Array.isArray(response.data) ? response.data : ((response.data as any)?.data || []);
            setReceiptTypes(list);
            setTotalItems((response.data as any)?.meta?.total ?? (response.data as any)?.total ?? list.length);
        } catch (_error) {
            toast.error('Không thể tải danh sách loại phiếu');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingType(null);
        setFormData({ name: '', description: '', is_active: true, is_inventory: false });
        setModalOpen(true);
    };

    const handleEdit = (type: ReceiptType) => {
        setEditingType(type);
        setFormData({
            name: type.name,
            description: type.description || '',
            is_active: type.is_active,
            is_inventory: type.is_inventory || false,
        });
        setModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Bạn có chắc muốn xóa loại phiếu này?')) return;
        try {
            await receiptTypeAPI.delete(id);
            toast.success('Xóa loại phiếu thành công');
            fetchReceiptTypes(currentPage);
        } catch (error) {
            const detail = (error as { response?: { data?: { detail?: string; message?: string } } })?.response?.data?.detail
                || (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(detail || 'Xóa loại phiếu thất bại');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error('Vui lòng nhập tên loại phiếu');
            return;
        }

        try {
            if (editingType) {
                await receiptTypeAPI.update(editingType.id, formData);
                toast.success('Cập nhật loại phiếu thành công');
            } else {
                await receiptTypeAPI.create(formData);
                toast.success('Thêm loại phiếu thành công');
            }
            setModalOpen(false);
            setFormData({ name: '', description: '', is_active: true, is_inventory: false });
            fetchReceiptTypes(currentPage);
        } catch (error) {
            const detail = (error as { response?: { data?: { detail?: string; message?: string } } })?.response?.data?.detail
                || (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(detail || 'Thao tác thất bại');
        }
    };

    const filteredReceiptTypes = receiptTypes.filter((t) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return t.name.toLowerCase().includes(term) || (t.description || '').toLowerCase().includes(term);
    });

    const activeCount = receiptTypes.filter(t => t.is_active).length;
    const inventoryCount = receiptTypes.filter(t => t.is_inventory).length;

    // Pagination logic
    const onPageChange = (page: number) => setCurrentPage(page);
    const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
    const indexOfLastItem = Math.min(indexOfFirstItem + itemsPerPage, totalItems);
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    return (
        <div className="pt-0 px-6 pb-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-[16px] font-semibold uppercase text-[#37393E] dark:text-white flex items-center gap-2">
                        DANH MỤC LOẠI PHIẾU THU / CHI
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleCreate}
                        className="bg-[#C6010B] hover:bg-[#C6010B]/90 text-white font-medium px-4 py-2.5 rounded-[24px] flex items-center justify-center transition-colors cursor-pointer text-sm"
                    >
                        <div className="flex items-center gap-2">
                            <Icon icon="solar:add-circle-outline" className="text-xl" />
                            Thêm loại phiếu
                        </div>
                    </button>
                </div>
            </div>

            {/* Top 3 KPI Summary Boxes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <p className="text-sm md:text-[15px] font-medium text-gray-600 dark:text-gray-300">
                        Tổng số loại phiếu
                    </p>
                    <p className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-500 mt-1.5">
                        {receiptTypes.length} danh mục
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <p className="text-sm md:text-[15px] font-medium text-gray-600 dark:text-gray-300">
                        Đang hoạt động
                    </p>
                    <p className="text-xl md:text-2xl font-bold text-green-600 dark:text-green-500 mt-1.5">
                        {activeCount} danh mục
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <p className="text-sm md:text-[15px] font-medium text-gray-600 dark:text-gray-300">
                        Loại phiếu theo dõi kho
                    </p>
                    <p className="text-xl md:text-2xl font-bold text-amber-600 dark:text-amber-500 mt-1.5">
                        {inventoryCount} danh mục
                    </p>
                </div>
            </div>

            {/* Main Card with TempReport styling */}
            <Card className="overflow-hidden rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-0">
                {/* Filters & Search Toolbar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-4 border-b dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold uppercase text-gray-600 dark:text-gray-400">
                            Danh mục:
                        </span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 rounded-full">
                            {receiptTypes.length} loại
                        </span>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <TextInput
                            id="search"
                            type="text"
                            placeholder="Tìm kiếm loại phiếu, mô tả..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            icon={() => <Icon icon="solar:magnifer-outline" />}
                            className="w-full md:w-64"
                        />
                    </div>
                </div>

                {/* Main Table */}
                <div className="overflow-x-auto">
                    <Table hoverable className="w-full text-sm">
                        <Table.Head className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold uppercase text-center border-b dark:border-gray-600 text-xs tracking-wider">
                            <Table.HeadCell className="py-3.5 text-left">TÊN LOẠI PHIẾU</Table.HeadCell>
                            <Table.HeadCell className="py-3.5 text-left">MÔ TẢ</Table.HeadCell>
                            <Table.HeadCell className="py-3.5 text-center">TRẠNG THÁI</Table.HeadCell>
                            <Table.HeadCell className="py-3.5 text-center">THEO DÕI KHO</Table.HeadCell>
                            <Table.HeadCell className="py-3.5 text-left">NGÀY TẠO</Table.HeadCell>
                            <Table.HeadCell className="py-3.5 text-center">THAO TÁC</Table.HeadCell>
                        </Table.Head>
                        <Table.Body className="divide-y divide-gray-200 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
                            {loading ? (
                                <Table.Row>
                                    <Table.Cell colSpan={6} className="text-center py-12">
                                        <div className="flex justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        </div>
                                    </Table.Cell>
                                </Table.Row>
                            ) : filteredReceiptTypes.length === 0 ? (
                                <Table.Row>
                                    <Table.Cell colSpan={6} className="text-center py-12 text-gray-400">
                                        Chưa có loại phiếu nào
                                    </Table.Cell>
                                </Table.Row>
                            ) : (
                                filteredReceiptTypes.map((type) => (
                                    <Table.Row key={type.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <Table.Cell className="whitespace-nowrap font-bold text-gray-900 dark:text-white text-left py-4 text-[14px]">
                                            {type.name}
                                        </Table.Cell>
                                        <Table.Cell className="text-gray-600 dark:text-gray-300 text-left max-w-[280px] truncate py-4 text-[13px]">
                                            {type.description || '-'}
                                        </Table.Cell>
                                        <Table.Cell className="text-center whitespace-nowrap py-4">
                                            <span
                                                className={`inline-block px-3 py-1 rounded-md text-xs font-semibold ${
                                                    type.is_active
                                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                                                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                                                }`}
                                            >
                                                {type.is_active ? 'Hoạt động' : 'Tạm khóa'}
                                            </span>
                                        </Table.Cell>
                                        <Table.Cell className="text-center whitespace-nowrap py-4">
                                            <span
                                                className={`inline-block px-3 py-1 rounded-md text-xs font-medium ${
                                                    type.is_inventory
                                                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                                                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                                }`}
                                            >
                                                {type.is_inventory ? 'Có' : 'Không'}
                                            </span>
                                        </Table.Cell>
                                        <Table.Cell className="text-gray-600 dark:text-gray-300 text-left whitespace-nowrap py-4 text-[13px]">
                                            {type.created_at ? formatDateTime(type.created_at) : '-'}
                                        </Table.Cell>
                                        <Table.Cell className="text-center whitespace-nowrap py-4">
                                            <div className="flex justify-center items-center gap-2">
                                                <Button size="xs" color="light" onClick={() => handleEdit(type)} className="p-1.5 hover:bg-blue-50 border-gray-200">
                                                    <Icon icon="solar:pen-2-outline" className="text-blue-600 text-base" />
                                                </Button>
                                                <Button size="xs" color="light" onClick={() => handleDelete(type.id)} className="p-1.5 hover:bg-red-50 border-gray-200">
                                                    <Icon icon="solar:trash-bin-trash-outline" className="text-red-600 text-base" />
                                                </Button>
                                            </div>
                                        </Table.Cell>
                                    </Table.Row>
                                ))
                            )}
                        </Table.Body>
                    </Table>
                </div>

                {receiptTypes.length > 0 && (
                    <div className="flex justify-between items-center px-4 py-3.5 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
                        <span>
                            Hiển thị từ <strong>{indexOfFirstItem + 1}</strong> đến <strong>{Math.min(indexOfLastItem, receiptTypes.length)}</strong> trên tổng <strong>{receiptTypes.length}</strong>
                        </span>
                        <CustomPagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={onPageChange}
                        />
                    </div>
                )}
            </Card>

            {/* Create/Edit Modal */}
            <BaseDialog
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editingType ? 'Chỉnh sửa loại phiếu' : 'Thêm loại phiếu mới'}
                showFooter={false}
            >
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="name" value="Tên loại phiếu (*)" className="mb-1 block font-medium text-xs text-gray-700 dark:text-gray-300" />
                            <TextInput
                                id="name"
                                type="text"
                                placeholder="Ví dụ: Tiền điện, Tiền nước, Doanh thu vé..."
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="description" value="Mô tả (không bắt buộc)" className="mb-1 block font-medium text-xs text-gray-700 dark:text-gray-300" />
                            <Textarea
                                id="description"
                                placeholder="Nhập mô tả chi tiết về loại phiếu này..."
                                rows={2}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                            <ToggleSwitch
                                checked={formData.is_active}
                                onChange={(checked) => setFormData({ ...formData, is_active: checked })}
                                label="Trạng thái hoạt động"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <ToggleSwitch
                                checked={formData.is_inventory}
                                onChange={(checked) => setFormData({ ...formData, is_inventory: checked })}
                                label="Hiển thị trong quản lý kho"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-6 pt-4 border-t dark:border-gray-700">
                        <Button type="submit" color="blue">
                            {editingType ? 'Cập nhật' : 'Thêm'}
                        </Button>
                        <Button type="button" color="gray" onClick={() => setModalOpen(false)}>
                            Hủy
                        </Button>
                    </div>
                </form>
            </BaseDialog>
        </div>
    );
};

export default ReceiptTypes;
