import { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Label, TextInput, Textarea } from 'flowbite-react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { safeAPI } from '../../api/safe.api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import type { Safe } from '../../types/api';

interface Balance {
    balance: number;
    bank_balance: number;
}

const Safe = () => {
    const [safes, setSafes] = useState<Safe[]>([]);
    const [balance, setBalance] = useState<Balance | null>(null);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingSafe, setEditingSafe] = useState<Safe | null>(null);
    const [formData, setFormData] = useState({
        safe_date: dayjs().format('YYYY-MM-DD'),
        amount: 0,
        note: '',
    });
    const [selectedMonth, setSelectedMonth] = useState(dayjs().format('YYYY-MM'));

    useEffect(() => {
        fetchSafes();
        fetchBalance();
    }, [selectedMonth]);

    const fetchSafes = async () => {
        setLoading(true);
        try {
            const date = dayjs(selectedMonth);
            const params = {
                month: date.month() + 1,
                year: date.year(),
            };
            const response = await safeAPI.getAll(params);
            setSafes(response.data.data);
        } catch (error) {
            toast.error('Không thể tải danh sách cân két');
        } finally {
            setLoading(false);
        }
    };

    const fetchBalance = async () => {
        try {
            const date = dayjs(selectedMonth);
            const params = {
                month: date.month() + 1,
                year: date.year(),
            };
            const response = await safeAPI.getBalance(params);
            setBalance(response.data);
        } catch (error) {
            toast.error('Không thể tải số dư két');
        }
    };

    const handleCreate = () => {
        setEditingSafe(null);
        setFormData({
            safe_date: dayjs().format('YYYY-MM-DD'),
            amount: 0,
            note: '',
        });
        setModalOpen(true);
    };

    const handleEdit = (safe: Safe) => {
        setEditingSafe(safe);
        setFormData({
            safe_date: safe.safe_date,
            amount: safe.amount,
            note: safe.note || '',
        });
        setModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Bạn có chắc muốn xóa phiếu cân két này?')) {
            try {
                await safeAPI.delete(id);
                toast.success('Xóa phiếu cân két thành công');
                fetchSafes();
                fetchBalance();
            } catch (error: any) {
                toast.error(error.response?.data?.detail || 'Xóa phiếu cân két thất bại');
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (editingSafe) {
                await safeAPI.update(editingSafe.id, formData);
                toast.success('Cập nhật phiếu cân két thành công');
            } else {
                await safeAPI.create(formData);
                toast.success('Thêm phiếu cân két thành công');
            }
            setModalOpen(false);
            fetchSafes();
            fetchBalance();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Thao tác thất bại');
        }
    };

    const totalAdjustments = safes.reduce((sum, s) => sum + s.amount, 0);

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Quản lý cân két
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Theo dõi số dư tiền mặt và tài khoản ngân hàng
                </p>
            </div>

            {/* Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="text-center">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Số tiền trong két
                    </h3>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(balance?.balance || 0)}
                    </p>
                </Card>
                <Card className="text-center">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Số tiền trong tài khoản
                    </h3>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(balance?.bank_balance || 0)}
                    </p>
                </Card>
            </div>

            {/* Controls */}
            <div className="flex justify-between items-center">
                <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2"
                />
                <Button onClick={handleCreate} color="blue">
                    Thêm phiếu cân két
                </Button>
            </div>

            {/* Summary */}
            <Card className="bg-blue-50 dark:bg-blue-900/20">
                <div className="flex justify-between items-center">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                        Tổng điều chỉnh trong tháng:
                    </span>
                    <span className={`text-2xl font-bold ${totalAdjustments >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {totalAdjustments >= 0 ? '+' : ''}{formatCurrency(totalAdjustments)}
                    </span>
                </div>
            </Card>

            {/* Table */}
            <Card>
                <div className="overflow-x-auto">
                    <Table>
                        <Table.Head>
                            <Table.HeadCell>Ngày</Table.HeadCell>
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
                                    <Table.Cell colSpan={5} className="text-center py-8">
                                        <div className="flex justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        </div>
                                    </Table.Cell>
                                </Table.Row>
                            ) : safes.length === 0 ? (
                                <Table.Row>
                                    <Table.Cell colSpan={5} className="text-center py-8 text-gray-500">
                                        Chưa có phiếu cân két nào
                                    </Table.Cell>
                                </Table.Row>
                            ) : (
                                safes.map((safe) => (
                                    <Table.Row key={safe.id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                                        <Table.Cell className="font-medium">
                                            <strong>{formatDate(safe.safe_date)}</strong>
                                        </Table.Cell>
                                        <Table.Cell className={`font-bold ${safe.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {safe.amount >= 0 ? '+' : ''}{formatCurrency(safe.amount)}
                                        </Table.Cell>
                                        <Table.Cell className="text-gray-600 dark:text-gray-400">
                                            {safe.note || '-'}
                                        </Table.Cell>
                                        <Table.Cell className="text-gray-600 dark:text-gray-400">
                                            {safe.created_by_user?.full_name || '-'}
                                        </Table.Cell>
                                        <Table.Cell>
                                            <div className="flex gap-2">
                                                <Button size="xs" color="info" onClick={() => handleEdit(safe)}>
                                                    Sửa
                                                </Button>
                                                <Button size="xs" color="failure" onClick={() => handleDelete(safe.id)}>
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

                {safes.length > 0 && (
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            Tổng {safes.length} phiếu
                        </span>
                    </div>
                )}
            </Card>

            {/* Create/Edit Modal */}
            <Modal show={modalOpen} onClose={() => setModalOpen(false)}>
                <form onSubmit={handleSubmit}>
                    <Modal.Header>
                        {editingSafe ? 'Chỉnh sửa phiếu cân két' : 'Thêm phiếu cân két mới'}
                    </Modal.Header>
                    <Modal.Body>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="safe_date" value="Ngày cân két" />
                                <input
                                    type="date"
                                    id="safe_date"
                                    value={formData.safe_date}
                                    onChange={(e) => setFormData({ ...formData, safe_date: e.target.value })}
                                    required
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1"
                                />
                            </div>

                            <div>
                                <Label htmlFor="amount" value="Số tiền (+ thêm, - trừ)" />
                                <TextInput
                                    id="amount"
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                                    placeholder="Nhập số tiền (VD: 100000 hoặc -50000)"
                                    helperText="Nhập số dương (+) để cộng tiền, số âm (-) để trừ tiền"
                                    required
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
                            {editingSafe ? 'Cập nhật' : 'Thêm'}
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

export default Safe;
