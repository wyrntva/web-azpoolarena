import { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Select } from 'flowbite-react';
import toast from 'react-hot-toast';
import { inventoryAPI } from '../../api/inventory.api';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { formatCurrency, formatDate } from '../../utils/formatters';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

interface Transaction {
    id: number;
    transaction_date: string;
    transaction_type: 'in' | 'out';
    note?: string;
    created_by_user?: { full_name: string };
    details: { inventory?: { product_name?: string }; quantity?: number; unit_type?: string; price?: number }[];
}

const InventoryHistory = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [transactionType, setTransactionType] = useState<string>('');
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

    const [dateRange, setDateRange] = useState({
        start: dayjs().startOf('month').format('YYYY-MM-DD'),
        end: dayjs().endOf('month').format('YYYY-MM-DD'),
    });

    useEffect(() => {
        fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateRange, transactionType]);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const [inResponse, outResponse] = await Promise.all([
                inventoryAPI.getInventoryIns(),
                inventoryAPI.getInventoryOuts(),
            ]);

            let all: Transaction[] = [
                ...(inResponse.data as unknown as Transaction[]).map((t) => ({ ...t, transaction_type: 'in' as const })),
                ...(outResponse.data as unknown as Transaction[]).map((t) => ({ ...t, transaction_type: 'out' as const })),
            ];

            // Filter by type
            if (transactionType) {
                all = all.filter(t => t.transaction_type === transactionType);
            }

            // Filter by date
            all = all.filter(t => {
                const d = dayjs(t.transaction_date);
                return d.isSameOrAfter(dayjs(dateRange.start)) && d.isSameOrBefore(dayjs(dateRange.end));
            });

            // Sort descending
            all.sort((a, b) => dayjs(b.transaction_date).unix() - dayjs(a.transaction_date).unix());

            setTransactions(all);
        } catch (_error) {
            toast.error('Không thể tải lịch sử kho');
        } finally {
            setLoading(false);
        }
    };

    const showDetails = (t: Transaction) => {
        setSelectedTransaction(t);
        setModalOpen(true);
    };

    const stats = {
        total: transactions.length,
        in: transactions.filter(t => t.transaction_type === 'in').length,
        out: transactions.filter(t => t.transaction_type === 'out').length,
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Lịch sử kho
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Tra cứu lịch sử nhập và xuất kho hàng hóa
                    </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                    <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                    <Select
                        value={transactionType}
                        onChange={(e) => setTransactionType(e.target.value)}
                    >
                        <option value="">Tất cả</option>
                        <option value="in">Nhập kho</option>
                        <option value="out">Xuất kho</option>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="text-center">
                    <h3 className="text-xs font-medium text-gray-500 uppercase">Tổng giao dịch</h3>
                    <p className="text-2xl font-bold">{stats.total}</p>
                </Card>
                <Card className="text-center">
                    <h3 className="text-xs font-medium text-gray-500 uppercase">Số lần nhập</h3>
                    <p className="text-2xl font-bold text-green-600">{stats.in}</p>
                </Card>
                <Card className="text-center">
                    <h3 className="text-xs font-medium text-gray-500 uppercase">Số lần xuất</h3>
                    <p className="text-2xl font-bold text-red-600">{stats.out}</p>
                </Card>
            </div>

            <Card>
                <div className="overflow-x-auto">
                    <Table striped>
                        <Table.Head>
                            <Table.HeadCell>Ngày</Table.HeadCell>
                            <Table.HeadCell>Loại</Table.HeadCell>
                            <Table.HeadCell>Sản phẩm</Table.HeadCell>
                            <Table.HeadCell className="text-center">Số lượng</Table.HeadCell>
                            <Table.HeadCell>Người tạo</Table.HeadCell>
                            <Table.HeadCell>
                                <span className="sr-only">Thao tác</span>
                            </Table.HeadCell>
                        </Table.Head>
                        <Table.Body className="divide-y">
                            {loading ? (
                                <Table.Row>
                                    <Table.Cell colSpan={6} className="text-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                    </Table.Cell>
                                </Table.Row>
                            ) : transactions.length === 0 ? (
                                <Table.Row>
                                    <Table.Cell colSpan={6} className="text-center py-8 text-gray-500">
                                        Không có lịch sử trong khoảng thời gian này
                                    </Table.Cell>
                                </Table.Row>
                            ) : (
                                transactions.map((t) => (
                                    <Table.Row key={`${t.transaction_type}-${t.id}`}>
                                        <Table.Cell className="font-medium">{formatDate(t.transaction_date)}</Table.Cell>
                                        <Table.Cell>
                                            {t.transaction_type === 'in' ? 'Nhập kho' : 'Xuất kho'}
                                        </Table.Cell>
                                        <Table.Cell>
                                            {t.details?.length > 0 ? (
                                                <span>
                                                    {t.details[0]?.inventory?.product_name || 'N/A'}
                                                    {t.details.length > 1 && ` (+${t.details.length - 1} khác)`}
                                                </span>
                                            ) : '-'}
                                        </Table.Cell>
                                        <Table.Cell className="text-center">
                                            {t.details?.reduce((sum, d) => sum + (d.quantity || 0), 0)}
                                        </Table.Cell>
                                        <Table.Cell>{t.created_by_user?.full_name || '-'}</Table.Cell>
                                        <Table.Cell>
                                            <Button size="xs" color="gray" onClick={() => showDetails(t)}>
                                                Xem
                                            </Button>
                                        </Table.Cell>
                                    </Table.Row>
                                ))
                            )}
                        </Table.Body>
                    </Table>
                </div>
            </Card>

            <Modal show={modalOpen} onClose={() => setModalOpen(false)} size="2xl">
                <Modal.Header> Chi tiết phiếu {selectedTransaction?.transaction_type === 'in' ? 'nhập' : 'xuất'} kho </Modal.Header>
                <Modal.Body className="space-y-4">
                    {selectedTransaction && (
                        <>
                            <div className="grid grid-cols-2 gap-4 text-sm border-b pb-4">
                                <div>
                                    <p className="text-gray-500">Ngày giao dịch:</p>
                                    <p className="font-bold">{formatDate(selectedTransaction.transaction_date)}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Người thực hiện:</p>
                                    <p className="font-bold">{selectedTransaction.created_by_user?.full_name || '-'}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-gray-500">Ghi chú:</p>
                                    <p>{selectedTransaction.note || '---'}</p>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <Table>
                                    <Table.Head>
                                        <Table.HeadCell>Sản phẩm</Table.HeadCell>
                                        <Table.HeadCell className="text-center">Số lượng</Table.HeadCell>
                                        <Table.HeadCell>Đơn vị</Table.HeadCell>
                                        {selectedTransaction.transaction_type === 'in' && <Table.HeadCell>Giá trị</Table.HeadCell>}
                                    </Table.Head>
                                    <Table.Body className="divide-y">
                                        {selectedTransaction.details?.map((d, i) => (
                                            <Table.Row key={i}>
                                                <Table.Cell className="font-medium">{d.inventory?.product_name}</Table.Cell>
                                                <Table.Cell className="text-center">{d.quantity}</Table.Cell>
                                                <Table.Cell>{d.unit_type === 'large' ? 'Đơn vị lớn' : 'Cơ bản'}</Table.Cell>
                                                {selectedTransaction.transaction_type === 'in' && (
                                                    <Table.Cell>{d.price ? formatCurrency(d.price) : '-'}</Table.Cell>
                                                )}
                                            </Table.Row>
                                        ))}
                                    </Table.Body>
                                </Table>
                            </div>
                        </>
                    )}
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default InventoryHistory;
