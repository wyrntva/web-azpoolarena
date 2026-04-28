/**
 * Product List Page — displays products in a table, opens ProductFormModal for create/edit.
 *
 * Extracted: ProductFormModal → ProductFormModal.tsx
 */
import { useState, useEffect } from 'react';
import { Button, Card, Table } from 'flowbite-react';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import { receiptTypeAPI } from '../../api/receiptType.api';
import { unitAPI } from '../../api/unit.api';
import { useCategories } from '../../contexts/CategoryContext';
import { useProducts } from '../../contexts/ProductContext';
import { formatCurrency } from '../../utils/formatters';
import type { Product } from '../../contexts/ProductContext';
import type { ReceiptType, Unit } from '../../types/api';
import ProductFormModal from './ProductFormModal';

// ============================================
// MAIN COMPONENT
// ============================================

const ProductList = () => {
    const { categories } = useCategories();
    const { addProduct, updateProduct, deleteProduct, products } = useProducts();
    const [units, setUnits] = useState<Unit[]>([]);
    const [inventoryCategories, setInventoryCategories] = useState<ReceiptType[]>([]);
    const [inventoryCategoryId, setInventoryCategoryId] = useState<number | null>(null);
    const [openModal, setOpenModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // --- Load units and inventory categories on mount ---

    useEffect(() => {
        const fetchUnits = async () => {
            try {
                const response = await unitAPI.getAll({ skip: 0, limit: 100 });
                setUnits(response.data.data);
            } catch (error) {
                toast.error('Không thể tải danh sách đơn vị');
            }
        };
        fetchUnits();
    }, []);

    useEffect(() => {
        const fetchInventoryCategories = async () => {
            try {
                const response = await receiptTypeAPI.getAll();
                const inventoryCats = response.data.data.filter((cat) => cat.is_inventory);
                setInventoryCategories(inventoryCats);
                if (inventoryCats.length > 0) setInventoryCategoryId(inventoryCats[0].id);
            } catch (error) {
                toast.error('Không thể tải danh mục kho hàng');
            }
        };
        fetchInventoryCategories();
    }, []);

    // --- Helpers ---

    const getCategoryName = (categoryId: number | null): string => {
        if (!categoryId) return '-';
        return categories.find((cat) => cat.id === categoryId)?.name || '-';
    };

    const handleOpenCreate = () => {
        setEditingProduct(null);
        setOpenModal(true);
    };

    const handleEditProduct = (product: Product) => {
        setEditingProduct(product);
        setOpenModal(true);
    };

    // --- Render ---

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Danh sách mặt hàng</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Quản lý thực đơn và hàng hóa</p>
                </div>
                <Button color="blue" onClick={handleOpenCreate}>
                    <Icon icon="solar:add-circle-bold" className="mr-2 text-xl" />
                    Thêm mặt hàng
                </Button>
            </div>

            {/* Product Table */}
            <Card>
                <div className="overflow-x-auto">
                    <Table>
                        <Table.Head>
                            <Table.HeadCell>
                                <div className="flex items-center gap-3">
                                    <span className="inline-block h-9 w-9" />
                                    <span>Tên mặt hàng</span>
                                </div>
                            </Table.HeadCell>
                            <Table.HeadCell>Danh mục</Table.HeadCell>
                            <Table.HeadCell>Loại</Table.HeadCell>
                            <Table.HeadCell>Giá bán</Table.HeadCell>
                        </Table.Head>
                        <Table.Body className="divide-y">
                            {products.length === 0 ? (
                                <Table.Row>
                                    <Table.Cell colSpan={4} className="text-center py-8 text-gray-500">
                                        Chưa có mặt hàng nào
                                    </Table.Cell>
                                </Table.Row>
                            ) : (
                                products.map((product) => (
                                    <ProductRow
                                        key={product.id}
                                        product={product}
                                        categoryName={getCategoryName(product.categoryId)}
                                        onClick={() => handleEditProduct(product)}
                                    />
                                ))
                            )}
                        </Table.Body>
                    </Table>
                </div>
            </Card>

            {/* Product Form Modal */}
            <ProductFormModal
                open={openModal}
                onClose={() => { setOpenModal(false); setEditingProduct(null); }}
                editingProduct={editingProduct}
                units={units}
                inventoryCategories={inventoryCategories}
                inventoryCategoryId={inventoryCategoryId}
                onInventoryCategoryChange={setInventoryCategoryId}
                onSaved={() => { }}
                addProduct={addProduct}
                updateProduct={updateProduct}
                deleteProduct={deleteProduct}
            />
        </div>
    );
};

export default ProductList;

// ============================================
// SUB-COMPONENT: Product Table Row
// ============================================

function ProductRow({ product, categoryName, onClick }: {
    product: Product; categoryName: string; onClick: () => void;
}) {
    const priceDisplay = product.type === 'Tính tiền theo thời gian'
        ? (product.hourlyPrice
            ? <span>{formatCurrency(product.hourlyPrice)} / {product.timeIntervalValue} {product.timeIntervalUnit}</span>
            : '-')
        : (product.sellPrice ? formatCurrency(product.sellPrice) : '-');

    return (
        <Table.Row
            className="bg-white dark:border-gray-700 dark:bg-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
            onClick={onClick}
        >
            <Table.Cell className="font-medium text-gray-900 dark:text-white">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 flex items-center justify-center text-white font-bold shrink-0"
                        style={{ backgroundColor: product.color || '#9CA3AF' }}>
                        {product.image
                            ? <img src={product.image} alt={product.name} className="h-9 w-9 object-cover" />
                            : (product.name?.charAt(0) || '?')}
                    </div>
                    <span className="pl-[10px]">{product.name}</span>
                </div>
            </Table.Cell>
            <Table.Cell>{categoryName}</Table.Cell>
            <Table.Cell>{product.type}</Table.Cell>
            <Table.Cell>{priceDisplay}</Table.Cell>
        </Table.Row>
    );
}
