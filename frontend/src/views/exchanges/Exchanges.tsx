import { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Label, TextInput, Textarea, Badge, Select } from 'flowbite-react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { exchangeAPI } from '../../api/exchange.api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import type { Exchange } from '../../types/api';

const ACCOUNT_TYPES = {
    cash: { label: 'Tiền mặt', icon: '', color: 'info' },
    bank: { label: 'Tài khoản', icon: '', color: 'success' },
};

const Exchanges = () => {
    const [exchanges, setExchanges] = useState<Exchange[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingExchange, setEditingExchange] = useState<Exchange | null>(null);
    const [formData, setFormData] = useState({
        exchange_date: dayjs().format('YYYY-MM-DD'),
        amount: 0,
        from_account: 'cash' as 'cash' | 'bank',
        to_account: 'bank' as 'cash' | 'bank',
        note: '',
    });

    const [dateRange, setDateRange] = useState({
        start: dayjs().startOf('month').format('YYYY-MM-DD'),
        end: dayjs().endOf('month').format('YYYY-MM-DD'),
    });

    useEffect(() => {
        fetchExchanges();
    }, [dateRange]);

    const fetchExchanges = async () => {
        setLoading(true);
        try {
            const response = await exchangeAPI.getAll({
                start_date: dateRange.start,
                end_date: dateRange.end,
            });
            setExchanges(response.data.data);
        } catch (error) {
            toast.error('Không thể tải danh sách chuyển tiền');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingExchange(null);
        setFormData({
            exchange_date: dayjs().format('YYYY-MM-DD'),
            amount: 0,
            from_account: 'cash',
            to_account: 'bank',
            note: '',
        });
        setModalOpen(true);
    };

    const handleEdit = (exchange: Exchange) => {
        setEditingExchange(exchange);
        setFormData({
            exchange_date: exchange.exchange_date,
            amount: exchange.amount,
            from_account: exchange.from_account,
            to_account: exchange.to_account,
            note: exchange.note || '',
        });
        setModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Bạn có chắc muốn xóa giao dịch này?')) {
            try {
                await exchangeAPI.delete(id);
                toast.success('Xóa giao dịch thành công');
                fetchExchanges();
            } catch (error: any) {
                toast.error(error.response?.data?.detail || 'Xóa giao dịch thất bại');
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.from_account === formData.to_account) {
            toast.error('Tài khoản nguồn và đích không thể giống nhau');
            return;
        }

        if (formData.amount <= 0) {
            toast.error('Số tiền phải lớn hơn 0');
            return;
        }

        try {
            if (editingExchange) {
                await exchangeAPI.update(editingExchange.id, formData);
                toast.success('Cập nhật giao dịch thành công');
            } else {
                await exchangeAPI.create(formData);
                toast.success('Thêm giao dịch thành công');
            }
            setModalOpen(false);
            fetchExchanges();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Thao tác thất bại');
        }
    };

    const totalAmount = exchanges.reduce((sum, e) => sum + e.amount, 0);

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Quản lý đổi tiền
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Theo dõi các giao dịch chuyển đổi giữa tiền mặt và tài khoản
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
                        Thêm phiếu đổi tiền
                    </Button>
                </div>
            </div>

            {/* Summary */}
            <Card className="bg-blue-50 dark:bg-blue-900/20">
                <div className="flex justify-between items-center">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                        Tổng số tiền đã chuyển đổi:
                    </span>
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(totalAmount)}
                    </span>
                </div>
            </Card>

            {/* Table */}
            <Card>
                <div className="overflow-x-auto">
                    <Table>
                        <Table.Head>
                            <Table.HeadCell>Ngày</Table.HeadCell>
                            <Table.HeadCell>Từ</Table.HeadCell>
                            <Table.HeadCell className="text-center">→</Table.HeadCell>
                            <Table.HeadCell>Đến</Table.HeadCell>
                            <Table.HeadCell>Số tiền</Table.HeadCell>
                            <Table.HeadCell>Ghi chú</Table.HeadCell>
                            <Table.HeadCell>Người thao tác</Table.HeadCell>
                            <Table.HeadCell>
                                <span className="sr-only">Actions</span>
                            </Table.HeadCell>
                        </Table.Head>
                        <Table.Body className="divide-y">
                            {loading ? (
                                <Table.Row>
                                    <Table.Cell colSpan={8} className="text-center py-8">
                                        <div className="flex justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        </div>
                                    </Table.Cell>
                                </Table.Row>
                            ) : exchanges.length === 0 ? (
                                <Table.Row>
                                    <Table.Cell colSpan={8} className="text-center py-8 text-gray-500">
                                        Chưa có giao dịch nào
                                    </Table.Cell>
                                </Table.Row>
                            ) : (
                                exchanges.map((exchange) => (
                                    <Table.Row key={exchange.id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                                        <Table.Cell className="font-medium">
                                            <strong>{formatDate(exchange.exchange_date)}</strong>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Badge color={ACCOUNT_TYPES[exchange.from_account].color as any}>
                                                {ACCOUNT_TYPES[exchange.from_account].icon} {ACCOUNT_TYPES[exchange.from_account].label}
                                            </Badge>
                                        </Table.Cell>
                                        <Table.Cell className="text-center text-gray-400">
                                            →
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Badge color={ACCOUNT_TYPES[exchange.to_account].color as any}>
                                                {ACCOUNT_TYPES[exchange.to_account].icon} {ACCOUNT_TYPES[exchange.to_account].label}
                                            </Badge>
                                        </Table.Cell>
                                        <Table.Cell className="text-blue-600 dark:text-blue-400 font-bold">
                                            {formatCurrency(exchange.amount)}
                                        </Table.Cell>
                                        <Table.Cell className="text-gray-600 dark:text-gray-400">
                                            {exchange.note || '-'}
                                        </Table.Cell>
                                        <Table.Cell className="text-gray-600 dark:text-gray-400">
                                            {exchange.created_by_user?.full_name || '-'}
                                        </Table.Cell>
                                        <Table.Cell>
                                            <div className="flex gap-2">
                                                <Button size="xs" color="info" onClick={() => handleEdit(exchange)}>
                                                    Sửa
                                                </Button>
                                                <Button size="xs" color="failure" onClick={() => handleDelete(exchange.id)}>
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

                {exchanges.length > 0 && (
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            Tổng {exchanges.length} giao dịch
                        </span>
                    </div>
                )}
            </Card>

            {/* Create/Edit Modal */}
            <Modal show={modalOpen} onClose={() => setModalOpen(false)}>
                <form onSubmit={handleSubmit}>
                    <Modal.Header>
                        {editingExchange ? 'Chỉnh sửa phiếu đổi tiền' : 'Thêm phiếu đổi tiền mới'}
                    </Modal.Header>
                    <Modal.Body>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="exchange_date" value="Ngày đổi" />
                                <input
                                    type="date"
                                    id="exchange_date"
                                    value={formData.exchange_date}
                                    onChange={(e) => setFormData({ ...formData, exchange_date: e.target.value })}
                                    required
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1"
                                />
                            </div>

                            <div>
                                <Label htmlFor="from_account" value="Từ tài khoản" />
                                <Select
                                    id="from_account"
                                    value={formData.from_account}
                                    onChange={(e) => setFormData({ ...formData, from_account: e.target.value as 'cash' | 'bank' })}
                                    required
                                    className="mt-1"
                                >
                                    <option value="cash">Tiền mặt</option>
                                    <option value="bank">Tài khoản</option>
                                </Select>
                            </div>

                            <div className="text-center text-2xl text-blue-600">→</div>

                            <div>
                                <Label htmlFor="to_account" value="Đến tài khoản" />
                                <Select
                                    id="to_account"
                                    value={formData.to_account}
                                    onChange={(e) => setFormData({ ...formData, to_account: e.target.value as 'cash' | 'bank' })}
                                    required
                                    className="mt-1"
                                >
                                    <option value="cash">Tiền mặt</option>
                                    <option value="bank">Tài khoản</option>
                                </Select>
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
                                <Label htmlFor="note" value="Ghi chú (không bắt buộc)" />
                                <Textarea
                                    id="note"
                                    placeholder="Nhập ghi chú..."
                                    rows={3}
                                    value={formData.note}
                                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                    className="mt-1"
                                />
                            </div>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button type="submit" color="blue">
                            {editingExchange ? 'Cập nhật' : 'Thêm'}
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

export default Exchanges;
