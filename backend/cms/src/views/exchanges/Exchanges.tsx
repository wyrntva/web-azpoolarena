import { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Label, TextInput, Textarea, Select } from 'flowbite-react';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { exchangeAPI } from '../../api/exchange.api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import type { Exchange } from '../../types/api';

const INITIAL_FORM = {
    exchange_date: dayjs().format('YYYY-MM-DD'),
    amount: 0,
    from_account: 'cash' as 'cash' | 'bank',
    to_account: 'bank' as 'cash' | 'bank',
    note: '',
};

const Exchanges = () => {
    const [exchanges, setExchanges] = useState<Exchange[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingExchange, setEditingExchange] = useState<Exchange | null>(null);
    const [formData, setFormData] = useState(INITIAL_FORM);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState({
        start: dayjs().startOf('month').format('YYYY-MM-DD'),
        end: dayjs().endOf('month').format('YYYY-MM-DD'),
    });

    useEffect(() => {
        fetchExchanges();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateRange]);

    const fetchExchanges = async () => {
        setLoading(true);
        try {
            const response = await exchangeAPI.getAll({
                start_date: dateRange.start,
                end_date: dateRange.end,
            });
            const list = Array.isArray(response.data) ? response.data : ((response.data as any)?.data || []);
            setExchanges(list);
        } catch (_error) {
            toast.error('Không thể tải danh sách chuyển tiền');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingExchange(null);
        setFormData({
            ...INITIAL_FORM,
            exchange_date: dayjs().format('YYYY-MM-DD'),
        });
        setModalOpen(true);
    };

    const handleEdit = (exchange: Exchange) => {
        setEditingExchange(exchange);
        setFormData({
            exchange_date: exchange.exchange_date ? dayjs(exchange.exchange_date).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
            amount: exchange.amount,
            from_account: exchange.from_account,
            to_account: exchange.to_account,
            note: exchange.note || '',
        });
        setModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Bạn có chắc muốn xóa giao dịch đổi tiền này?')) return;
        try {
            await exchangeAPI.delete(id);
            toast.success('Xóa giao dịch thành công');
            fetchExchanges();
        } catch (error) {
            const detail = (error as { response?: { data?: { detail?: string; message?: string } } })?.response?.data?.detail
                || (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(detail || 'Xóa giao dịch thất bại');
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
        } catch (error) {
            const detail = (error as { response?: { data?: { detail?: string; message?: string } } })?.response?.data?.detail
                || (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(detail || 'Thao tác thất bại');
        }
    };

    const filteredExchanges = exchanges.filter((e) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        const note = (e.note || '').toLowerCase();
        const creator = (e.created_by_user?.full_name || '').toLowerCase();
        return note.includes(term) || creator.includes(term);
    });

    const totalAmount = exchanges.reduce((sum, e) => sum + (e.amount || 0), 0);
    const cashToBank = exchanges.filter(e => e.from_account === 'cash' && e.to_account === 'bank').reduce((sum, e) => sum + (e.amount || 0), 0);
    const bankToCash = exchanges.filter(e => e.from_account === 'bank' && e.to_account === 'cash').reduce((sum, e) => sum + (e.amount || 0), 0);

    return (
        <div className="pt-0 px-6 pb-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-[16px] font-semibold uppercase text-[#37393E] dark:text-white flex items-center gap-2">
                        QUẢN LÝ ĐỔI TIỀN & CHUYỂN QUỸ
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleCreate}
                        className="bg-[#C6010B] hover:bg-[#C6010B]/90 text-white font-medium px-4 py-2.5 rounded-[24px] flex items-center justify-center transition-colors cursor-pointer text-sm"
                    >
                        <div className="flex items-center gap-2">
                            <Icon icon="solar:add-circle-outline" className="text-xl" />
                            Thêm giao dịch
                        </div>
                    </button>
                </div>
            </div>

            {/* Top 3 KPI Summary Boxes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <p className="text-sm md:text-[15px] font-medium text-gray-600 dark:text-gray-300">
                        Tổng số tiền chuyển đổi
                    </p>
                    <p className="text-xl md:text-2xl font-bold text-red-600 dark:text-red-500 mt-1.5">
                        {formatCurrency(totalAmount)}
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <p className="text-sm md:text-[15px] font-medium text-gray-600 dark:text-gray-300">
                        Tiền mặt → Tài khoản
                    </p>
                    <p className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-500 mt-1.5">
                        {formatCurrency(cashToBank)}
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <p className="text-sm md:text-[15px] font-medium text-gray-600 dark:text-gray-300">
                        Tài khoản → Tiền mặt
                    </p>
                    <p className="text-xl md:text-2xl font-bold text-amber-600 dark:text-amber-500 mt-1.5">
                        {formatCurrency(bankToCash)}
                    </p>
                </div>
            </div>

            {/* Main Card with TempReport styling */}
            <Card className="overflow-hidden rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-0">
                {/* Filters & Search Toolbar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-4 border-b dark:border-gray-700">
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <span className="text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                            Từ ngày:
                        </span>
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                            className="text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-gray-400">-</span>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                            className="text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <TextInput
                            id="search"
                            type="text"
                            placeholder="Tìm kiếm theo ghi chú, người tạo..."
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
                            <Table.HeadCell className="py-3.5 text-left">NGÀY</Table.HeadCell>
                            <Table.HeadCell className="py-3.5 text-center">TỪ NGUỒN</Table.HeadCell>
                            <Table.HeadCell className="py-3.5 text-center">→</Table.HeadCell>
                            <Table.HeadCell className="py-3.5 text-center">ĐẾN ĐÍCH</Table.HeadCell>
                            <Table.HeadCell className="py-3.5 text-right">SỐ TIỀN</Table.HeadCell>
                            <Table.HeadCell className="py-3.5 text-left">GHI CHÚ</Table.HeadCell>
                            <Table.HeadCell className="py-3.5 text-left">NGƯỜI TẠO</Table.HeadCell>
                            <Table.HeadCell className="py-3.5 text-center">THAO TÁC</Table.HeadCell>
                        </Table.Head>
                        <Table.Body className="divide-y divide-gray-200 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
                            {loading ? (
                                <Table.Row>
                                    <Table.Cell colSpan={8} className="text-center py-12">
                                        <div className="flex justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        </div>
                                    </Table.Cell>
                                </Table.Row>
                            ) : filteredExchanges.length === 0 ? (
                                <Table.Row>
                                    <Table.Cell colSpan={8} className="text-center py-12 text-gray-400">
                                        Không có dữ liệu giao dịch đổi tiền trong khoảng thời gian đã chọn
                                    </Table.Cell>
                                </Table.Row>
                            ) : (
                                filteredExchanges.map((exchange) => (
                                    <Table.Row key={exchange.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <Table.Cell className="font-semibold text-gray-900 dark:text-white whitespace-nowrap text-left py-4 text-[14px]">
                                            {formatDate(exchange.exchange_date)}
                                        </Table.Cell>
                                        <Table.Cell className="text-center whitespace-nowrap py-4">
                                            <span
                                                className={`inline-block px-3 py-1 rounded-md text-xs font-medium ${
                                                    exchange.from_account === 'cash'
                                                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                                                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                                                }`}
                                            >
                                                {exchange.from_account === 'cash' ? 'Tiền mặt' : 'Tài khoản'}
                                            </span>
                                        </Table.Cell>
                                        <Table.Cell className="text-center text-gray-400 font-bold py-4 text-base">
                                            →
                                        </Table.Cell>
                                        <Table.Cell className="text-center whitespace-nowrap py-4">
                                            <span
                                                className={`inline-block px-3 py-1 rounded-md text-xs font-medium ${
                                                    exchange.to_account === 'cash'
                                                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                                                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                                                }`}
                                            >
                                                {exchange.to_account === 'cash' ? 'Tiền mặt' : 'Tài khoản'}
                                            </span>
                                        </Table.Cell>
                                        <Table.Cell className="text-right font-bold text-red-600 dark:text-red-400 whitespace-nowrap py-4 text-[14px]">
                                            {formatCurrency(exchange.amount)}
                                        </Table.Cell>
                                        <Table.Cell className="text-left text-gray-600 dark:text-gray-300 max-w-[220px] truncate py-4 text-[13px]">
                                            {exchange.note || '-'}
                                        </Table.Cell>
                                        <Table.Cell className="text-left text-gray-600 dark:text-gray-300 whitespace-nowrap py-4 text-[13px]">
                                            {exchange.created_by_user?.full_name || '-'}
                                        </Table.Cell>
                                        <Table.Cell className="text-center whitespace-nowrap py-4">
                                            <div className="flex justify-center items-center gap-2">
                                                <Button size="xs" color="light" onClick={() => handleEdit(exchange)} className="p-1.5 hover:bg-blue-50 border-gray-200">
                                                    <Icon icon="solar:pen-2-outline" className="text-blue-600 text-base" />
                                                </Button>
                                                <Button size="xs" color="light" onClick={() => handleDelete(exchange.id)} className="p-1.5 hover:bg-red-50 border-gray-200">
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

                {filteredExchanges.length > 0 && (
                    <div className="flex justify-between items-center px-4 py-3.5 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
                        <span>Tổng cộng: <strong>{filteredExchanges.length}</strong> giao dịch</span>
                        <span>Tổng chuyển đổi: <strong className="text-red-600 dark:text-red-400">{formatCurrency(totalAmount)}</strong></span>
                    </div>
                )}
            </Card>

            {/* Create/Edit Modal */}
            <Modal show={modalOpen} onClose={() => setModalOpen(false)} size="md">
                <form onSubmit={handleSubmit}>
                    <Modal.Header>
                        {editingExchange ? 'Chỉnh sửa phiếu đổi tiền' : 'Thêm phiếu đổi tiền mới'}
                    </Modal.Header>
                    <Modal.Body>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="exchange_date" value="Ngày giao dịch (*)" className="mb-1 block font-medium text-xs text-gray-700 dark:text-gray-300" />
                                <input
                                    type="date"
                                    id="exchange_date"
                                    value={formData.exchange_date}
                                    onChange={(e) => setFormData({ ...formData, exchange_date: e.target.value })}
                                    required
                                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                                <div>
                                    <Label htmlFor="from_account" value="Từ nguồn (*)" className="mb-1 block font-medium text-xs text-gray-700 dark:text-gray-300" />
                                    <Select
                                        id="from_account"
                                        value={formData.from_account}
                                        onChange={(e) => setFormData({ ...formData, from_account: e.target.value as 'cash' | 'bank' })}
                                        required
                                    >
                                        <option value="cash">Tiền mặt</option>
                                        <option value="bank">Tài khoản</option>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="to_account" value="Đến đích (*)" className="mb-1 block font-medium text-xs text-gray-700 dark:text-gray-300" />
                                    <Select
                                        id="to_account"
                                        value={formData.to_account}
                                        onChange={(e) => setFormData({ ...formData, to_account: e.target.value as 'cash' | 'bank' })}
                                        required
                                    >
                                        <option value="bank">Tài khoản</option>
                                        <option value="cash">Tiền mặt</option>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="amount" value="Số tiền (VNĐ) (*)" className="mb-1 block font-medium text-xs text-gray-700 dark:text-gray-300" />
                                <TextInput
                                    id="amount"
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                                    placeholder="0"
                                    required
                                    min={1}
                                />
                            </div>

                            <div>
                                <Label htmlFor="note" value="Ghi chú (không bắt buộc)" className="mb-1 block font-medium text-xs text-gray-700 dark:text-gray-300" />
                                <Textarea
                                    id="note"
                                    placeholder="Nhập ghi chú..."
                                    rows={2}
                                    value={formData.note}
                                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
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
