import { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Label, TextInput, Select, Badge, Tabs } from 'flowbite-react';
import toast from 'react-hot-toast';
import { inventoryAPI } from '../../api/inventory.api';
import dayjs from 'dayjs';

interface Inventory {
    id: number;
    product_name: string;
    quantity: number;
    min_quantity: number;
    base_unit?: { name: string };
    large_unit?: { name: string };
    conversion_rate?: number;
}

interface TransactionItem {
    inventory_id: number;
    quantity: number;
    unit_type: 'base' | 'large';
    price?: number;
    payment_method?: 'cash' | 'bank';
}

const InventoryTransaction = () => {
    const [inventories, setInventories] = useState<Inventory[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    // const [activeTab, setActiveTab] = useState(0);
    const [transactionType, setTransactionType] = useState<'in' | 'out'>('in');

    const [formData, setFormData] = useState({
        date: dayjs().format('YYYY-MM-DD'),
        note: '',
        items: [] as TransactionItem[],
    });

    useEffect(() => {
        fetchInventories();
    }, []);

    const fetchInventories = async () => {
        setLoading(true);
        try {
            const response = await inventoryAPI.getInventories({ page: 1, page_size: 1000 });
            setInventories(response.data.data);
        } catch (error) {
            toast.error('Không thể tải danh sách sản phẩm');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (type: 'in' | 'out') => {
        setTransactionType(type);
        setFormData({
            date: dayjs().format('YYYY-MM-DD'),
            note: '',
            items: [{
                inventory_id: 0,
                quantity: 1,
                unit_type: 'base',
                price: 0,
                payment_method: 'cash'
            }],
        });
        setModalOpen(true);
    };

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, {
                inventory_id: 0,
                quantity: 1,
                unit_type: 'base',
                price: 0,
                payment_method: 'cash'
            }]
        });
    };

    const removeItem = (index: number) => {
        const newItems = [...formData.items];
        newItems.splice(index, 1);
        setFormData({ ...formData, items: newItems });
    };

    const updateItem = (index: number, field: keyof TransactionItem, value: any) => {
        const newItems = [...formData.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setFormData({ ...formData, items: newItems });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.items.some(i => i.inventory_id === 0)) {
            toast.error('Vui lòng chọn sản phẩm cho tất cả các mục');
            return;
        }

        try {
            if (transactionType === 'in') {
                const payload = {
                    import_date: formData.date,
                    note: formData.note,
                    items: formData.items.map(i => ({
                        inventory_id: i.inventory_id,
                        quantity: i.quantity,
                        unit_type: i.unit_type,
                        price: i.price,
                        payment_method: i.payment_method
                    }))
                };
                await inventoryAPI.createInventoryIn(payload);
                toast.success('Nhập kho thành công');
            } else {
                const payload = {
                    export_date: formData.date,
                    note: formData.note,
                    items: formData.items.map(i => ({
                        inventory_id: i.inventory_id,
                        quantity: i.quantity,
                        unit_type: i.unit_type
                    }))
                };
                await inventoryAPI.createInventoryOut(payload);
                toast.success('Xuất kho thành công');
            }
            setModalOpen(false);
            fetchInventories();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Thao tác thất bại');
        }
    };

    const columns = [
        {
            title: 'Tên sản phẩm',
            render: (item: Inventory) => <strong>{item.product_name}</strong>
        },
        {
            title: 'Tồn kho hiện tại',
            render: (item: Inventory) => (
                <Badge color={item.quantity <= 0 ? 'failure' : item.quantity <= item.min_quantity ? 'warning' : 'success'}>
                    {item.quantity} {item.base_unit?.name}
                </Badge>
            )
        },
        {
            title: 'Đơn vị cơ bản',
            render: (item: Inventory) => item.base_unit?.name || '-'
        },
        {
            title: 'Đơn vị lớn',
            render: (item: Inventory) => item.large_unit ? `1 ${item.large_unit.name} = ${item.conversion_rate} ${item.base_unit?.name}` : '-'
        }
    ];

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Xuất nhập kho
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Quản lý phiếu nhập và xuất kho hàng hóa
                    </p>
                </div>
            </div>

            <Card>
                <Tabs
                    aria-label="Inventory Tabs"
                    variant="underline"
                >
                    <Tabs.Item active title="Nhập kho">
                        <div className="pt-4 space-y-4">
                            <div className="flex justify-end">
                                <Button color="success" onClick={() => handleOpenModal('in')}>
                                    Tạo phiếu nhập
                                </Button>
                            </div>
                            <InventoryTable loading={loading} inventories={inventories} columns={columns} />
                        </div>
                    </Tabs.Item>
                    <Tabs.Item title="Xuất kho">
                        <div className="pt-4 space-y-4">
                            <div className="flex justify-end">
                                <Button color="failure" onClick={() => handleOpenModal('out')}>
                                    Tạo phiếu xuất
                                </Button>
                            </div>
                            <InventoryTable loading={loading} inventories={inventories} columns={columns} />
                        </div>
                    </Tabs.Item>
                </Tabs>
            </Card>

            <Modal show={modalOpen} onClose={() => setModalOpen(false)} size="4xl">
                <form onSubmit={handleSubmit}>
                    <Modal.Header>
                        <span className={transactionType === 'in' ? 'text-green-600' : 'text-red-600'}>
                            {transactionType === 'in' ? 'Tạo phiếu nhập kho' : 'Tạo phiếu xuất kho'}
                        </span>
                    </Modal.Header>
                    <Modal.Body className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label value="Ngày giao dịch" />
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1"
                                    required
                                />
                            </div>
                            <div>
                                <Label value="Ghi chú" />
                                <TextInput
                                    placeholder="Nhập ghi chú (không bắt buộc)"
                                    value={formData.note}
                                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b pb-2">
                                <h3 className="font-bold">Danh sách sản phẩm</h3>
                                <Button size="xs" color="gray" onClick={addItem}>
                                    Thêm dòng
                                </Button>
                            </div>

                            {formData.items.map((item, index) => {
                                const product = inventories.find(p => p.id === item.inventory_id);
                                return (
                                    <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg relative">
                                        <div className="md:col-span-4">
                                            <Label value="Sản phẩm" />
                                            <Select
                                                value={item.inventory_id}
                                                onChange={(e) => updateItem(index, 'inventory_id', Number(e.target.value))}
                                                required
                                            >
                                                <option value={0}>Chọn sản phẩm</option>
                                                {inventories.map(p => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.product_name} {transactionType === 'out' ? `(Tồn: ${p.quantity})` : ''}
                                                    </option>
                                                ))}
                                            </Select>
                                        </div>

                                        <div className="md:col-span-2">
                                            <Label value="Số lượng" />
                                            <TextInput
                                                type="number"
                                                min={1}
                                                value={item.quantity}
                                                onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                                                required
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <Label value="Đơn vị" />
                                            <Select
                                                value={item.unit_type}
                                                onChange={(e) => updateItem(index, 'unit_type', e.target.value)}
                                                required
                                            >
                                                <option value="base">{product?.base_unit?.name || 'Cơ bản'}</option>
                                                {product?.large_unit && <option value="large">{product.large_unit.name}</option>}
                                            </Select>
                                        </div>

                                        {transactionType === 'in' ? (
                                            <>
                                                <div className="md:col-span-2">
                                                    <Label value="Đơn giá" />
                                                    <TextInput
                                                        type="number"
                                                        min={0}
                                                        value={item.price}
                                                        onChange={(e) => updateItem(index, 'price', Number(e.target.value))}
                                                        required
                                                    />
                                                </div>
                                                <div className="md:col-span-1">
                                                    <Label value="P.Thức" />
                                                    <Select
                                                        value={item.payment_method}
                                                        onChange={(e) => updateItem(index, 'payment_method', e.target.value)}
                                                        required
                                                    >
                                                        <option value="cash">Tiền mặt</option>
                                                        <option value="bank">Chuyển khoản</option>
                                                    </Select>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="md:col-span-3 text-sm text-gray-500 pb-2">
                                                {product && (
                                                    <span>
                                                        Dự kiến còn: {product.quantity - (item.unit_type === 'large' ? item.quantity * (product.conversion_rate || 1) : item.quantity)}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        <div className="md:col-span-1 flex justify-end">
                                            {formData.items.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(index)}
                                                    className="text-red-600 hover:text-red-800 p-2"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button type="submit" color={transactionType === 'in' ? 'success' : 'failure'}>
                            {transactionType === 'in' ? 'Nhập kho' : 'Xuất kho'}
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

const InventoryTable = ({ loading, inventories, columns }: { loading: boolean, inventories: Inventory[], columns: any[] }) => (
    <div className="overflow-x-auto">
        <Table hoverable>
            <Table.Head>
                {columns.map((c, i) => (
                    <Table.HeadCell key={i}>{c.title}</Table.HeadCell>
                ))}
            </Table.Head>
            <Table.Body className="divide-y">
                {loading ? (
                    <Table.Row>
                        <Table.Cell colSpan={columns.length} className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        </Table.Cell>
                    </Table.Row>
                ) : inventories.length === 0 ? (
                    <Table.Row>
                        <Table.Cell colSpan={columns.length} className="text-center py-8 text-gray-500">
                            Không có dữ liệu
                        </Table.Cell>
                    </Table.Row>
                ) : (
                    inventories.map((item) => (
                        <Table.Row key={item.id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                            {columns.map((c, i) => (
                                <Table.Cell key={i}>{c.render(item)}</Table.Cell>
                            ))}
                        </Table.Row>
                    ))
                )}
            </Table.Body>
        </Table>
    </div>
);

export default InventoryTransaction;
