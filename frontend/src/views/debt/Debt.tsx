import { useState, useEffect } from 'react';
import { Card, Table, Button } from 'flowbite-react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { debtAPI } from '../../api/debt.api';
import { userAPI } from '../../api/user.api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import type { Debt as DebtType, User } from '../../types/api';
import DebtFormModal, { type DebtFormData } from './DebtFormModal';
import DebtPaymentModal from './DebtPaymentModal';

const INITIAL_FORM: DebtFormData = { debtor_name: '', amount: 0, note: '', debt_date: dayjs().format('YYYY-MM-DD') };

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

    useEffect(() => { fetchDebts(); fetchUsers(); }, []);

    const fetchDebts = async () => {
        setLoading(true);
        try { setDebts((await debtAPI.getDebts({ is_paid: false })).data.data); }
        catch { toast.error('Không thể tải danh sách công nợ'); }
        finally { setLoading(false); }
    };

    const fetchUsers = async () => {
        try {
            const sorted = ((await userAPI.getUsers()).data || []).sort(
                (a: User, b: User) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
            setUsers(sorted);
        } catch { toast.error('Không thể tải danh sách nhân viên'); }
    };

    const handleCreate = () => { setEditingId(null); setFormData(INITIAL_FORM); setModalOpen(true); };

    const handleEdit = (d: DebtType) => {
        setEditingId(d.id);
        setFormData({ debtor_name: d.debtor_name, amount: d.amount, note: d.note || '', debt_date: d.debt_date || dayjs().format('YYYY-MM-DD') });
        setModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Bạn có chắc muốn xóa công nợ này?')) return;
        try { await debtAPI.delete(id); toast.success('Xóa công nợ thành công'); fetchDebts(); }
        catch (e: any) { toast.error(e.response?.data?.detail || 'Xóa công nợ thất bại'); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.debtor_name || formData.amount <= 0) { toast.error('Vui lòng điền đầy đủ thông tin'); return; }
        try {
            if (editingId) { await debtAPI.update(editingId, formData); toast.success('Cập nhật công nợ thành công'); }
            else { await debtAPI.create(formData); toast.success('Thêm công nợ thành công'); }
            setModalOpen(false); fetchDebts();
        } catch (e: any) { toast.error(e.response?.data?.detail || 'Thao tác thất bại'); }
    };

    const handlePayDebt = (d: DebtType) => { setPayingDebt(d); setPaymentMethod('cash'); setPaymentModalOpen(true); };

    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await debtAPI.update(payingDebt!.id, { is_paid: true });
            toast.success('Thu nợ thành công. Đã tự động tạo phiếu thu trong hệ thống.');
            setPaymentModalOpen(false); fetchDebts();
        } catch (e: any) { toast.error(e.response?.data?.detail || 'Thu nợ thất bại'); }
    };

    const totalDebt = debts.reduce((sum, d) => sum + d.amount, 0);

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý công nợ</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Theo dõi và quản lý các khoản nợ chưa thanh toán</p>
                </div>
                <Button onClick={handleCreate} color="blue">Thêm công nợ</Button>
            </div>

            <Card className="bg-red-50 dark:bg-red-900/20">
                <div className="flex justify-between items-center">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Tổng công nợ chưa thu:</span>
                    <span className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(totalDebt)}</span>
                </div>
            </Card>

            <Card>
                <div className="overflow-x-auto">
                    <Table>
                        <Table.Head>
                            <Table.HeadCell>Ngày nợ</Table.HeadCell>
                            <Table.HeadCell>Người nợ</Table.HeadCell>
                            <Table.HeadCell>Số tiền</Table.HeadCell>
                            <Table.HeadCell>Ghi chú</Table.HeadCell>
                            <Table.HeadCell>Người tạo</Table.HeadCell>
                            <Table.HeadCell><span className="sr-only">Actions</span></Table.HeadCell>
                        </Table.Head>
                        <Table.Body className="divide-y">
                            {loading ? (
                                <Table.Row><Table.Cell colSpan={6} className="text-center py-8">
                                    <div className="flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
                                </Table.Cell></Table.Row>
                            ) : debts.length === 0 ? (
                                <Table.Row><Table.Cell colSpan={6} className="text-center py-8 text-gray-500">Không có công nợ nào</Table.Cell></Table.Row>
                            ) : debts.map(d => (
                                <DebtRow key={d.id} debt={d} onEdit={handleEdit} onDelete={handleDelete} onPay={handlePayDebt} />
                            ))}
                        </Table.Body>
                    </Table>
                </div>
                {debts.length > 0 && (
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Tổng {debts.length} khoản nợ</span>
                    </div>
                )}
            </Card>

            <DebtFormModal open={modalOpen} onClose={() => setModalOpen(false)} isEditing={!!editingId}
                formData={formData} onFormChange={setFormData} onSubmit={handleSubmit} users={users} />

            <DebtPaymentModal open={paymentModalOpen} onClose={() => setPaymentModalOpen(false)}
                debt={payingDebt} paymentMethod={paymentMethod} onPaymentMethodChange={setPaymentMethod}
                onSubmit={handlePaymentSubmit} />
        </div>
    );
};

function DebtRow({ debt, onEdit, onDelete, onPay }: {
    debt: DebtType; onEdit: (d: DebtType) => void; onDelete: (id: number) => void; onPay: (d: DebtType) => void;
}) {
    return (
        <Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800">
            <Table.Cell className="font-medium"><strong>{formatDate(debt.debt_date || debt.created_at)}</strong></Table.Cell>
            <Table.Cell><div className="flex items-center gap-2">{debt.debtor_name}</div></Table.Cell>
            <Table.Cell className="text-red-600 dark:text-red-400 font-bold">{formatCurrency(debt.amount)}</Table.Cell>
            <Table.Cell className="text-gray-600 dark:text-gray-400">{debt.note || '-'}</Table.Cell>
            <Table.Cell className="text-gray-600 dark:text-gray-400">-</Table.Cell>
            <Table.Cell>
                <div className="flex gap-2">
                    <Button size="xs" color="success" onClick={() => onPay(debt)}>Thu nợ</Button>
                    <Button size="xs" color="info" onClick={() => onEdit(debt)}>Sửa</Button>
                    <Button size="xs" color="failure" onClick={() => onDelete(debt.id)}>Xóa</Button>
                </div>
            </Table.Cell>
        </Table.Row>
    );
}

export default Debt;
