import { useState, useEffect } from 'react';
import { Card, Table, Button, Label, TextInput, Textarea, ToggleSwitch, Spinner } from 'flowbite-react';
import toast from 'react-hot-toast';
import { receiptTypeAPI } from '../../api/receiptType.api';
import BaseDialog from '../../components/shared/BaseDialog';

interface Category {
    id: number;
    name: string;
    description?: string;
    is_active: boolean;
    is_inventory: boolean;
}

const WarehouseSetup = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        is_active: true,
        is_inventory: true,
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const response = await receiptTypeAPI.getAll();
            // receiptTypeAPI.getAll returns PaginatedResponse<ReceiptType>
            const inventoryCategories = response.data.data.filter((cat: Category) => cat.is_inventory === true);
            setCategories(inventoryCategories);
        } catch (_error) {
            toast.error('Không thể tải danh sách danh mục');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingCategory(null);
        setFormData({ name: '', description: '', is_active: true, is_inventory: true });
        setModalOpen(true);
    };

    const handleEdit = (category: Category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            description: category.description || '',
            is_active: category.is_active,
            is_inventory: category.is_inventory,
        });
        setModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Bạn có chắc muốn xóa danh mục này?')) {
            try {
                await receiptTypeAPI.delete(id);
                toast.success('Xóa danh mục thành công');
                fetchCategories();
            } catch (error) {
                toast.error((error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Xóa danh mục thất bại');
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error('Vui lòng nhập tên danh mục');
            return;
        }

        try {
            if (editingCategory) {
                await receiptTypeAPI.update(editingCategory.id, formData);
                toast.success('Cập nhật thành công');
            } else {
                await receiptTypeAPI.create(formData);
                toast.success('Thêm thành công');
            }
            setModalOpen(false);
            fetchCategories();
        } catch (error) {
            toast.error((error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Thao tác thất bại');
        }
    };

    return (
        <div className="pt-0 px-6 pb-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-[16px] font-semibold uppercase text-[#37393E] dark:text-white flex items-center gap-2">
                        DANH MỤC KHO HÀNG
                    </h1>
                </div>
                <button
                    onClick={handleCreate}
                    className="bg-[#C6010B] hover:bg-[#C6010B]/90 text-white font-medium px-4 py-2.5 rounded-[24px] flex items-center justify-center transition-colors cursor-pointer"
                >
                    Thêm danh mục
                </button>
            </div>

            <Card>
                <div className="overflow-x-auto">
                    <Table>
                        <Table.Head>
                            <Table.HeadCell>Tên danh mục</Table.HeadCell>
                            <Table.HeadCell>Mô tả</Table.HeadCell>
                            <Table.HeadCell>Trạng thái</Table.HeadCell>
                            <Table.HeadCell>
                                <span className="sr-only">Actions</span>
                            </Table.HeadCell>
                        </Table.Head>
                        <Table.Body className="divide-y">
                            {loading ? (
                                <Table.Row>
                                    <Table.Cell colSpan={4} className="text-center py-8">
                                        <Spinner />
                                    </Table.Cell>
                                </Table.Row>
                            ) : categories.length === 0 ? (
                                <Table.Row>
                                    <Table.Cell colSpan={4} className="text-center py-8 text-gray-500">
                                        Chưa có danh mục nào
                                    </Table.Cell>
                                </Table.Row>
                            ) : (
                                categories.map((cat) => (
                                    <Table.Row key={cat.id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                                        <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                                            <strong>{cat.name}</strong>
                                        </Table.Cell>
                                        <Table.Cell className="text-gray-600 dark:text-gray-400">
                                            {cat.description || '-'}
                                        </Table.Cell>
                                        <Table.Cell>
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${cat.is_active
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {cat.is_active ? 'Hoạt động' : 'Vô hiệu'}
                                            </span>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <div className="flex gap-2">
                                                <Button size="xs" color="info" onClick={() => handleEdit(cat)}>
                                                    Sửa
                                                </Button>
                                                <Button size="xs" color="failure" onClick={() => handleDelete(cat.id)}>
                                                    Xóa
                                                </Button>
                                            </div>
                                        </Table.Cell>
                                    </Table.Row>
                                ))
                            )}
                        </Table.Body>
                    </Table>
                </div>
            </Card>

            <BaseDialog
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editingCategory ? 'Chỉnh sửa' : 'Thêm danh mục'}
                showFooter={false}
            >
                <form onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div>
                                <Label value="Tên danh mục" />
                                <TextInput
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder="VD: Nước giải khát, Thuốc lá..."
                                />
                            </div>
                            <div>
                                <Label value="Mô tả" />
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <ToggleSwitch
                                    checked={formData.is_active}
                                    onChange={(checked) => setFormData({ ...formData, is_active: checked })}
                                    label="Đang hoạt động"
                                />
                            </div>
                        </div>
                    <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                        <Button type="submit" color="blue">Lưu</Button>
                        <Button type="button" color="gray" onClick={() => setModalOpen(false)}>Hủy</Button>
                    </div>
                </form>
            </BaseDialog>
        </div>
    );
};

export default WarehouseSetup;
