import { useState, useEffect } from 'react';
import { Table, Button, Modal, Label, TextInput, Textarea, Spinner } from 'flowbite-react';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import CustomPagination from '../../../components/shared/CustomPagination';
import { tournamentSettingsAPI } from '../../../api/tournamentSettings.api';
import type { TournamentCoefficient } from '../../../types/api';

const CoefficientTab = () => {
    const [items, setItems] = useState<TournamentCoefficient[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<TournamentCoefficient | null>(null);
    const [formData, setFormData] = useState({
        order: 1,
        name: '',
        value: 1.0,
        description: '',
    });

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            setLoading(true);
            const response = await tournamentSettingsAPI.getCoefficients();
            setItems(response.data || []);
            setCurrentPage(1);
        } catch (error) {
            toast.error((error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Không thể tải danh sách hệ số');
        } finally {
            setLoading(false);
        }
    };

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = items.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(items.length / itemsPerPage);

    const handleCreate = () => {
        setEditing(null);
        setFormData({ order: items.length + 1, name: '', value: 1.0, description: '' });
        setModalOpen(true);
    };

    const handleEdit = (item: TournamentCoefficient) => {
        setEditing(item);
        setFormData({
            order: item.order,
            name: item.name,
            value: item.value,
            description: item.description || '',
        });
        setModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Bạn có chắc muốn xóa hệ số này?')) {
            try {
                await tournamentSettingsAPI.deleteCoefficient(id);
                toast.success('Xóa hệ số thành công');
                fetchItems();
            } catch (error) {
                toast.error((error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Không thể xóa hệ số');
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast.error('Vui lòng nhập tên hệ số');
            return;
        }
        try {
            if (editing) {
                await tournamentSettingsAPI.updateCoefficient(editing.id, formData);
                toast.success('Cập nhật hệ số thành công');
            } else {
                await tournamentSettingsAPI.createCoefficient(formData);
                toast.success('Thêm hệ số thành công');
            }
            setModalOpen(false);
            fetchItems();
        } catch (error) {
            toast.error((error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Không thể lưu hệ số');
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Quản lý hệ số</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Cấu hình các hệ số nhân điểm trong giải đấu</p>
                </div>
                <Button onClick={handleCreate} color="blue" size="sm">
                    <Icon icon="solar:add-circle-outline" className="mr-2" />
                    Thêm Hệ Số
                </Button>
            </div>

            <div className="overflow-x-auto">
                <Table hoverable>
                    <Table.Head>
                        <Table.HeadCell>ID</Table.HeadCell>
                        <Table.HeadCell>THỨ TỰ</Table.HeadCell>
                        <Table.HeadCell>TÊN HỆ SỐ</Table.HeadCell>
                        <Table.HeadCell>GIÁ TRỊ</Table.HeadCell>
                        <Table.HeadCell>MÔ TẢ</Table.HeadCell>
                        <Table.HeadCell>HÀNH ĐỘNG</Table.HeadCell>
                    </Table.Head>
                    <Table.Body className="divide-y">
                        {loading ? (
                            <Table.Row>
                                <Table.Cell colSpan={6} className="text-center py-8">
                                    <Spinner />
                                </Table.Cell>
                            </Table.Row>
                        ) : currentItems.length === 0 ? (
                            <Table.Row>
                                <Table.Cell colSpan={6} className="text-center py-8 text-gray-500">
                                    Chưa có hệ số nào
                                </Table.Cell>
                            </Table.Row>
                        ) : (
                            currentItems.map((item) => (
                                <Table.Row key={item.id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                                    <Table.Cell className="font-medium">{item.id}</Table.Cell>
                                    <Table.Cell>{item.order}</Table.Cell>
                                    <Table.Cell className="font-semibold">{item.name}</Table.Cell>
                                    <Table.Cell>
                                        <span className="font-bold text-blue-600 dark:text-blue-400">
                                            x{item.value.toFixed(2)}
                                        </span>
                                    </Table.Cell>
                                    <Table.Cell className="text-gray-500 text-sm max-w-xs truncate">
                                        {item.description || '—'}
                                    </Table.Cell>
                                    <Table.Cell>
                                        <div className="flex items-center gap-2">
                                            <Button size="xs" color="blue" onClick={() => handleEdit(item)}>
                                                <Icon icon="solar:pen-new-square-outline" className="mr-1" />
                                                Cập nhật
                                            </Button>
                                            <Button size="xs" color="failure" onClick={() => handleDelete(item.id)}>
                                                <Icon icon="solar:trash-bin-trash-outline" className="mr-1" />
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

            {items.length > 0 && (
                <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-blue-700 dark:text-blue-400">
                        Hiển thị từ {indexOfFirstItem + 1} đến {Math.min(indexOfLastItem, items.length)} trên tổng {items.length}
                    </span>
                    <CustomPagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}

            <Modal show={modalOpen} onClose={() => setModalOpen(false)}>
                <form onSubmit={handleSubmit}>
                    <Modal.Header>
                        {editing ? 'Chỉnh sửa hệ số' : 'Thêm hệ số mới'}
                    </Modal.Header>
                    <Modal.Body>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="coef-order" value="Thứ tự" />
                                    <TextInput
                                        id="coef-order"
                                        type="number"
                                        min={1}
                                        value={formData.order}
                                        onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="coef-value" value="Giá trị hệ số" />
                                    <TextInput
                                        id="coef-value"
                                        type="number"
                                        min={0}
                                        step={0.01}
                                        placeholder="VD: 1.0, 1.5, 2.0"
                                        value={formData.value}
                                        onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 1.0 })}
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="coef-name" value="Tên hệ số" />
                                <TextInput
                                    id="coef-name"
                                    type="text"
                                    placeholder="VD: Hệ số vòng loại, Hệ số chung kết..."
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    maxLength={100}
                                />
                            </div>
                            <div>
                                <Label htmlFor="coef-desc" value="Mô tả (tuỳ chọn)" />
                                <Textarea
                                    id="coef-desc"
                                    placeholder="Mô tả cách áp dụng hệ số này..."
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button type="submit" color="blue">
                            {editing ? 'Cập nhật' : 'Thêm'}
                        </Button>
                        <Button color="gray" onClick={() => setModalOpen(false)}>
                            Hủy
                        </Button>
                    </Modal.Footer>
                </form>
            </Modal>
        </div>
    );
};

export default CoefficientTab;
