import { useState, useEffect, useCallback } from 'react';
import { Badge, Button, Spinner, Table, Modal } from 'flowbite-react';
import { Icon } from '@iconify/react';
import { tournamentAPI, type TournamentTableFeePayment } from '../../../api/tournament.api';
import toast from 'react-hot-toast';

interface Props {
    tournamentId: number;
}

const formatVND = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

type StatusGroup = 'pending' | 'paid' | 'cancelled';

const STATUS_CONFIG: Record<StatusGroup, { label: string; badge: string; icon: string; textColor: string }> = {
    pending: {
        label: 'Đang chờ thanh toán',
        badge: 'warning',
        icon: 'solar:clock-circle-bold',
        textColor: 'text-yellow-600 dark:text-yellow-400',
    },
    paid: {
        label: 'Đã thanh toán',
        badge: 'success',
        icon: 'solar:check-circle-bold',
        textColor: 'text-green-600 dark:text-green-400',
    },
    cancelled: {
        label: 'Chưa thanh toán (đã hủy)',
        badge: 'gray',
        icon: 'solar:close-circle-bold',
        textColor: 'text-gray-500 dark:text-gray-400',
    },
};

interface TableFeeGroup {
    status: StatusGroup;
    items: TournamentTableFeePayment[];
}

const TournamentPaymentsTab = ({ tournamentId }: Props) => {
    const [loading, setLoading] = useState(false);
    const [tableFeePayments, setTableFeePayments] = useState<TournamentTableFeePayment[]>([]);
    const [selectedPayment, setSelectedPayment] = useState<TournamentTableFeePayment | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPaying, setIsPaying] = useState(false);

    const fetchPayments = useCallback(async () => {
        try {
            setLoading(true);
            const res = await tournamentAPI.getPayments(tournamentId);
            setTableFeePayments(res.data.tableFeePayments ?? []);
        } catch {
            toast.error('Không thể tải dữ liệu thanh toán');
        } finally {
            setLoading(false);
        }
    }, [tournamentId]);

    useEffect(() => {
        fetchPayments();
    }, [fetchPayments]);

    const handlePayCash = async () => {
        if (!selectedPayment) return;
        try {
            setIsPaying(true);
            await tournamentAPI.payTableFeeCash(selectedPayment.id);
            toast.success('Thanh toán tiền mặt thành công');
            setIsModalOpen(false);
            setSelectedPayment(null);
            fetchPayments();
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'Có lỗi xảy ra khi thanh toán';
            toast.error(msg);
        } finally {
            setIsPaying(false);
        }
    };

    const groups: TableFeeGroup[] = [
        { status: 'pending',   items: tableFeePayments.filter((p) => p.status === 'pending') },
        { status: 'paid',      items: tableFeePayments.filter((p) => p.status === 'paid') },
        { status: 'cancelled', items: tableFeePayments.filter((p) => p.status === 'cancelled') },
    ];

    const totalPaid = groups.find((g) => g.status === 'paid')?.items.reduce((s, p) => s + p.amount, 0) ?? 0;

    if (loading) {
        return (
            <div className="flex justify-center items-center py-16">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header + Stats */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Hóa đơn tiền bàn</h2>
                    <div className="flex items-center gap-2">
                        {groups.map((g) => (
                            <span key={g.status} className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                <Badge color={STATUS_CONFIG[g.status].badge as any}>{g.items.length}</Badge>
                                {g.status === 'pending' ? 'chờ' : g.status === 'paid' ? 'đã TT' : 'hủy'}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {totalPaid > 0 && (
                        <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                            Tổng thu: {formatVND(totalPaid)}
                        </span>
                    )}
                    <Button size="sm" color="light" onClick={fetchPayments}>
                        <Icon icon="solar:refresh-outline" className="mr-1.5" />
                        Làm mới
                    </Button>
                </div>
            </div>

            {tableFeePayments.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                    <Icon icon="solar:bill-list-bold" className="text-4xl mb-2 mx-auto" />
                    <p className="text-sm">Chưa có hóa đơn tiền bàn nào</p>
                </div>
            )}

            {groups.map(({ status, items }) => {
                if (items.length === 0) return null;
                const cfg = STATUS_CONFIG[status];
                return (
                    <section key={status}>
                        <p className={`text-xs font-semibold ${cfg.textColor} mb-2 flex items-center gap-1.5`}>
                            <Icon icon={cfg.icon} />
                            {cfg.label} ({items.length})
                        </p>
                        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                            <Table striped>
                                <Table.Head>
                                    <Table.HeadCell>Mã hóa đơn</Table.HeadCell>
                                    <Table.HeadCell>Trận #</Table.HeadCell>
                                    <Table.HeadCell>Số tiền</Table.HeadCell>
                                    <Table.HeadCell>Ngày tạo</Table.HeadCell>
                                    {status === 'paid' && <Table.HeadCell>Ngày thanh toán</Table.HeadCell>}
                                    <Table.HeadCell>Trạng thái</Table.HeadCell>
                                </Table.Head>
                                <Table.Body>
                                    {items.map((p) => (
                                        <Table.Row 
                                            key={p.id}
                                            className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                            onClick={() => {
                                                setSelectedPayment(p);
                                                setIsModalOpen(true);
                                            }}
                                        >
                                            <Table.Cell className="font-mono text-xs">{p.code}</Table.Cell>
                                            <Table.Cell>#{p.match_id}</Table.Cell>
                                            <Table.Cell className="font-semibold">{formatVND(p.amount)}</Table.Cell>
                                            <Table.Cell>{formatDate(p.created_at)}</Table.Cell>
                                            {status === 'paid' && <Table.Cell>{formatDate(p.paid_at)}</Table.Cell>}
                                            <Table.Cell>
                                                <Badge color={cfg.badge as any}>{cfg.label.split(' (')[0]}</Badge>
                                            </Table.Cell>
                                        </Table.Row>
                                    ))}
                                </Table.Body>
                            </Table>
                        </div>
                    </section>
                );
            })}

            {selectedPayment && (
                <Modal show={isModalOpen} onClose={() => setIsModalOpen(false)} size="md">
                    <Modal.Header>Chi tiết hóa đơn tiền bàn</Modal.Header>
                    <Modal.Body className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="text-gray-500 dark:text-gray-400">Mã hóa đơn:</div>
                            <div className="font-mono font-semibold text-gray-900 dark:text-white">{selectedPayment.code}</div>

                            <div className="text-gray-500 dark:text-gray-400">Trận đấu:</div>
                            <div className="font-semibold text-gray-900 dark:text-white">#{selectedPayment.match_id}</div>

                            <div className="text-gray-500 dark:text-gray-400">Số tiền:</div>
                            <div className="font-semibold text-green-600 dark:text-green-400 text-lg">
                                {formatVND(selectedPayment.amount)}
                            </div>

                            <div className="text-gray-500 dark:text-gray-400">Ngày tạo:</div>
                            <div className="text-gray-900 dark:text-white">{formatDate(selectedPayment.created_at)}</div>

                            {selectedPayment.paid_at && (
                                <>
                                    <div className="text-gray-500 dark:text-gray-400">Ngày thanh toán:</div>
                                    <div className="text-gray-900 dark:text-white">{formatDate(selectedPayment.paid_at)}</div>
                                </>
                            )}

                            <div className="text-gray-500 dark:text-gray-400">Trạng thái:</div>
                            <div>
                                <Badge color={STATUS_CONFIG[selectedPayment.status].badge as any}>
                                    {STATUS_CONFIG[selectedPayment.status].label}
                                </Badge>
                            </div>
                        </div>
                    </Modal.Body>
                    <Modal.Footer className="justify-end gap-2">
                        <Button color="gray" size="sm" onClick={() => setIsModalOpen(false)}>
                            Đóng
                        </Button>
                        {selectedPayment.status === 'pending' && (
                            <Button 
                                color="success" 
                                size="sm" 
                                disabled={isPaying} 
                                onClick={handlePayCash}
                            >
                                {isPaying ? 'Đang xử lý...' : 'Thanh toán tiền mặt'}
                            </Button>
                        )}
                    </Modal.Footer>
                </Modal>
            )}
        </div>
    );
};

export default TournamentPaymentsTab;
