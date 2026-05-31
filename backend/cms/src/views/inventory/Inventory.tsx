import { useState, useEffect } from 'react';
import { Card, Table, Button, TextInput, Select, Badge } from 'flowbite-react';
import toast from 'react-hot-toast';
import { inventoryAPI } from '../../api/inventory.api';
import { unitAPI } from '../../api/unit.api';
import { receiptTypeAPI } from '../../api/receiptType.api';
import InventoryFormModal, { type InventoryFormData } from './InventoryFormModal';

interface Unit { id: number; name: string; }
interface Category { id: number; name: string; }

interface InventoryItem {
    id: number;
    product_name: string;
    quantity: number;
    min_quantity: number;
    status: 'in_stock' | 'low_stock' | 'out_of_stock';
    category_id: number;
    category?: Category;
    base_unit_id: number;
    base_unit?: Unit;
    conversion_unit_id?: number;
    large_unit?: Unit;
    conversion_rate?: number;
}

const STATUS_BADGE: Record<string, { color: string; label: string; textColor: string }> = {
    in_stock: { color: 'success', label: 'Còn hàng', textColor: 'text-green-600' },
    low_stock: { color: 'warning', label: 'Sắp hết', textColor: 'text-yellow-500' },
    out_of_stock: { color: 'failure', label: 'Hết hàng', textColor: 'text-red-600' },
};

const INITIAL_FORM: InventoryFormData = {
    product_name: '', category_id: 0, quantity: 0, min_quantity: 0,
    base_unit_id: 0, conversion_unit_id: undefined, conversion_rate: 1,
};

const Inventory = () => {
    const [inventories, setInventories] = useState<InventoryItem[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [filters, setFilters] = useState({ search: '', status: '' });
    const [currentPage, _setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [formData, setFormData] = useState<InventoryFormData>(INITIAL_FORM);
    const itemsPerPage = 50;

    useEffect(() => {
        fetchInventories();
        fetchUnits();
        fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters, currentPage]);

    const fetchInventories = async () => {
        setLoading(true);
        try {
            const response = await inventoryAPI.getInventories({
                search: filters.search, status_filter: filters.status || undefined,
                page: currentPage, page_size: itemsPerPage,
            });
            setInventories(response.data.data);
            setTotalItems(response.data.meta.total);
        } catch { toast.error('Không thể tải danh sách tồn kho'); }
        finally { setLoading(false); }
    };

    const fetchUnits = async () => {
        try { setUnits((await unitAPI.getAll({ skip: 0, limit: 1000 })).data.data); }
        catch { toast.error('Không thể tải danh sách đơn vị'); }
    };

    const fetchCategories = async () => {
        try { setCategories((await receiptTypeAPI.getAll()).data.data.filter((c: { is_inventory?: boolean }) => c.is_inventory)); }
        catch { toast.error('Không thể tải danh sách danh mục'); }
    };

    const handleCreate = () => {
        setEditingId(null);
        setFormData({ ...INITIAL_FORM, category_id: categories[0]?.id || 0, base_unit_id: units[0]?.id || 0 });
        setModalOpen(true);
    };

    const handleEdit = (item: InventoryItem) => {
        setEditingId(item.id);
        setFormData({
            product_name: item.product_name, category_id: item.category_id,
            quantity: item.quantity, min_quantity: item.min_quantity,
            base_unit_id: item.base_unit_id, conversion_unit_id: item.conversion_unit_id,
            conversion_rate: item.conversion_rate || 1,
        });
        setModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
        try { await inventoryAPI.deleteInventory(id); toast.success('Xóa sản phẩm thành công'); fetchInventories(); }
        catch (e) { toast.error((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Xóa sản phẩm thất bại'); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.product_name || !formData.category_id || !formData.base_unit_id) {
            toast.error('Vui lòng điền đầy đủ thông tin'); return;
        }
        try {
            if (editingId) { await inventoryAPI.updateInventory(editingId, formData); toast.success('Cập nhật sản phẩm thành công'); }
            else { await inventoryAPI.createInventory(formData); toast.success('Thêm sản phẩm thành công'); }
            setModalOpen(false); fetchInventories();
        } catch (e) { toast.error((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Thao tác thất bại'); }
    };

    const stats = {
        total: totalItems,
        inStock: inventories.filter(i => i.status === 'in_stock').length,
        lowStock: inventories.filter(i => i.status === 'low_stock').length,
        outOfStock: inventories.filter(i => i.status === 'out_of_stock').length,
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý tồn kho</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Theo dõi số lượng hàng hóa và cảnh báo hết hàng</p>
                </div>
                <Button onClick={handleCreate} color="blue">Thêm sản phẩm</Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Tổng SP', value: stats.total },
                    { label: 'Còn hàng', value: stats.inStock, color: 'text-green-600' },
                    { label: 'Sắp hết', value: stats.lowStock, color: 'text-yellow-500' },
                    { label: 'Hết hàng', value: stats.outOfStock, color: 'text-red-600' },
                ].map(({ label, value, color }) => (
                    <Card key={label} className="text-center">
                        <h3 className="text-xs font-medium text-gray-500 uppercase">{label}</h3>
                        <p className={`text-2xl font-bold ${color || ''}`}>{value}</p>
                    </Card>
                ))}
            </div>

            {/* Filters & Table */}
            <Card>
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="flex-1">
                        <TextInput placeholder="Tìm kiếm sản phẩm..." value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
                    </div>
                    <div className="w-full md:w-48">
                        <Select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                            <option value="">Tất cả trạng thái</option>
                            <option value="in_stock">Còn hàng</option>
                            <option value="low_stock">Sắp hết</option>
                            <option value="out_of_stock">Hết hàng</option>
                        </Select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <Table.Head>
                            <Table.HeadCell>Sản phẩm</Table.HeadCell>
                            <Table.HeadCell>Danh mục</Table.HeadCell>
                            <Table.HeadCell className="text-center">Số lượng</Table.HeadCell>
                            <Table.HeadCell className="text-center">Tối thiểu</Table.HeadCell>
                            <Table.HeadCell>Đơn vị</Table.HeadCell>
                            <Table.HeadCell>Trạng thái</Table.HeadCell>
                            <Table.HeadCell><span className="sr-only">Actions</span></Table.HeadCell>
                        </Table.Head>
                        <Table.Body className="divide-y">
                            {loading ? (
                                <Table.Row>
                                    <Table.Cell colSpan={7} className="text-center py-8">
                                        <div className="flex justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                                        </div>
                                    </Table.Cell>
                                </Table.Row>
                            ) : inventories.length === 0 ? (
                                <Table.Row>
                                    <Table.Cell colSpan={7} className="text-center py-8 text-gray-500">Không tìm thấy sản phẩm nào</Table.Cell>
                                </Table.Row>
                            ) : inventories.map(item => (
                                <InventoryRow key={item.id} item={item} onEdit={handleEdit} onDelete={handleDelete} />
                            ))}
                        </Table.Body>
                    </Table>
                </div>
            </Card>

            <InventoryFormModal open={modalOpen} onClose={() => setModalOpen(false)}
                isEditing={!!editingId} formData={formData} onFormChange={setFormData}
                onSubmit={handleSubmit} units={units} categories={categories} />
        </div>
    );
};

function InventoryRow({ item, onEdit, onDelete }: { item: InventoryItem; onEdit: (i: InventoryItem) => void; onDelete: (id: number) => void }) {
    const badge = STATUS_BADGE[item.status];
    return (
        <Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800">
            <Table.Cell className="font-medium text-gray-900 dark:text-white">{item.product_name}</Table.Cell>
            <Table.Cell>{item.category?.name || '-'}</Table.Cell>
            <Table.Cell className="text-center font-bold">
                <span className={badge.textColor}>{item.quantity}</span>
            </Table.Cell>
            <Table.Cell className="text-center text-gray-500">{item.min_quantity}</Table.Cell>
            <Table.Cell>
                {item.base_unit?.name}
                {item.large_unit && (
                    <span className="text-xs text-gray-400 block">
                        1 {item.large_unit.name} = {item.conversion_rate} {item.base_unit?.name}
                    </span>
                )}
            </Table.Cell>
            <Table.Cell>
                <Badge color={badge.color as 'success' | 'warning' | 'failure'}>{badge.label}</Badge>
            </Table.Cell>
            <Table.Cell>
                <div className="flex gap-2">
                    <Button size="xs" color="info" onClick={() => onEdit(item)}>Sửa</Button>
                    <Button size="xs" color="failure" onClick={() => onDelete(item.id)}>Xóa</Button>
                </div>
            </Table.Cell>
        </Table.Row>
    );
}

export default Inventory;
