import { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Label, TextInput, Textarea } from 'flowbite-react';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { safeAPI } from '../../api/safe.api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import type { Safe as SafeType } from '../../types/api';

interface Balance {
    balance: number;
    bank_balance: number;
}

const INITIAL_FORM = {
    safe_date: dayjs().format('YYYY-MM-DD'),
    amount: 0,
    note: '',
};

const Safe = () => {
    const [safes, setSafes] = useState<SafeType[]>([]);
    const [balance, setBalance] = useState<Balance | null>(null);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingSafe, setEditingSafe] = useState<SafeType | null>(null);
    const [formData, setFormData] = useState(INITIAL_FORM);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(dayjs().format('YYYY-MM'));

    useEffect(() => {
        fetchSafes();
        fetchBalance();
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
            const list = Array.isArray(response.data) ? response.data : ((response.data as any)?.data || []);
            setSafes(list);
        } catch (_error) {
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
        } catch (_error) {
            toast.error('Không thể tải số dư két');
        }
    };

    const handleCreate = () => {
        setEditingSafe(null);
        setFormData({
            ...INITIAL_FORM,
            safe_date: dayjs().format('YYYY-MM-DD'),
        });
        setModalOpen(true);
    };

    const handleEdit = (safe: SafeType) => {
        setEditingSafe(safe);
        setFormData({
            safe_date: safe.safe_date ? dayjs(safe.safe_date).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
            amount: safe.amount,
            note: safe.note || '',
        });
        setModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Bạn có chắc muốn xóa phiếu cân két này?')) return;
        try {
            await safeAPI.delete(id);
            toast.success('Xóa phiếu cân két thành công');
            fetchSafes();
            fetchBalance();
        } catch (error) {
            const detail = (error as { response?: { data?: { detail?: string; message?: string } } })?.response?.data?.detail
                || (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(detail || 'Xóa phiếu cân két thất bại');
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
        } catch (error) {
            const detail = (error as { response?: { data?: { detail?: string; message?: string } } })?.response?.data?.detail
                || (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(detail || 'Thao tác thất bại');
        }
    };

    const filteredSafes = safes.filter((s) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        const note = (s.note || '').toLowerCase();
        const creator = (s.created_by_user?.full_name || '').toLowerCase();
        return note.includes(term) || creator.includes(term);
    });

    const totalAdjustments = safes.reduce((sum, s) => sum + (s.amount || 0), 0);

    return (
        <div className="pt-0 px-6 pb-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-[16px] font-semibold uppercase text-[#37393E] dark:text-white flex items-center gap-2">
                        QUẢN LÝ QUỸ TIỀN MẶT & CÂN KÉT
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleCreate}
                        className="bg-[#C6010B] hover:bg-[#C6010B]/90 text-white font-medium px-4 py-2.5 rounded-[24px] flex items-center justify-center transition-colors cursor-pointer text-sm"
                    >
                        <div className="flex items-center gap-2">
                            <Icon icon="solar:add-circle-outline" className="text-xl" />
                            Thêm phiếu cân két
                        </div>
                    </button>
                </div>
            </div>

            {/* Top 3 KPI Summary Boxes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <p className="text-sm md:text-[15px] font-medium text-gray-600 dark:text-gray-300">
                        Số tiền mặt trong két
                    </p>
                    <p className="text-xl md:text-2xl font-bold text-red-600 dark:text-red-500 mt-1.5">
                        {formatCurrency(balance?.balance || 0)}
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <p className="text-sm md:text-[15px] font-medium text-gray-600 dark:text-gray-300">
                        Số tiền trong tài khoản
                    </p>
                    <p className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-500 mt-1.5">
                        {formatCurrency(balance?.bank_balance || 0)}
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <p className="text-sm md:text-[15px] font-medium text-gray-600 dark:text-gray-300">
                        Tổng điều chỉnh trong tháng
                    </p>
                    <p className={`text-xl md:text-2xl font-bold mt-1.5 ${totalAdjustments >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-500'}`}>
                        {totalAdjustments >= 0 ? '+' : ''}{formatCurrency(totalAdjustments)}
                    </p>
                </div>
            </div>

            {/* Main Card with TempReport styling */}
            <Card className="overflow-hidden rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-0">
                {/* Filters & Search Toolbar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-4 border-b dark:border-gray-700">
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <span className="text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                            Tháng:
                        </span>
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <TextInput
                            id="search"
                            type="text"
                            placeholder="Tìm kiếm ghi chú, người thao tác..."
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
                            <Table.HeadCell className="py-3.5 text-left">NGÀY CÂN KÉT</Table.HeadCell>
                            <Table.HeadCell className="py-3.5 text-right">SỐ TIỀN ĐIỀU CHỈNH</Table.HeadCell>
                            <Table.HeadCell className="py-3.5 text-left">GHI CHÚ</Table.HeadCell>
                            <Table.HeadCell className="py-3.5 text-left">NGƯỜI THAO TÁC</Table.HeadCell>
                            <Table.HeadCell className="py-3.5 text-center">THAO TÁC</Table.HeadCell>
                        </Table.Head>
                        <Table.Body className="divide-y divide-gray-200 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
                            {loading ? (
                                <Table.Row>
                                    <Table.Cell colSpan={5} className="text-center py-12">
                                        <div className="flex justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        </div>
                                    </Table.Cell>
                                </Table.Row>
                            ) : filteredSafes.length === 0 ? (
                                <Table.Row>
                                    <Table.Cell colSpan={5} className="text-center py-12 text-gray-400">
                                        Chưa có phiếu cân két nào trong tháng {dayjs(selectedMonth).format('MM/YYYY')}
                                    </Table.Cell>
                                </Table.Row>
                            ) : (
                                filteredSafes.map((safe) => (
                                    <Table.Row key={safe.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <Table.Cell className="font-semibold text-gray-900 dark:text-white whitespace-nowrap text-left py-4 text-[14px]">
                                            {formatDate(safe.safe_date)}
                                        </Table.Cell>
                                        <Table.Cell className={`text-right font-bold whitespace-nowrap py-4 text-[14px] ${safe.amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {safe.amount >= 0 ? '+' : ''}{formatCurrency(safe.amount)}
                                        </Table.Cell>
                                        <Table.Cell className="text-left text-gray-600 dark:text-gray-300 max-w-[250px] truncate py-4 text-[13px]">
                                            {safe.note || '-'}
                                        </Table.Cell>
                                        <Table.Cell className="text-left text-gray-600 dark:text-gray-300 whitespace-nowrap py-4 text-[13px]">
                                            {safe.created_by_user?.full_name || '-'}
                                        </Table.Cell>
                                        <Table.Cell className="text-center whitespace-nowrap py-4">
                                            <div className="flex justify-center items-center gap-2">
                                                <Button size="xs" color="light" onClick={() => handleEdit(safe)} className="p-1.5 hover:bg-blue-50 border-gray-200">
                                                    <Icon icon="solar:pen-2-outline" className="text-blue-600 text-base" />
                                                </Button>
                                                <Button size="xs" color="light" onClick={() => handleDelete(safe.id)} className="p-1.5 hover:bg-red-50 border-gray-200">
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

                {filteredSafes.length > 0 && (
                    <div className="flex justify-between items-center px-4 py-3.5 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
                        <span>Tổng cộng: <strong>{filteredSafes.length}</strong> phiếu cân két</span>
                        <span>Tổng điều chỉnh: <strong className={totalAdjustments >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>{totalAdjustments >= 0 ? '+' : ''}{formatCurrency(totalAdjustments)}</strong></span>
                    </div>
                )}
            </Card>

            {/* Create/Edit Modal */}
            <Modal show={modalOpen} onClose={() => setModalOpen(false)} size="md">
                <form onSubmit={handleSubmit}>
                    <Modal.Header>
                        {editingSafe ? 'Chỉnh sửa phiếu cân két' : 'Thêm phiếu cân két mới'}
                    </Modal.Header>
                    <Modal.Body>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="safe_date" value="Ngày cân két (*)" className="mb-1 block font-medium text-xs text-gray-700 dark:text-gray-300" />
                                <input
                                    type="date"
                                    id="safe_date"
                                    value={formData.safe_date}
                                    onChange={(e) => setFormData({ ...formData, safe_date: e.target.value })}
                                    required
                                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm"
                                />
                            </div>

                            <div>
                                <Label htmlFor="amount" value="Số tiền điều chỉnh (VNĐ) (*)" className="mb-1 block font-medium text-xs text-gray-700 dark:text-gray-300" />
                                <TextInput
                                    id="amount"
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                                    placeholder="0"
                                    required
                                    helperText="Nhập số dương (+) để cộng tiền vào két, số âm (-) để trừ tiền khỏi két"
                                />
                            </div>

                            <div>
                                <Label htmlFor="note" value="Ghi chú (không bắt buộc)" className="mb-1 block font-medium text-xs text-gray-700 dark:text-gray-300" />
                                <Textarea
                                    id="note"
                                    placeholder="Nhập ghi chú lý do điều chỉnh..."
                                    rows={2}
                                    value={formData.note}
                                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
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
