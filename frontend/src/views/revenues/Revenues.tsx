import { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Label, TextInput, Textarea, Badge } from 'flowbite-react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { revenueAPI } from '../../api/revenue.api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import type { Revenue } from '../../types/api';

const Revenues = () => {
    const [revenues, setRevenues] = useState<Revenue[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingRevenue, setEditingRevenue] = useState<Revenue | null>(null);
    const [formData, setFormData] = useState({
        date: dayjs().format('YYYY-MM-DD'),
        amount: 0,
        description: '',
    });
    const [dateRange, setDateRange] = useState({
        start: dayjs().startOf('month').format('YYYY-MM-DD'),
        end: dayjs().endOf('month').format('YYYY-MM-DD'),
    });

    useEffect(() => {
        fetchRevenues();
    }, [dateRange]);

    const fetchRevenues = async () => {
        setLoading(true);
        try {
            const response = await revenueAPI.getRevenues({
                start_date: dateRange.start,
                end_date: dateRange.end,
            });
            setRevenues(response.data.data);
        } catch (error) {
            toast.error('Không thể tải danh sách doanh thu');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingRevenue(null);
        setFormData({
            date: dayjs().format('YYYY-MM-DD'),
            amount: 0,
            description: '',
        });
        setModalOpen(true);
    };

    const handleEdit = (revenue: Revenue) => {
        setEditingRevenue(revenue);
        setFormData({
            date: revenue.date,
            amount: revenue.amount,
            description: revenue.description || '',
        });
        setModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Bạn có chắc muốn xóa doanh thu này?')) {
            try {
                await revenueAPI.deleteRevenue(id);
                toast.success('Xóa doanh thu thành công');
                fetchRevenues();
            } catch (error: any) {
                toast.error(error.response?.data?.detail || 'Xóa doanh thu thất bại');
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.amount <= 0) {
            toast.error('Vui lòng điền đầy đủ thông tin');
            return;
        }

        try {
            if (editingRevenue) {
                await revenueAPI.updateRevenue(editingRevenue.id, formData);
                toast.success('Cập nhật doanh thu thành công');
            } else {
                await revenueAPI.createRevenue(formData);
                toast.success('Thêm doanh thu thành công');
            }
            setModalOpen(false);
            fetchRevenues();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Thao tác thất bại');
        }
    };

    const totalRevenue = revenues.reduce((sum, r) => sum + r.amount, 0);

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Quản lý doanh thu
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Theo dõi các khoản doanh thu theo thời gian
                    </p>
                </div>
                <div className="flex gap-2">
                    <div className="flex gap-2 items-center">
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        />
                        <span className="text-gray-500">-</span>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        />
                    </div>
                    <Button onClick={handleCreate} color="blue">
                        Thêm doanh thu
                    </Button>
                </div>
            </div>

            {/* Summary */}
            <Card className="bg-green-50 dark:bg-green-900/20">
                <div className="flex justify-between items-center">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                        Tổng doanh thu:
                    </span>
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(totalRevenue)}
                    </span>
                </div>
            </Card>

            {/* Table */}
            <Card>
                <div className="overflow-x-auto">
                    <Table>
                        <Table.Head>
                            <Table.HeadCell>Ngày</Table.HeadCell>
                            <Table.HeadCell>Nguồn</Table.HeadCell>
                            <Table.HeadCell>Số tiền</Table.HeadCell>
                            <Table.HeadCell>Ghi chú</Table.HeadCell>
                            <Table.HeadCell>Người tạo</Table.HeadCell>
                            <Table.HeadCell>
                                <span className="sr-only">Actions</span>
                            </Table.HeadCell>
                        </Table.Head>
                        <Table.Body className="divide-y">
                            {loading ? (
                                <Table.Row>
                                    <Table.Cell colSpan={6} className="text-center py-8">
                                        <div className="flex justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        </div>
                                    </Table.Cell>
                                </Table.Row>
                            ) : revenues.length === 0 ? (
                                <Table.Row>
                                    <Table.Cell colSpan={6} className="text-center py-8 text-gray-500">
                                        Chưa có doanh thu nào
                                    </Table.Cell>
                                </Table.Row>
                            ) : (
                                revenues.map((revenue) => (
                                    <Table.Row key={revenue.id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                                        <Table.Cell className="font-medium">
                                            <strong>{formatDate(revenue.date)}</strong>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Badge color="info">{revenue.description || '-'}</Badge>
                                        </Table.Cell>
                                        <Table.Cell className="text-green-600 dark:text-green-400 font-bold">
                                            {formatCurrency(revenue.amount)}
                                        </Table.Cell>
                                        <Table.Cell className="text-gray-600 dark:text-gray-400">
                                            {revenue.description || '-'}
                                        </Table.Cell>
                                        <Table.Cell className="text-gray-600 dark:text-gray-400">
                                            -
                                        </Table.Cell>
                                        <Table.Cell>
                                            <div className="flex gap-2">
                                                <Button size="xs" color="info" onClick={() => handleEdit(revenue)}>
                                                    Sửa
                                                </Button>
                                                <Button size="xs" color="failure" onClick={() => handleDelete(revenue.id)}>
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

                {revenues.length > 0 && (
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            Tổng {revenues.length} bản ghi
                        </span>
                    </div>
                )}
            </Card>

            {/* Create/Edit Modal */}
            <Modal show={modalOpen} onClose={() => setModalOpen(false)}>
                <form onSubmit={handleSubmit}>
                    <Modal.Header>
                        {editingRevenue ? 'Chỉnh sửa doanh thu' : 'Thêm doanh thu mới'}
                    </Modal.Header>
                    <Modal.Body>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="date" value="Ngày" />
                                <input
                                    type="date"
                                    id="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    required
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1"
                                />
                            </div>

                            <div>
                                <Label htmlFor="amount" value="Số tiền" />
                                <TextInput
                                    id="amount"
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                                    placeholder="Nhập số tiền"
                                    required
                                    min={1}
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
                            {editingRevenue ? 'Cập nhật' : 'Thêm'}
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

export default Revenues;
