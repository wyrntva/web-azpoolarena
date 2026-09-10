import { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Label, TextInput, Textarea } from 'flowbite-react';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { revenueAPI } from '../../api/revenue.api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import type { Revenue } from '../../types/api';

const INITIAL_FORM = {
    revenue_date: dayjs().format('YYYY-MM-DD'),
    cash_revenue: 0,
    bank_revenue: 0,
    system_revenue: 0,
    note: '',
};

const Revenues = () => {
    const [revenues, setRevenues] = useState<Revenue[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingRevenue, setEditingRevenue] = useState<Revenue | null>(null);
    const [formData, setFormData] = useState(INITIAL_FORM);
    const [dateRange, setDateRange] = useState({
        start: dayjs().startOf('month').format('YYYY-MM-DD'),
        end: dayjs().endOf('month').format('YYYY-MM-DD'),
    });

    useEffect(() => {
        fetchRevenues();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateRange]);

    const fetchRevenues = async () => {
        setLoading(true);
        try {
            const response = await revenueAPI.getRevenues({
                start_date: dateRange.start,
                end_date: dateRange.end,
            });
            const list = Array.isArray(response.data) ? response.data : ((response.data as any)?.data || []);
            setRevenues(list);
        } catch (_error) {
            toast.error('Không thể tải danh sách doanh thu');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingRevenue(null);
        setFormData({
            ...INITIAL_FORM,
            revenue_date: dayjs().format('YYYY-MM-DD'),
        });
        setModalOpen(true);
    };

    const handleEdit = (revenue: Revenue) => {
        setEditingRevenue(revenue);
        setFormData({
            revenue_date: revenue.revenue_date || revenue.date || dayjs().format('YYYY-MM-DD'),
            cash_revenue: revenue.cash_revenue || 0,
            bank_revenue: revenue.bank_revenue || 0,
            system_revenue: revenue.system_revenue || 0,
            note: revenue.note || revenue.description || '',
        });
        setModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Bạn có chắc muốn xóa bản ghi doanh thu này?')) {
            try {
                await revenueAPI.deleteRevenue(id);
                toast.success('Xóa doanh thu thành công');
                fetchRevenues();
            } catch (error) {
                const detail = (error as { response?: { data?: { detail?: string; message?: string } } })?.response?.data?.detail
                    || (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
                toast.error(detail || 'Xóa doanh thu thất bại');
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.revenue_date) {
            toast.error('Vui lòng chọn ngày doanh thu');
            return;
        }

        try {
            const payload = {
                revenue_date: formData.revenue_date,
                cash_revenue: Number(formData.cash_revenue) || 0,
                bank_revenue: Number(formData.bank_revenue) || 0,
                system_revenue: Number(formData.system_revenue) || 0,
                note: formData.note,
            };

            if (editingRevenue) {
                await revenueAPI.updateRevenue(editingRevenue.id, payload);
                toast.success('Cập nhật doanh thu thành công');
            } else {
                await revenueAPI.createRevenue(payload);
                toast.success('Thêm doanh thu thành công');
            }
            setModalOpen(false);
            fetchRevenues();
        } catch (error) {
            const detail = (error as { response?: { data?: { detail?: string; message?: string } } })?.response?.data?.detail
                || (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(detail || 'Thao tác thất bại');
        }
    };

    // Calculate totals
    const totalCash = revenues.reduce((sum, r) => sum + (r.cash_revenue || 0), 0);
    const totalBank = revenues.reduce((sum, r) => sum + (r.bank_revenue || 0), 0);
    const totalActual = totalCash + totalBank;
    const totalSystem = revenues.reduce((sum, r) => sum + (r.system_revenue || 0), 0);
    const totalDiff = totalActual - totalSystem;

    const modalActualTotal = (Number(formData.cash_revenue) || 0) + (Number(formData.bank_revenue) || 0);
    const modalDiff = modalActualTotal - (Number(formData.system_revenue) || 0);

    return (
        <div className="pt-0 px-6 pb-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-[16px] font-semibold uppercase text-[#37393E] dark:text-white flex items-center gap-2">
                        QUẢN LÝ DOANH THU HẰNG NGÀY
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleCreate}
                        className="bg-[#C6010B] hover:bg-[#C6010B]/90 text-white font-medium px-4 py-2.5 rounded-[24px] flex items-center justify-center transition-colors cursor-pointer text-sm"
                    >
                        <div className="flex items-center gap-2">
                            <Icon icon="solar:add-circle-outline" className="text-xl" />
                            Thêm doanh thu
                        </div>
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 p-3">
                    <p className="text-xs font-semibold uppercase text-emerald-700 dark:text-emerald-400">Doanh thu tiền mặt</p>
                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-300 mt-1">{formatCurrency(totalCash)}</p>
                </Card>
                <Card className="bg-cyan-50 dark:bg-cyan-950/20 border-cyan-200 dark:border-cyan-900/40 p-3">
                    <p className="text-xs font-semibold uppercase text-cyan-700 dark:text-cyan-400">Doanh thu tài khoản</p>
                    <p className="text-xl font-bold text-cyan-600 dark:text-cyan-300 mt-1">{formatCurrency(totalBank)}</p>
                </Card>
                <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40 p-3">
                    <p className="text-xs font-semibold uppercase text-blue-700 dark:text-blue-400">Tổng thu thực tế</p>
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-300 mt-1">{formatCurrency(totalActual)}</p>
                </Card>
                <Card className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/40 p-3">
                    <p className="text-xs font-semibold uppercase text-purple-700 dark:text-purple-400">Doanh thu hệ thống</p>
                    <p className="text-xl font-bold text-purple-600 dark:text-purple-300 mt-1">{formatCurrency(totalSystem)}</p>
                </Card>
                <Card className={`p-3 ${totalDiff >= 0 ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40' : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40'}`}>
                    <p className={`text-xs font-semibold uppercase ${totalDiff >= 0 ? 'text-amber-700 dark:text-amber-400' : 'text-red-700 dark:text-red-400'}`}>Chênh lệch</p>
                    <p className={`text-xl font-bold mt-1 ${totalDiff >= 0 ? 'text-amber-600 dark:text-amber-300' : 'text-red-600 dark:text-red-400'}`}>{formatCurrency(totalDiff)}</p>
                </Card>
            </div>

            {/* Main Table */}
            <Card className="p-0 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <Table hoverable className="w-full text-sm">
                        <Table.Head className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold uppercase text-center border-b dark:border-gray-600 text-xs tracking-wider">
                            <Table.HeadCell className="py-3.5 text-left">NGÀY</Table.HeadCell>
                            <Table.HeadCell className="py-3.5 text-right">TIỀN MẶT</Table.HeadCell>
                            <Table.HeadCell className="py-3.5 text-right">TIỀN TÀI KHOẢN</Table.HeadCell>
                            <Table.HeadCell className="py-3.5 text-right">TỔNG THỰC TẾ</Table.HeadCell>
                            <Table.HeadCell className="py-3.5 text-right">DOANH THU HỆ THỐNG</Table.HeadCell>
                            <Table.HeadCell className="py-3.5 text-right">CHÊNH LỆCH</Table.HeadCell>
                            <Table.HeadCell className="py-3.5 text-left">GHI CHÚ</Table.HeadCell>
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
                            ) : revenues.length === 0 ? (
                                <Table.Row>
                                    <Table.Cell colSpan={8} className="text-center py-12 text-gray-400">
                                        Không có dữ liệu doanh thu trong khoảng thời gian đã chọn
                                    </Table.Cell>
                                </Table.Row>
                            ) : (
                                revenues.map((revenue) => {
                                    const actual = (revenue.cash_revenue || 0) + (revenue.bank_revenue || 0);
                                    const sys = revenue.system_revenue || 0;
                                    const diff = actual - sys;
                                    const dateStr = revenue.revenue_date || revenue.date;

                                    return (
                                        <Table.Row key={revenue.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <Table.Cell className="font-semibold text-gray-900 dark:text-white whitespace-nowrap text-left py-4 text-[14px]">
                                                {formatDate(dateStr)}
                                            </Table.Cell>
                                            <Table.Cell className="text-right whitespace-nowrap font-medium text-emerald-600 dark:text-emerald-400 py-4 text-[14px]">
                                                {formatCurrency(revenue.cash_revenue || 0)}
                                            </Table.Cell>
                                            <Table.Cell className="text-right whitespace-nowrap font-medium text-cyan-600 dark:text-cyan-400 py-4 text-[14px]">
                                                {formatCurrency(revenue.bank_revenue || 0)}
                                            </Table.Cell>
                                            <Table.Cell className="text-right font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap py-4 text-[14px]">
                                                {formatCurrency(actual)}
                                            </Table.Cell>
                                            <Table.Cell className="text-right whitespace-nowrap text-purple-600 dark:text-purple-400 py-4 text-[14px]">
                                                {formatCurrency(sys)}
                                            </Table.Cell>
                                            <Table.Cell className={`text-right font-bold whitespace-nowrap py-4 text-[14px] ${diff >= 0 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                                                {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
                                            </Table.Cell>
                                            <Table.Cell className="text-left text-gray-600 dark:text-gray-300 max-w-[200px] truncate py-4 text-[13px]">
                                                {revenue.note || revenue.description || '-'}
                                            </Table.Cell>
                                            <Table.Cell className="text-center whitespace-nowrap py-4">
                                                <div className="flex justify-center items-center gap-2">
                                                    <Button size="xs" color="light" onClick={() => handleEdit(revenue)} className="p-1.5 hover:bg-blue-50 border-gray-200">
                                                        <Icon icon="solar:pen-2-outline" className="text-blue-600 text-base" />
                                                    </Button>
                                                    <Button size="xs" color="light" onClick={() => handleDelete(revenue.id)} className="p-1.5 hover:bg-red-50 border-gray-200">
                                                        <Icon icon="solar:trash-bin-trash-outline" className="text-red-600 text-base" />
                                                    </Button>
                                                </div>
                                            </Table.Cell>
                                        </Table.Row>
                                    );
                                })
                            )}
                        </Table.Body>
                    </Table>
                </div>

                {revenues.length > 0 && (
                    <div className="flex justify-between items-center px-4 py-3.5 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
                        <span>Tổng cộng: <strong>{revenues.length}</strong> ngày có ghi nhận</span>
                        <span>Tổng thu thực tế: <strong className="text-blue-600 dark:text-blue-400">{formatCurrency(totalActual)}</strong></span>
                    </div>
                )}
            </Card>

            {/* Create/Edit Modal */}
            <Modal show={modalOpen} onClose={() => setModalOpen(false)} size="md">
                <form onSubmit={handleSubmit}>
                    <Modal.Header>
                        {editingRevenue ? 'Chỉnh sửa doanh thu' : 'Thêm doanh thu mới'}
                    </Modal.Header>
                    <Modal.Body>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="revenue_date" value="Ngày ghi nhận (*)" className="mb-1 block font-medium" />
                                <input
                                    type="date"
                                    id="revenue_date"
                                    value={formData.revenue_date}
                                    onChange={(e) => setFormData({ ...formData, revenue_date: e.target.value })}
                                    required
                                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm"
                                />
                            </div>

                            <div>
                                <Label htmlFor="cash_revenue" value="Doanh thu tiền mặt (VNĐ)" className="mb-1 block font-medium text-emerald-700 dark:text-emerald-400" />
                                <TextInput
                                    id="cash_revenue"
                                    type="number"
                                    value={formData.cash_revenue}
                                    onChange={(e) => setFormData({ ...formData, cash_revenue: Number(e.target.value) })}
                                    placeholder="0"
                                    min={0}
                                />
                            </div>

                            <div>
                                <Label htmlFor="bank_revenue" value="Doanh thu tiền tài khoản (VNĐ)" className="mb-1 block font-medium text-cyan-700 dark:text-cyan-400" />
                                <TextInput
                                    id="bank_revenue"
                                    type="number"
                                    value={formData.bank_revenue}
                                    onChange={(e) => setFormData({ ...formData, bank_revenue: Number(e.target.value) })}
                                    placeholder="0"
                                    min={0}
                                />
                            </div>

                            <div>
                                <Label htmlFor="system_revenue" value="Doanh thu hệ thống (VNĐ)" className="mb-1 block font-medium text-purple-700 dark:text-purple-400" />
                                <TextInput
                                    id="system_revenue"
                                    type="number"
                                    value={formData.system_revenue}
                                    onChange={(e) => setFormData({ ...formData, system_revenue: Number(e.target.value) })}
                                    placeholder="0"
                                    min={0}
                                />
                            </div>

                            {/* Live calculation preview */}
                            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 space-y-1.5 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-300">Tổng thu thực tế (Tiền mặt + TK):</span>
                                    <strong className="text-blue-600 dark:text-blue-400">{formatCurrency(modalActualTotal)}</strong>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-300">Chênh lệch với hệ thống:</span>
                                    <strong className={modalDiff >= 0 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}>
                                        {formatCurrency(modalDiff)}
                                    </strong>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="note" value="Ghi chú (không bắt buộc)" className="mb-1 block font-medium" />
                                <Textarea
                                    id="note"
                                    placeholder="Nhập ghi chú chi tiết..."
                                    rows={2}
                                    value={formData.note}
                                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
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
