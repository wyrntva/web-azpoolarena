import { useState, useEffect } from 'react';
import { Card, Table, TextInput, Badge, Button } from 'flowbite-react';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { receiptAPI } from '../../api/receipt.api';
import { receiptTypeAPI } from '../../api/receiptType.api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import type { Receipt, ReceiptType } from '../../types/api';
import FinanceFormModal, { type FinanceFormData } from './FinanceFormModal';

const INITIAL_FORM: FinanceFormData = {
  receipt_date: dayjs().format('YYYY-MM-DD'),
  receipt_type_id: 0,
  amount: 0,
  is_income: true,
  payment_method: 'cash',
  note: '',
};

const Finance = () => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [receiptTypes, setReceiptTypes] = useState<ReceiptType[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FinanceFormData>(INITIAL_FORM);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
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
    try {
      const res = await receiptTypeAPI.getAll({ limit: 1000, skip: 0 });
      const list = Array.isArray(res.data) ? res.data : ((res.data as any)?.data || []);
      setReceiptTypes(list);
    } catch {
      toast.error('Không thể tải danh sách loại phiếu');
    }
  };

  const fetchReceipts = async () => {
    setLoading(true);
    try {
      const res = await receiptAPI.getAll({ start_date: dateRange.start, end_date: dateRange.end });
      const list = Array.isArray(res.data) ? res.data : ((res.data as any)?.data || []);
      setReceipts(list);
    } catch {
      toast.error('Không thể tải danh sách phiếu thu/chi');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingId(null);
    setFormData({ ...INITIAL_FORM, receipt_type_id: receiptTypes[0]?.id || 0 });
    setModalOpen(true);
  };

  const handleEdit = (r: Receipt) => {
    setEditingId(r.id);
    setFormData({
      receipt_date: r.receipt_date ? dayjs(r.receipt_date).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
      receipt_type_id: r.receipt_type_id,
      amount: r.amount,
      is_income: r.is_income,
      payment_method: r.payment_method,
      note: r.note || '',
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa phiếu này?')) return;
    try {
      await receiptAPI.delete(id);
      toast.success('Xóa phiếu thành công');
      fetchReceipts();
    } catch (e) {
      toast.error((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Xóa phiếu thất bại');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount <= 0 || !formData.receipt_type_id) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }
    try {
      if (editingId) {
        await receiptAPI.update(editingId, formData);
        toast.success('Cập nhật phiếu thành công');
      } else {
        await receiptAPI.create(formData);
        toast.success('Thêm phiếu thành công');
      }
      setModalOpen(false);
      fetchReceipts();
    } catch (e) {
      toast.error((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Thao tác thất bại');
    }
  };

  const filteredReceipts = receipts.filter((r) => {
    if (filterType === 'income' && !r.is_income) return false;
    if (filterType === 'expense' && r.is_income) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const typeName = receiptTypes.find((t) => t.id === r.receipt_type_id)?.name?.toLowerCase() || '';
      const note = (r.note || '').toLowerCase();
      const creator = (r.created_by_user?.full_name || '').toLowerCase();
      return typeName.includes(term) || note.includes(term) || creator.includes(term);
    }
    return true;
  });

  const totals = receipts.reduce(
    (acc, r) => {
      if (r.is_income) acc.income += r.amount;
      else acc.expense += r.amount;
      return acc;
    },
    { income: 0, expense: 0 }
  );
  const net = totals.income - totals.expense;

  return (
    <div className="pt-0 px-6 pb-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-[16px] font-semibold uppercase text-[#37393E] dark:text-white flex items-center gap-2">
            QUẢN LÝ THU CHI
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCreate}
            className="bg-[#C6010B] hover:bg-[#C6010B]/90 text-white font-medium px-4 py-2.5 rounded-[24px] flex items-center justify-center transition-colors cursor-pointer text-sm"
          >
            <div className="flex items-center gap-2">
              <Icon icon="solar:add-circle-outline" className="text-xl" />
              Thêm phiếu
            </div>
          </button>
        </div>
      </div>

      {/* Top 3 KPI Summary Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm md:text-[15px] font-medium text-gray-600 dark:text-gray-300">
            Tổng thu trong kỳ
          </p>
          <p className="text-xl md:text-2xl font-bold text-green-600 dark:text-green-500 mt-1.5">
            {formatCurrency(totals.income)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm md:text-[15px] font-medium text-gray-600 dark:text-gray-300">
            Tổng chi trong kỳ
          </p>
          <p className="text-xl md:text-2xl font-bold text-red-600 dark:text-red-500 mt-1.5">
            {formatCurrency(totals.expense)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm md:text-[15px] font-medium text-gray-600 dark:text-gray-300">
            Thu chi ròng (Lợi nhuận)
          </p>
          <p className={`text-xl md:text-2xl font-bold mt-1.5 ${net >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-500'}`}>
            {formatCurrency(net)}
          </p>
        </div>
      </div>

      {/* Main Card with TempReport styling */}
      <Card className="overflow-hidden rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-0">
        {/* Filters & Search Toolbar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-4 border-b dark:border-gray-700">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
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

            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 p-0.5 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${filterType === 'all' ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}
              >
                Tất cả
              </button>
              <button
                type="button"
                onClick={() => setFilterType('income')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${filterType === 'income' ? 'bg-green-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}
              >
                Thu
              </button>
              <button
                type="button"
                onClick={() => setFilterType('expense')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${filterType === 'expense' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}
              >
                Chi
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <TextInput
              id="search"
              type="text"
              placeholder="Tìm kiếm danh mục, ghi chú..."
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
              <Table.HeadCell className="py-3.5 text-center">LOẠI</Table.HeadCell>
              <Table.HeadCell className="py-3.5 text-left">DANH MỤC</Table.HeadCell>
              <Table.HeadCell className="py-3.5 text-center">PHƯƠNG THỨC</Table.HeadCell>
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
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    </div>
                  </Table.Cell>
                </Table.Row>
              ) : filteredReceipts.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={8} className="text-center py-12 text-gray-400">
                    Không có dữ liệu phiếu thu/chi trong khoảng thời gian đã chọn
                  </Table.Cell>
                </Table.Row>
              ) : (
                filteredReceipts.map((r) => (
                  <ReceiptRow
                    key={r.id}
                    receipt={r}
                    receiptTypes={receiptTypes}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </Table.Body>
          </Table>
        </div>

        {filteredReceipts.length > 0 && (
          <div className="flex justify-between items-center px-4 py-3.5 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
            <span>Tổng cộng: <strong>{filteredReceipts.length}</strong> phiếu ghi nhận</span>
            <span>Lợi nhuận: <strong className={net >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}>{formatCurrency(net)}</strong></span>
          </div>
        )}
      </Card>

      <FinanceFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        isEditing={!!editingId}
        formData={formData}
        onFormChange={setFormData}
        onSubmit={handleSubmit}
        receiptTypes={receiptTypes}
      />
    </div>
  );
};

function ReceiptRow({
  receipt,
  receiptTypes,
  onEdit,
  onDelete,
}: {
  receipt: Receipt;
  receiptTypes: ReceiptType[];
  onEdit: (r: Receipt) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <Table.Row className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
      <Table.Cell className="font-semibold text-gray-900 dark:text-white whitespace-nowrap text-left py-4 text-[14px]">
        {formatDate(receipt.receipt_date)}
      </Table.Cell>
      <Table.Cell className="text-center whitespace-nowrap py-4">
        <span
          className={`inline-block px-3 py-1 rounded-md text-xs font-semibold ${
            receipt.is_income
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
              : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
          }`}
        >
          {receipt.is_income ? 'Thu' : 'Chi'}
        </span>
      </Table.Cell>
      <Table.Cell className="text-left font-medium text-gray-800 dark:text-gray-200 py-4 text-[14px]">
        {receiptTypes.find((t) => t.id === receipt.receipt_type_id)?.name || '-'}
      </Table.Cell>
      <Table.Cell className="text-center whitespace-nowrap py-4">
        <span
          className={`inline-block px-3 py-1 rounded-md text-xs font-medium ${
            receipt.payment_method === 'cash'
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
          }`}
        >
          {receipt.payment_method === 'cash' ? 'Tiền mặt' : 'Tài khoản'}
        </span>
      </Table.Cell>
      <Table.Cell className={`text-right font-bold whitespace-nowrap py-4 text-[14px] ${receipt.is_income ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
        {formatCurrency(receipt.amount)}
      </Table.Cell>
      <Table.Cell className="text-left text-gray-600 dark:text-gray-300 max-w-[220px] truncate py-4 text-[13px]">
        {receipt.note || '-'}
      </Table.Cell>
      <Table.Cell className="text-left text-gray-600 dark:text-gray-300 whitespace-nowrap py-4 text-[13px]">
        {receipt.created_by_user?.full_name || '-'}
      </Table.Cell>
      <Table.Cell className="text-center whitespace-nowrap py-4">
        <div className="flex justify-center items-center gap-2">
          <Button size="xs" color="light" onClick={() => onEdit(receipt)} className="p-1.5 hover:bg-blue-50 border-gray-200">
            <Icon icon="solar:pen-2-outline" className="text-blue-600 text-base" />
          </Button>
          <Button size="xs" color="light" onClick={() => onDelete(receipt.id)} className="p-1.5 hover:bg-red-50 border-gray-200">
            <Icon icon="solar:trash-bin-trash-outline" className="text-red-600 text-base" />
          </Button>
        </div>
      </Table.Cell>
    </Table.Row>
  );
}

export default Finance;
