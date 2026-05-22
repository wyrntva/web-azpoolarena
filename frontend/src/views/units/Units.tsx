import { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Label, TextInput, Textarea } from 'flowbite-react';
import toast from 'react-hot-toast';
import { unitAPI } from '../../api/unit.api';
import CustomPagination from '../../components/shared/CustomPagination';

interface Unit {
    id: number;
    name: string;
    description?: string;
}

const Units = () => {
    const [units, setUnits] = useState<Unit[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '' });

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const itemsPerPage = 50;

    useEffect(() => {
        fetchUnits(currentPage);
    }, [currentPage]);

    const fetchUnits = async (page: number) => {
        setLoading(true);
        try {
            const response = await unitAPI.getAll({
                skip: (page - 1) * itemsPerPage,
                limit: itemsPerPage,
            });
            setUnits(response.data.data);
            setTotalItems(response.data.meta.total);
        } catch (_error) {
            toast.error('Không thể tải danh sách đơn vị');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingUnit(null);
        setFormData({ name: '', description: '' });
        setModalOpen(true);
    };

    const handleEdit = (unit: Unit) => {
        setEditingUnit(unit);
        setFormData({
            name: unit.name,
            description: unit.description || '',
        });
        setModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Bạn có chắc muốn xóa đơn vị này?')) {
            try {
                await unitAPI.delete(id);
                toast.success('Xóa đơn vị thành công');
                fetchUnits(currentPage);
            } catch (error) {
                toast.error((error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Xóa đơn vị thất bại');
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error('Vui lòng nhập tên đơn vị');
            return;
        }

        try {
            if (editingUnit) {
                await unitAPI.update(editingUnit.id, formData);
                toast.success('Cập nhật đơn vị thành công');
            } else {
                await unitAPI.create(formData);
                toast.success('Thêm đơn vị thành công');
            }
            setModalOpen(false);
            setFormData({ name: '', description: '' });
            fetchUnits(currentPage);
        } catch (error) {
            toast.error((error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Thao tác thất bại');
        }
    };

    // Pagination logic
    const onPageChange = (page: number) => setCurrentPage(page);
    const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
    const indexOfLastItem = Math.min(indexOfFirstItem + itemsPerPage, totalItems);
    const currentUnits = units;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Quản lý đơn vị tính
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Quản lý các đơn vị tính cho sản phẩm
                    </p>
                </div>
                <Button onClick={handleCreate} color="blue">
                    Thêm đơn vị
                </Button>
            </div>

            {/* Table */}
            <Card>
                <div className="overflow-x-auto">
                    <Table>
                        <Table.Head>
                            <Table.HeadCell>Tên đơn vị</Table.HeadCell>
                            <Table.HeadCell>Mô tả</Table.HeadCell>
                            <Table.HeadCell>
                                <span className="sr-only">Actions</span>
                            </Table.HeadCell>
                        </Table.Head>
                        <Table.Body className="divide-y">
                            {loading ? (
                                <Table.Row>
                                    <Table.Cell colSpan={3} className="text-center py-8">
                                        <div className="flex justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        </div>
                                    </Table.Cell>
                                </Table.Row>
                            ) : units.length === 0 ? (
                                <Table.Row>
                                    <Table.Cell colSpan={3} className="text-center py-8 text-gray-500">
                                        Chưa có đơn vị nào
                                    </Table.Cell>
                                </Table.Row>
                            ) : (
                                currentUnits.map((unit) => (
                                    <Table.Row key={unit.id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                                        <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                                            <strong>{unit.name}</strong>
                                        </Table.Cell>
                                        <Table.Cell className="text-gray-600 dark:text-gray-400">
                                            {unit.description || '-'}
                                        </Table.Cell>
                                        <Table.Cell>
                                            <div className="flex gap-2">
                                                <Button size="xs" color="info" onClick={() => handleEdit(unit)}>
                                                    Sửa
                                                </Button>
                                                <Button size="xs" color="failure" onClick={() => handleDelete(unit.id)}>
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

                {/* Pagination info */}
                {units.length > 0 && (
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                        <span className="text-sm text-blue-700 dark:text-blue-400">
                            Hiển thị từ {indexOfFirstItem + 1} đến {Math.min(indexOfLastItem, units.length)} trên tổng {units.length}
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
            <Modal show={modalOpen} onClose={() => setModalOpen(false)}>
                <form onSubmit={handleSubmit}>
                    <Modal.Header>
                        {editingUnit ? 'Chỉnh sửa đơn vị' : 'Thêm đơn vị mới'}
                    </Modal.Header>
                    <Modal.Body>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="name" value="Tên đơn vị" />
                                <TextInput
                                    id="name"
                                    type="text"
                                    placeholder="VD: Chai, Thùng, Kg, Lít..."
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    maxLength={50}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="description" value="Mô tả (không bắt buộc)" />
                                <Textarea
                                    id="description"
                                    placeholder="Nhập mô tả..."
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="mt-1"
                                />
                            </div>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button type="submit" color="blue">
                            {editingUnit ? 'Cập nhật' : 'Thêm'}
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

export default Units;
