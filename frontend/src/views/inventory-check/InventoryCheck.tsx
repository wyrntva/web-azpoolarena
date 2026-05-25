import { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Label, TextInput, Badge } from 'flowbite-react';
import toast from 'react-hot-toast';
import { inventoryAPI } from '../../api/inventory.api';
import dayjs from 'dayjs';
import { formatDate } from '../../utils/formatters';
import type { Inventory } from '../../types/api';

interface CheckItem {
    inventory_id: number;
    product_name: string;
    system_quantity: number;
    actual_quantity: number;
    unit: string;
}

interface CheckReport {
    id: number;
    check_date: string;
    note?: string;
    created_by_user?: { full_name: string };
    items: {
        inventory_id: number;
        system_quantity: number;
        actual_quantity: number;
        difference: number;
    }[];
}

const InventoryCheck = () => {
    const [inventories, setInventories] = useState<Inventory[]>([]);
    const [reports, setReports] = useState<CheckReport[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState<CheckReport | null>(null);

    const [formData, setFormData] = useState({
        check_date: dayjs().format('YYYY-MM-DD'),
        note: '',
        items: [] as CheckItem[],
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [invRes, reportRes] = await Promise.all([
                inventoryAPI.getInventories(),
                inventoryAPI.getInventoryChecks(),
            ]);
            setInventories(invRes.data);
            setReports((reportRes.data || []) as CheckReport[]);
        } catch (_error) {
            toast.error('Không thể tải dữ liệu kiểm kê');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setFormData({
            check_date: dayjs().format('YYYY-MM-DD'),
            note: '',
            items: inventories.map(item => ({
                inventory_id: item.id,
                product_name: item.product_name,
                system_quantity: item.quantity,
                actual_quantity: item.quantity,
                unit: item.base_unit?.name || '',
            })),
        });
        setModalOpen(true);
    };

    const handleUpdateActual = (index: number, val: number) => {
        const newItems = [...formData.items];
        newItems[index].actual_quantity = val;
        setFormData({ ...formData, items: newItems });
    };

    const handleView = (report: CheckReport) => {
        setSelectedReport(report);
        setViewModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Bạn có chắc muốn xóa phiếu kiểm kê này?')) {
            try {
                await inventoryAPI.deleteInventoryCheck(id);
                toast.success('Xóa phiếu thành công');
                fetchData();
            } catch (_error) {
                toast.error('Xóa phiếu thất bại');
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                check_date: formData.check_date,
                note: formData.note,
                items: formData.items.map(item => ({
                    inventory_id: item.inventory_id,
                    system_quantity: item.system_quantity,
                    actual_quantity: item.actual_quantity,
                    difference: item.actual_quantity - item.system_quantity,
                })),
            };

            await inventoryAPI.createInventoryCheck(payload);
            toast.success('Tạo phiếu kiểm kê thành công');
            setModalOpen(false);
            fetchData();
        } catch (_error) {
            toast.error('Tạo phiếu thất bại');
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Kiểm kê kho
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Đối soát số lượng thực tế và cập nhật tồn kho hệ thống
                    </p>
                </div>
                <Button onClick={handleCreate} color="blue">
                    Tạo phiếu kiểm kê
                </Button>
            </div>

            <Card>
                <div className="overflow-x-auto">
                    <Table striped>
                        <Table.Head>
                            <Table.HeadCell>Ngày kiểm kê</Table.HeadCell>
                            <Table.HeadCell>Người thực hiện</Table.HeadCell>
                            <Table.HeadCell className="text-center">Số mặt hàng</Table.HeadCell>
                            <Table.HeadCell>Trạng thái</Table.HeadCell>
                            <Table.HeadCell>Ghi chú</Table.HeadCell>
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
                            ) : reports.length === 0 ? (
                                <Table.Row>
                                    <Table.Cell colSpan={6} className="text-center py-8 text-gray-500">
                                        Chưa có phiếu kiểm kê nào
                                    </Table.Cell>
                                </Table.Row>
                            ) : (
                                reports.map((report) => {
                                    const hasDiff = report.items.some(i => i.difference !== 0);
                                    return (
                                        <Table.Row key={report.id}>
                                            <Table.Cell className="font-medium">{formatDate(report.check_date)}</Table.Cell>
                                            <Table.Cell>{report.created_by_user?.full_name || '-'}</Table.Cell>
                                            <Table.Cell className="text-center">{report.items?.length || 0}</Table.Cell>
                                            <Table.Cell>
                                                <Badge color={hasDiff ? 'warning' : 'success'}>
                                                    {hasDiff ? 'Có chênh lệch' : 'Khớp 100%'}
                                                </Badge>
                                            </Table.Cell>
                                            <Table.Cell className="max-w-xs truncate">{report.note || '-'}</Table.Cell>
                                            <Table.Cell>
                                                <div className="flex gap-2">
                                                    <Button size="xs" color="gray" onClick={() => handleView(report)}>Xem</Button>
                                                    <Button size="xs" color="failure" onClick={() => handleDelete(report.id)}>Xóa</Button>
                                                </div>
                                            </Table.Cell>
                                        </Table.Row>
                                    );
                                })
                            )}
                        </Table.Body>
                    </Table>
                </div>
            </Card>

            {/* Create Modal */}
            <Modal show={modalOpen} onClose={() => setModalOpen(false)} size="4xl">
                <form onSubmit={handleSubmit}>
                    <Modal.Header>Tạo phiếu kiểm kê mới</Modal.Header>
                    <Modal.Body className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label value="Ngày kiểm kê" />
                                <input
                                    type="date"
                                    value={formData.check_date}
                                    onChange={(e) => setFormData({ ...formData, check_date: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1"
                                    required
                                />
                            </div>
                            <div>
                                <Label value="Ghi chú" />
                                <TextInput
                                    value={formData.note}
                                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                    placeholder="Ghi chú kiểm kê..."
                                />
                            </div>
                        </div>

                        <div className="max-h-96 overflow-y-auto border rounded-lg">
                            <Table>
                                <Table.Head>
                                    <Table.HeadCell>Sản phẩm</Table.HeadCell>
                                    <Table.HeadCell className="text-center w-24">Hệ thống</Table.HeadCell>
                                    <Table.HeadCell className="text-center w-32">Thực tế</Table.HeadCell>
                                    <Table.HeadCell className="text-center w-24">Chênh lệch</Table.HeadCell>
                                </Table.Head>
                                <Table.Body>
                                    {formData.items.map((item, index) => {
                                        const diff = item.actual_quantity - item.system_quantity;
                                        return (
                                            <Table.Row key={item.inventory_id}>
                                                <Table.Cell>
                                                    <p className="font-bold">{item.product_name}</p>
                                                    <p className="text-xs text-gray-400">{item.unit}</p>
                                                </Table.Cell>
                                                <Table.Cell className="text-center font-mono">{item.system_quantity}</Table.Cell>
                                                <Table.Cell className="text-center">
                                                    <TextInput
                                                        type="number"
                                                        sizing="sm"
                                                        value={item.actual_quantity}
                                                        onChange={(e) => handleUpdateActual(index, Number(e.target.value))}
                                                        className="text-center"
                                                        required
                                                    />
                                                </Table.Cell>
                                                <Table.Cell className="text-center">
                                                    <Badge color={diff === 0 ? 'success' : diff > 0 ? 'info' : 'failure'}>
                                                        {diff > 0 ? `+${diff}` : diff}
                                                    </Badge>
                                                </Table.Cell>
                                            </Table.Row>
                                        );
                                    })}
                                </Table.Body>
                            </Table>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button type="submit" color="blue">Hoàn tất kiểm kê</Button>
                        <Button color="gray" onClick={() => setModalOpen(false)}>Hủy</Button>
                    </Modal.Footer>
                </form>
            </Modal>

            {/* View Modal */}
            <Modal show={viewModalOpen} onClose={() => setViewModalOpen(false)} size="2xl">
                <Modal.Header>Chi tiết phiếu kiểm kê</Modal.Header>
                <Modal.Body className="space-y-4">
                    {selectedReport && (
                        <>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-500">Ngày:</p>
                                    <p className="font-bold">{formatDate(selectedReport.check_date)}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Người thực hiện:</p>
                                    <p className="font-bold">{selectedReport.created_by_user?.full_name || '-'}</p>
                                </div>
                            </div>

                            <Table striped>
                                <Table.Head>
                                    <Table.HeadCell>Sản phẩm</Table.HeadCell>
                                    <Table.HeadCell className="text-center">Hệ thống</Table.HeadCell>
                                    <Table.HeadCell className="text-center">Thực tế</Table.HeadCell>
                                    <Table.HeadCell className="text-center">Lệch</Table.HeadCell>
                                </Table.Head>
                                <Table.Body>
                                    {selectedReport.items.map((item, i) => {
                                        const product = inventories.find(inv => inv.id === item.inventory_id);
                                        return (
                                            <Table.Row key={i}>
                                                <Table.Cell className="font-medium">{product?.product_name || `SP #${item.inventory_id}`}</Table.Cell>
                                                <Table.Cell className="text-center">{item.system_quantity}</Table.Cell>
                                                <Table.Cell className="text-center">{item.actual_quantity}</Table.Cell>
                                                <Table.Cell className="text-center">
                                                    <span className={item.difference > 0 ? 'text-blue-600' : item.difference < 0 ? 'text-red-600' : 'text-green-600'}>
                                                        {item.difference > 0 ? `+${item.difference}` : item.difference}
                                                    </span>
                                                </Table.Cell>
                                            </Table.Row>
                                        );
                                    })}
                                </Table.Body>
                            </Table>
                        </>
                    )}
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default InventoryCheck;
