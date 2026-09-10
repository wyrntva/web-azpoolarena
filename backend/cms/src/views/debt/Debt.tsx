import { useState, useEffect } from 'react';
import { Card, Table, Button, TextInput } from 'flowbite-react';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { debtAPI } from '../../api/debt.api';
import { userAPI } from '../../api/user.api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import type { Debt as DebtType, User } from '../../types/api';
import DebtFormModal, { type DebtFormData } from './DebtFormModal';
import DebtPaymentModal from './DebtPaymentModal';

const INITIAL_FORM: DebtFormData = {
    debtor_name: '',
    amount: 0,
    note: '',
    debt_date: dayjs().format('YYYY-MM-DD'),
};

const Debt = () => {
    const [debts, setDebts] = useState<DebtType[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [payingDebt, setPayingDebt] = useState<DebtType | null>(null);
    const [formData, setFormData] = useState<DebtFormData>(INITIAL_FORM);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank'>('cash');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchDebts();
        fetchUsers();
    }, []);

    const fetchDebts = async () => {
        setLoading(true);
        try {
            const res = await debtAPI.getDebts({ is_paid: false });
            const list = Array.isArray(res.data) ? res.data : ((res.data as any)?.data || []);
            setDebts(list);
        } catch {
            toast.error('Không thể tải danh sách công nợ');
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const sorted = ((await userAPI.getUsers()).data || []).sort(
                (a: User, b: User) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
            setUsers(sorted);
        } catch {
            toast.error('Không thể tải danh sách nhân viên');
        }
    };

    const handleCreate = () => {
        setEditingId(null);
        setFormData(INITIAL_FORM);
        setModalOpen(true);
    };

    const handleEdit = (d: DebtType) => {
        setEditingId(d.id);
        setFormData({
            debtor_name: d.debtor_name,
            amount: d.amount,
            note: d.note || '',
            debt_date: d.debt_date ? dayjs(d.debt_date).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
        });
        setModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Bạn có chắc muốn xóa công nợ này?')) return;
        try {
            await debtAPI.delete(id);
            toast.success('Xóa công nợ thành công');
            fetchDebts();
        } catch (e) {
            toast.error((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Xóa công nợ thất bại');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.debtor_name || formData.amount <= 0) {
            toast.error('Vui lòng điền đầy đủ thông tin');
            return;
        }
        try {
            if (editingId) {
                await debtAPI.update(editingId, formData);
                toast.success('Cập nhật công nợ thành công');
            } else {
                await debtAPI.create(formData);
                toast.success('Thêm công nợ thành công');
            }
            setModalOpen(false);
            fetchDebts();
        } catch (e) {
            toast.error((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Thao tác thất bại');
        }
    };

    const handlePayDebt = (d: DebtType) => {
        setPayingDebt(d);
        setPaymentMethod('cash');
        setPaymentModalOpen(true);
    };

    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await debtAPI.update(payingDebt!.id, { is_paid: true });
            toast.success('Thu nợ thành công. Đã tự động cập nhật công nợ.');
            setPaymentModalOpen(false);
            fetchDebts();
        } catch (e) {
            toast.error((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Thu nợ thất bại');
        }
    };

    const filteredDebts = debts.filter((d) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        const debtor = (d.debtor_name || '').toLowerCase();
        const note = (d.note || '').toLowerCase();
        return debtor.includes(term) || note.includes(term);
    });

    const totalDebt = debts.reduce((sum, d) => sum + (d.amount || 0), 0);
    const avgDebt = debts.length > 0 ? Math.round(totalDebt / debts.length) : 0;

    return (
        <div className="pt-0 px-6 pb-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-[16px] font-semibold uppercase text-[#37393E] dark:text-white flex items-center gap-2">
                        QUẢN LÝ DANH SÁCH CÔNG NỢ
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleCreate}
                        className="bg-[#C6010B] hover:bg-[#C6010B]/90 text-white font-medium px-4 py-2.5 rounded-[24px] flex items-center justify-center transition-colors cursor-pointer text-sm"
                    >
                        <div className="flex items-center gap-2">
                            <Icon icon="solar:add-circle-outline" className="text-xl" />
                            Thêm công nợ
                        </div>
                    </button>
                </div>
            </div>

            {/* Top 3 KPI Summary Boxes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <p className="text-sm md:text-[15px] font-medium text-gray-600 dark:text-gray-300">
                        Tổng công nợ chưa thu
                    </p>
                    <p className="text-xl md:text-2xl font-bold text-red-600 dark:text-red-500 mt-1.5">
                        {formatCurrency(totalDebt)}
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <p className="text-sm md:text-[15px] font-medium text-gray-600 dark:text-gray-300">
                        Số khoản nợ đang tồn
                    </p>
                    <p className="text-xl md:text-2xl font-bold text-amber-600 dark:text-amber-500 mt-1.5">
                        {debts.length} khoản
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <p className="text-sm md:text-[15px] font-medium text-gray-600 dark:text-gray-300">
                        Bình quân mỗi khoản nợ
                    </p>
                    <p className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-500 mt-1.5">
                        {formatCurrency(avgDebt)}
                    </p>
                </div>
            </div>

            {/* Main Card with TempReport styling */}
            <Card className="overflow-hidden rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-0">
                {/* Filters & Search Toolbar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-4 border-b dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                            Trạng thái:
                        </span>
                        <span className="bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 text-xs px-2.5 py-1 rounded-full font-medium">
                            Chưa thanh toán ({debts.length})
                        </span>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <TextInput
                            id="search"
                            type="text"
                            placeholder="Tìm kiếm người nợ, ghi chú..."
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
                            <Table.HeadCell className="py-3.5 text-left">NGÀY NỢ</Table.HeadCell>
                            <Table.HeadCell className="py-3.5 text-left">NGƯỜI NỢ</Table.HeadCell>
                            <Table.HeadCell className="py-3.5 text-right">SỐ TIỀN</Table.HeadCell>
                            <Table.HeadCell className="py-3.5 text-left">GHI CHÚ</Table.HeadCell>
                            <Table.HeadCell className="py-3.5 text-center">THAO TÁC</Table.HeadCell>
                        </Table.Head>
                        <Table.Body className="divide-y divide-gray-200 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
                            {loading ? (
                                <Table.Row>
                                    <Table.Cell colSpan={5} className="text-center py-12">
                                        <div className="flex justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                                        </div>
                                    </Table.Cell>
                                </Table.Row>
                            ) : filteredDebts.length === 0 ? (
                                <Table.Row>
                                    <Table.Cell colSpan={5} className="text-center py-12 text-gray-400">
                                        Không có dữ liệu công nợ nào
                                    </Table.Cell>
                                </Table.Row>
                            ) : (
                                filteredDebts.map((d) => (
                                    <DebtRow
                                        key={d.id}
                                        debt={d}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        onPay={handlePayDebt}
                                    />
                                ))
                            )}
                        </Table.Body>
                    </Table>
                </div>

                {filteredDebts.length > 0 && (
                    <div className="flex justify-between items-center px-4 py-3.5 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
                        <span>Tổng cộng: <strong>{filteredDebts.length}</strong> khoản nợ</span>
                        <span>Tổng nợ: <strong className="text-red-600 dark:text-red-400">{formatCurrency(totalDebt)}</strong></span>
                    </div>
                )}
            </Card>

            <DebtFormModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                isEditing={!!editingId}
                formData={formData}
                onFormChange={setFormData}
                onSubmit={handleSubmit}
                users={users}
            />

            <DebtPaymentModal
                open={paymentModalOpen}
                onClose={() => setPaymentModalOpen(false)}
                debt={payingDebt}
                paymentMethod={paymentMethod}
                onPaymentMethodChange={setPaymentMethod}
                onSubmit={handlePaymentSubmit}
            />
        </div>
    );
};

function DebtRow({
    debt,
    onEdit,
    onDelete,
    onPay,
}: {
    debt: DebtType;
    onEdit: (d: DebtType) => void;
    onDelete: (id: number) => void;
    onPay: (d: DebtType) => void;
}) {
    return (
        <Table.Row className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <Table.Cell className="font-semibold text-gray-900 dark:text-white whitespace-nowrap text-left py-4 text-[14px]">
                {formatDate(debt.debt_date || debt.created_at)}
            </Table.Cell>
            <Table.Cell className="text-left font-bold text-gray-900 dark:text-white py-4 text-[14px]">
                <div className="flex items-center gap-2">
                    <Icon icon="solar:user-bold" className="text-gray-400 text-base" />
                    <span>{debt.debtor_name}</span>
                </div>
            </Table.Cell>
            <Table.Cell className="text-right font-bold text-red-600 dark:text-red-400 whitespace-nowrap py-4 text-[14px]">
                {formatCurrency(debt.amount)}
            </Table.Cell>
            <Table.Cell className="text-left text-gray-600 dark:text-gray-300 max-w-[250px] truncate py-4 text-[13px]">
                {debt.note || '-'}
            </Table.Cell>
            <Table.Cell className="text-center whitespace-nowrap py-4">
                <div className="flex justify-center items-center gap-2">
                    <button
                        onClick={() => onPay(debt)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                        <Icon icon="solar:hand-money-linear" className="text-base" />
                        Thu nợ
                    </button>
                    <Button size="xs" color="light" onClick={() => onEdit(debt)} className="p-1.5 hover:bg-blue-50 border-gray-200">
                        <Icon icon="solar:pen-2-outline" className="text-blue-600 text-base" />
                    </Button>
                    <Button size="xs" color="light" onClick={() => onDelete(debt.id)} className="p-1.5 hover:bg-red-50 border-gray-200">
                        <Icon icon="solar:trash-bin-trash-outline" className="text-red-600 text-base" />
                    </Button>
                </div>
            </Table.Cell>
        </Table.Row>
    );
}

export default Debt;
