import { useState, useEffect } from 'react';
import { Card, Table, Button, Label, TextInput, Textarea, Badge, ToggleSwitch } from 'flowbite-react';
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
            setReceiptTypes(response.data.data);
            setTotalItems(response.data.meta.total);
        } catch (error) {
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
        if (window.confirm('Bạn có chắc muốn xóa loại phiếu này?')) {
            try {
                await receiptTypeAPI.delete(id);
                toast.success('Xóa loại phiếu thành công');
                fetchReceiptTypes(currentPage);
            } catch (error: any) {
                toast.error(error.response?.data?.detail || 'Xóa loại phiếu thất bại');
            }
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
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Thao tác thất bại');
        }
    };

    // Pagination logic
    const onPageChange = (page: number) => setCurrentPage(page);
    const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
    const indexOfLastItem = Math.min(indexOfFirstItem + itemsPerPage, totalItems);
    const currentReceiptTypes = receiptTypes;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Quản lý loại phiếu thu/chi
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Danh mục các loại phiếu thu chi trong hệ thống
                    </p>
                </div>
                <Button onClick={handleCreate} color="blue">
                    ➕ Thêm loại phiếu
                </Button>
            </div>

            {/* Table */}
            <Card>
                <div className="overflow-x-auto">
                    <Table>
                        <Table.Head>
                            <Table.HeadCell>Tên loại phiếu</Table.HeadCell>
                            <Table.HeadCell>Mô tả</Table.HeadCell>
                            <Table.HeadCell>Trạng thái</Table.HeadCell>
                            <Table.HeadCell>Ngày tạo</Table.HeadCell>
                            <Table.HeadCell>
                                <span className="sr-only">Actions</span>
                            </Table.HeadCell>
                        </Table.Head>
                        <Table.Body className="divide-y">
                            {loading ? (
                                <Table.Row>
                                    <Table.Cell colSpan={5} className="text-center py-8">
                                        <div className="flex justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        </div>
                                    </Table.Cell>
                                </Table.Row>
                            ) : receiptTypes.length === 0 ? (
                                <Table.Row>
                                    <Table.Cell colSpan={5} className="text-center py-8 text-gray-500">
                                        Chưa có loại phiếu nào
                                    </Table.Cell>
                                </Table.Row>
                            ) : (
                                currentReceiptTypes.map((type) => (
                                    <Table.Row key={type.id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                                        <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                                            <div className="flex items-center gap-2">
                                                <strong>{type.name}</strong>
                                            </div>
                                        </Table.Cell>
                                        <Table.Cell className="text-gray-600 dark:text-gray-400">
                                            {type.description || '-'}
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Badge color={type.is_active ? 'success' : 'gray'}>
                                                {type.is_active ? 'Hoạt động' : 'Vô hiệu hóa'}
                                            </Badge>
                                        </Table.Cell>
                                        <Table.Cell className="text-gray-600 dark:text-gray-400">
                                            {type.created_at ? formatDateTime(type.created_at) : '-'}
                                        </Table.Cell>
                                        <Table.Cell>
                                            <div className="flex gap-2">
                                                <Button size="xs" color="info" onClick={() => handleEdit(type)}>
                                                    ✏️ Sửa
                                                </Button>
                                                <Button size="xs" color="failure" onClick={() => handleDelete(type.id)}>
                                                    🗑️ Xóa
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
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                        <span className="text-sm text-blue-700 dark:text-blue-400">
                            Hiển thị từ {indexOfFirstItem + 1} đến {Math.min(indexOfLastItem, receiptTypes.length)} trên tổng {receiptTypes.length}
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
                                <Label htmlFor="name" value="Tên loại phiếu" />
                                <TextInput
                                    id="name"
                                    type="text"
                                    placeholder="Ví dụ: Tiền điện, Tiền nước, Doanh thu vé..."
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label htmlFor="description" value="Mô tả (không bắt buộc)" />
                                <Textarea
                                    id="description"
                                    placeholder="Nhập mô tả chi tiết về loại phiếu này"
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="mt-1"
                                />
                            </div>

                            <div className="flex items-center gap-2">
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
                    <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
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
