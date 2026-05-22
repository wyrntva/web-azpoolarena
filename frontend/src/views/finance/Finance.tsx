import { useState, useEffect } from 'react';
import { Card, Table, Button, Badge } from 'flowbite-react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { receiptAPI } from '../../api/receipt.api';
import { receiptTypeAPI } from '../../api/receiptType.api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import type { Receipt, ReceiptType } from '../../types/api';
import FinanceFormModal, { type FinanceFormData } from './FinanceFormModal';

const INITIAL_FORM: FinanceFormData = {
  receipt_date: dayjs().format('YYYY-MM-DD'),
  receipt_type_id: 0, amount: 0, is_income: true,
  payment_method: 'cash', note: '',
};

const Finance = () => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [receiptTypes, setReceiptTypes] = useState<ReceiptType[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FinanceFormData>(INITIAL_FORM);
  const [dateRange, setDateRange] = useState({
    start: dayjs().startOf('month').format('YYYY-MM-DD'),
    end: dayjs().endOf('month').format('YYYY-MM-DD'),
  });

  useEffect(() => {
    fetchReceiptTypes();
    fetchReceipts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const fetchReceiptTypes = async () => {
    try { setReceiptTypes((await receiptTypeAPI.getAll({ limit: 1000, skip: 0 })).data.data); }
    catch { toast.error('Không thể tải danh sách loại phiếu'); }
  };

  const fetchReceipts = async () => {
    setLoading(true);
    try { setReceipts((await receiptAPI.getAll({ start_date: dateRange.start, end_date: dateRange.end })).data.data); }
    catch { toast.error('Không thể tải danh sách phiếu thu/chi'); }
    finally { setLoading(false); }
  };

  const handleCreate = () => {
    setEditingId(null);
    setFormData({ ...INITIAL_FORM, receipt_type_id: receiptTypes[0]?.id || 0 });
    setModalOpen(true);
  };

  const handleEdit = (r: Receipt) => {
    setEditingId(r.id);
    setFormData({
      receipt_date: r.receipt_date, receipt_type_id: r.receipt_type_id,
      amount: r.amount, is_income: r.is_income, payment_method: r.payment_method, note: r.note || '',
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa phiếu này?')) return;
    try { await receiptAPI.delete(id); toast.success('Xóa phiếu thành công'); fetchReceipts(); }
    catch (e) { toast.error((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Xóa phiếu thất bại'); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount <= 0 || !formData.receipt_type_id) { toast.error('Vui lòng điền đầy đủ thông tin'); return; }
    try {
      if (editingId) { await receiptAPI.update(editingId, formData); toast.success('Cập nhật phiếu thành công'); }
      else { await receiptAPI.create(formData); toast.success('Thêm phiếu thành công'); }
      setModalOpen(false); fetchReceipts();
    } catch (e) { toast.error((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Thao tác thất bại'); }
  };

  const totals = receipts.reduce(
    (acc, r) => {
      if (r.is_income) acc.income += r.amount;
      else acc.expense += r.amount;
      return acc;
    },
    { income: 0, expense: 0 },
  );
  const net = totals.income - totals.expense;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý thu chi</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Theo dõi các khoản thu và chi hàng ngày</p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-2 items-center">
            <input type="date" value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <span className="text-gray-500">-</span>
            <input type="date" value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <Button onClick={handleCreate} color="blue">Thêm phiếu</Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Tổng thu', value: totals.income, bg: 'bg-green-50 dark:bg-green-900/10', color: 'text-green-600 dark:text-green-500' },
          { label: 'Tổng chi', value: totals.expense, bg: 'bg-red-50 dark:bg-red-900/10', color: 'text-red-600 dark:text-red-500' },
          { label: 'Lợi nhuận', value: net, bg: 'bg-blue-50 dark:bg-blue-900/10', color: net >= 0 ? 'text-blue-600' : 'text-red-600' },
        ].map(({ label, value, bg, color }) => (
          <Card key={label} className={`text-center ${bg}`}>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</h3>
            <p className={`text-2xl font-bold ${color}`}>{formatCurrency(value)}</p>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <Table.Head>
              <Table.HeadCell>Ngày</Table.HeadCell>
              <Table.HeadCell>Loại</Table.HeadCell>
              <Table.HeadCell>Danh mục</Table.HeadCell>
              <Table.HeadCell>Phương thức</Table.HeadCell>
              <Table.HeadCell>Số tiền</Table.HeadCell>
              <Table.HeadCell>Người tạo</Table.HeadCell>
              <Table.HeadCell><span className="sr-only">Actions</span></Table.HeadCell>
            </Table.Head>
            <Table.Body className="divide-y">
              {loading ? (
                <Table.Row><Table.Cell colSpan={7} className="text-center py-8">
                  <div className="flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
                </Table.Cell></Table.Row>
              ) : receipts.length === 0 ? (
                <Table.Row><Table.Cell colSpan={7} className="text-center py-8 text-gray-500">Chưa có phiếu thu/chi nào</Table.Cell></Table.Row>
              ) : receipts.map(r => (
                <ReceiptRow key={r.id} receipt={r} receiptTypes={receiptTypes} onEdit={handleEdit} onDelete={handleDelete} />
              ))}
            </Table.Body>
          </Table>
        </div>
      </Card>

      <FinanceFormModal open={modalOpen} onClose={() => setModalOpen(false)} isEditing={!!editingId}
        formData={formData} onFormChange={setFormData} onSubmit={handleSubmit} receiptTypes={receiptTypes} />
    </div>
  );
};

function ReceiptRow({ receipt, receiptTypes, onEdit, onDelete }: {
  receipt: Receipt; receiptTypes: ReceiptType[];
  onEdit: (r: Receipt) => void; onDelete: (id: number) => void;
}) {
  return (
    <Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800">
      <Table.Cell className="font-medium"><strong>{formatDate(receipt.receipt_date)}</strong></Table.Cell>
      <Table.Cell><Badge color={receipt.is_income ? 'success' : 'failure'}>{receipt.is_income ? 'Thu' : 'Chi'}</Badge></Table.Cell>
      <Table.Cell>{receiptTypes.find(t => t.id === receipt.receipt_type_id)?.name || '-'}</Table.Cell>
      <Table.Cell><Badge color={receipt.payment_method === 'cash' ? 'info' : 'success'}>{receipt.payment_method === 'cash' ? 'Tiền mặt' : 'Tài khoản'}</Badge></Table.Cell>
      <Table.Cell className={`font-bold ${receipt.is_income ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(receipt.amount)}</Table.Cell>
      <Table.Cell className="text-gray-600">{receipt.created_by_user?.full_name || '-'}</Table.Cell>
      <Table.Cell>
        <div className="flex gap-2">
          <Button size="xs" color="info" onClick={() => onEdit(receipt)}>Sửa</Button>
          <Button size="xs" color="failure" onClick={() => onDelete(receipt.id)}>Xóa</Button>
        </div>
      </Table.Cell>
    </Table.Row>
  );
}

export default Finance;
