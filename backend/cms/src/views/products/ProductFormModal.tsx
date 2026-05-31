/* eslint-disable react-refresh/only-export-components */
/**
 * Product Form Modal — create/edit product with category, menu, pricing, image selection.
 * Sub-components extracted to ProductFormFields.tsx for maintainability.
 */
import { useState, useEffect, useRef } from 'react';
import { Button, Modal, ToggleSwitch } from 'flowbite-react';
import toast from 'react-hot-toast';
import { inventoryAPI } from '../../api/inventory.api';
import { categoryAPI } from '../../api/category.api';
import { useCategories } from '../../contexts/CategoryContext';
import { useMenus } from '../../contexts/MenuContext';
import type { Unit, ReceiptType } from '../../types/api';
import type { Product } from '../../contexts/ProductContext';
import {
    ProductNameField, ProductTypeField, PriceSection, UnitField,
    ToggleFields, WarehouseSection, DescriptionField, AvatarSection,
    CategoryField, MenuField, ManagementAreaSection,
} from './ProductFormFields';

// ============================================
// TYPES
// ============================================

export interface ProductFormData {
    name: string;
    type: string;
    categoryId: number | null;
    code: string;
    sellPrice: number;
    costPrice: number;
    unit: string;
    description: string;
    channels: string[];
    menuId: number | null;
    showOnScoreboard: boolean;
}

export interface TimePricingData {
    price: number;
    intervalValue: number;
    intervalUnit: string;
    firstHourEnabled: boolean;
    specialHourEnabled: boolean;
}

export const DEFAULT_FORM_DATA: ProductFormData = {
    name: '',
    type: 'Tính tiền theo số lượng',
    categoryId: null,
    code: '',
    sellPrice: 0,
    costPrice: 0,
    unit: '',
    description: '',
    channels: ['Bán tại cửa hàng'],
    menuId: null,
    showOnScoreboard: true,
};

export const DEFAULT_TIME_PRICING: TimePricingData = {
    price: 0,
    intervalValue: 1,
    intervalUnit: 'phút',
    firstHourEnabled: false,
    specialHourEnabled: false,
};

// ============================================
// HELPERS
// ============================================

async function resolveInventoryCategoryId(name: string): Promise<number> {
    const response = await categoryAPI.getAll();
    const normalized = name.trim().toLowerCase();
    const rawData = response.data as unknown as { data?: { id: number; name: string }[] };
    const categoriesList: { id: number; name: string }[] = Array.isArray(response.data) ? response.data as { id: number; name: string }[] : rawData.data || [];
    const existing = categoriesList.find((cat) => cat.name.trim().toLowerCase() === normalized);
    if (existing) return existing.id;
    const created = await categoryAPI.create({ name });
    return created.data.id;
}

// ============================================
// PROPS
// ============================================

interface ProductFormModalProps {
    open: boolean;
    onClose: () => void;
    editingProduct: Product | null;
    units: Unit[];
    inventoryCategories: ReceiptType[];
    inventoryCategoryId: number | null;
    onInventoryCategoryChange: (id: number | null) => void;
    onSaved: () => void;
    addProduct: (payload: Record<string, unknown>) => Promise<Product>;
    updateProduct: (id: number, payload: Record<string, unknown>) => Promise<void>;
    deleteProduct: (id: number) => void;
}

// ============================================
// COMPONENT
// ============================================

const ProductFormModal = ({
    open,
    onClose,
    editingProduct,
    units,
    inventoryCategories,
    inventoryCategoryId,
    onInventoryCategoryChange,
    onSaved,
    addProduct,
    updateProduct,
    deleteProduct,
}: ProductFormModalProps) => {
    const { categories } = useCategories();
    const { menus, addProductToMenu, removeProductFromMenu } = useMenus();

    const [formData, setFormData] = useState<ProductFormData>(DEFAULT_FORM_DATA);
    const [timePricing, setTimePricing] = useState<TimePricingData>(DEFAULT_TIME_PRICING);
    const [showColorPicker, setShowColorPicker] = useState(true);
    const [selectedColor, setSelectedColor] = useState('#9CA3AF');
    const [selectedImage, setSelectedImage] = useState('');
    const [linkWarehouse, setLinkWarehouse] = useState(false);
    const [warehouseQuantity, setWarehouseQuantity] = useState(0);
    const [warehouseMinQuantity, setWarehouseMinQuantity] = useState(0);
    const [warehouseUnitPrice, setWarehouseUnitPrice] = useState(0);
    const [useUnitPriceForCost, setUseUnitPriceForCost] = useState(false);
    const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const imageInputRef = useRef<HTMLInputElement | null>(null);

    // --- Initialize form when modal opens ---

    useEffect(() => {
        if (!open) return;

        if (editingProduct) {
            setFormData({
                name: editingProduct.name,
                type: editingProduct.type,
                categoryId: editingProduct.categoryId,
                code: editingProduct.code || '',
                sellPrice: editingProduct.sellPrice || 0,
                costPrice: editingProduct.costPrice || 0,
                unit: editingProduct.unit || '',
                description: editingProduct.description || '',
                channels: editingProduct.channels || ['Bán tại cửa hàng'],
                menuId: menus.find((menu) => menu.productIds.includes(editingProduct.id))?.id || null,
                showOnScoreboard: editingProduct.showOnScoreboard ?? true,
            });
            setSelectedColor(editingProduct.color || '#9CA3AF');
            setSelectedImage(editingProduct.image || '');
            setSelectedUnitId(units.find((unit) => unit.name === editingProduct.unit)?.id || null);
            setLinkWarehouse(editingProduct.inventoryLinked ?? false);
            setWarehouseQuantity(0);
            setWarehouseMinQuantity(0);
            setWarehouseUnitPrice(0);
            setUseUnitPriceForCost(false);

            if (editingProduct.type === 'Tính tiền theo thời gian') {
                setTimePricing({
                    price: editingProduct.hourlyPrice || 0,
                    intervalValue: editingProduct.timeIntervalValue || 1,
                    intervalUnit: editingProduct.timeIntervalUnit || 'phút',
                    firstHourEnabled: editingProduct.firstHourEnabled || false,
                    specialHourEnabled: editingProduct.specialHourEnabled || false,
                });
            } else {
                setTimePricing(DEFAULT_TIME_PRICING);
            }

            // Load inventory details
            if (editingProduct.inventoryLinked && editingProduct.inventoryId) {
                inventoryAPI.getById(editingProduct.inventoryId).then((inventoryRes) => {
                    setWarehouseQuantity(inventoryRes.data.quantity || 0);
                    setWarehouseMinQuantity(inventoryRes.data.min_quantity || 0);
                }).catch(() => {
                    toast.error('Không thể tải số lượng từ kho hàng');
                });
            }
        } else {
            // Reset for create mode
            setFormData(DEFAULT_FORM_DATA);
            setTimePricing(DEFAULT_TIME_PRICING);
            setSelectedColor('#9CA3AF');
            setSelectedImage('');
            setSelectedUnitId(null);
            setLinkWarehouse(false);
            setWarehouseQuantity(0);
            setWarehouseMinQuantity(0);
            setWarehouseUnitPrice(0);
            setUseUnitPriceForCost(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, editingProduct]);

    // --- Sync cost price with unit price ---

    useEffect(() => {
        if (useUnitPriceForCost) {
            setFormData((prev) => ({ ...prev, costPrice: warehouseUnitPrice }));
        }
    }, [useUnitPriceForCost, warehouseUnitPrice]);

    // --- Image Upload ---

    const handleImageUpload = (file: File | null) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') setSelectedImage(reader.result);
        };
        reader.readAsDataURL(file);
    };

    // --- Submit ---

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error('Vui lòng nhập tên mặt hàng');
            return;
        }

        if (linkWarehouse && !editingProduct) {
            if (warehouseQuantity <= 0 || warehouseUnitPrice <= 0) {
                toast.error('Vui lòng nhập số lượng và đơn giá');
                return;
            }
            if (!selectedUnitId) {
                toast.error('Vui lòng chọn đơn vị cho kho hàng');
                return;
            }
            if (!inventoryCategoryId) {
                toast.error('Chưa có danh mục kho hàng');
                return;
            }
        }

        try {
            let inventoryId: number | undefined;
            if (linkWarehouse && !editingProduct) {
                const selectedCategory = inventoryCategories.find((cat) => cat.id === inventoryCategoryId);
                if (!selectedCategory) {
                    toast.error('Vui lòng chọn danh mục kho hàng');
                    return;
                }
                const categoryId = await resolveInventoryCategoryId(selectedCategory.name);
                const inventoryRes = await inventoryAPI.createInventory({
                    product_name: formData.name.trim(),
                    quantity: warehouseQuantity,
                    min_quantity: warehouseMinQuantity,
                    category_id: categoryId,
                    base_unit_id: selectedUnitId,
                });
                inventoryId = inventoryRes.data?.id;
            }

            const { menuId, ...productPayload } = formData;
            const payload = {
                ...productPayload,
                color: selectedColor,
                image: selectedImage || undefined,
                inventoryLinked: linkWarehouse,
                inventoryId: editingProduct?.inventoryId,
                hourlyPrice: timePricing.price,
                timeIntervalValue: timePricing.intervalValue,
                timeIntervalUnit: timePricing.intervalUnit,
                firstHourEnabled: timePricing.firstHourEnabled,
                specialHourEnabled: timePricing.specialHourEnabled,
                showOnScoreboard: formData.showOnScoreboard,
            };
            if (inventoryId) payload.inventoryId = inventoryId;

            let newProduct: Product;
            if (editingProduct) {
                newProduct = { ...payload, id: editingProduct.id } as Product;
                await updateProduct(editingProduct.id, payload);
            } else {
                newProduct = await addProduct(payload);
            }

            if (menuId) {
                const targetMenu = menus.find((menu) => menu.id === menuId);
                if (targetMenu && !targetMenu.productIds.includes(newProduct.id)) {
                    addProductToMenu(menuId, newProduct.id);
                }
            }

            toast.success(editingProduct ? 'Cập nhật mặt hàng thành công' : 'Tạo mặt hàng thành công');
            onSaved();
            onClose();
        } catch (error) {
            toast.error((error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Thao tác thất bại');
        }
    };

    // --- Delete ---

    const handleDeleteProduct = async () => {
        if (!editingProduct) return;
        try {
            if (editingProduct.inventoryLinked) {
                if (editingProduct.inventoryId) {
                    await inventoryAPI.deleteInventory(editingProduct.inventoryId);
                } else {
                    const res = await inventoryAPI.getInventories({ search: editingProduct.name });
                    const matches = (res.data || []).filter((inv: { product_name?: string; id: number }) => inv.product_name === editingProduct.name);
                    await Promise.all(matches.map((inv: { id: number }) => inventoryAPI.deleteInventory(inv.id)));
                }
            }

            menus.forEach((menu) => {
                if (menu.productIds.includes(editingProduct.id)) {
                    removeProductFromMenu(menu.id, editingProduct.id);
                }
            });

            deleteProduct(editingProduct.id);
            toast.success('Đã xóa mặt hàng');
            onClose();
            setDeleteConfirmOpen(false);
        } catch (error) {
            const detail = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
            toast.error(detail || 'Xóa mặt hàng thất bại');
        }
    };

    // --- Render ---

    return (
        <>
            <Modal show={open} size="7xl" onClose={onClose}>
                <Modal.Header>{editingProduct ? 'Chỉnh sửa mặt hàng' : 'Thêm mặt hàng'}</Modal.Header>
                <Modal.Body className="p-0">
                    <div className="flex flex-col lg:flex-row h-full">
                        {/* LEFT COLUMN — Main form fields */}
                        <div className="w-full lg:w-2/3 p-6 space-y-6 border-r border-gray-200 dark:border-gray-700">
                            <ProductNameField formData={formData} setFormData={setFormData} />
                            <ProductTypeField formData={formData} setFormData={setFormData} />
                            <PriceSection
                                formData={formData}
                                setFormData={setFormData}
                                timePricing={timePricing}
                                setTimePricing={setTimePricing}
                                useUnitPriceForCost={useUnitPriceForCost}
                            />
                            {formData.type !== 'Tính tiền theo thời gian' && (
                                <>
                                    <hr className="dark:border-gray-700" />
                                    <UnitField units={units} selectedUnitId={selectedUnitId} onUnitChange={(unitId, unitName) => {
                                        setSelectedUnitId(unitId);
                                        setFormData({ ...formData, unit: unitName });
                                    }} />
                                    <hr className="dark:border-gray-700" />
                                    <ToggleFields linkWarehouse={linkWarehouse} setLinkWarehouse={setLinkWarehouse} />
                                    <hr className="dark:border-gray-700" />
                                </>
                            )}
                            {linkWarehouse && (
                                <WarehouseSection
                                    inventoryCategories={inventoryCategories}
                                    inventoryCategoryId={inventoryCategoryId}
                                    onInventoryCategoryChange={onInventoryCategoryChange}
                                    warehouseQuantity={warehouseQuantity}
                                    setWarehouseQuantity={setWarehouseQuantity}
                                    warehouseMinQuantity={warehouseMinQuantity}
                                    setWarehouseMinQuantity={setWarehouseMinQuantity}
                                    warehouseUnitPrice={warehouseUnitPrice}
                                    setWarehouseUnitPrice={setWarehouseUnitPrice}
                                    useUnitPriceForCost={useUnitPriceForCost}
                                    setUseUnitPriceForCost={setUseUnitPriceForCost}
                                    disabled={!!editingProduct}
                                />
                            )}
                            <DescriptionField formData={formData} setFormData={setFormData} />
                        </div>

                        {/* RIGHT COLUMN — Avatar, category, menu, management */}
                        <div className="w-full lg:w-1/3 p-6 space-y-6 bg-gray-50 dark:bg-gray-800/50">
                            <AvatarSection
                                showColorPicker={showColorPicker}
                                setShowColorPicker={setShowColorPicker}
                                selectedColor={selectedColor}
                                setSelectedColor={setSelectedColor}
                                selectedImage={selectedImage}
                                setSelectedImage={setSelectedImage}
                                imageInputRef={imageInputRef}
                                onImageUpload={handleImageUpload}
                            />
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm flex justify-between items-center">
                                <span className="font-semibold text-gray-900 dark:text-white">Hiển thị ở thực đơn bảng tỉ số</span>
                                <ToggleSwitch
                                    checked={formData.showOnScoreboard}
                                    onChange={(val) => setFormData(prev => ({ ...prev, showOnScoreboard: val }))}
                                />
                            </div>
                            <CategoryField categories={categories} formData={formData} setFormData={setFormData} />
                            <MenuField menus={menus} formData={formData} setFormData={setFormData} />
                            <ManagementAreaSection />
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer className="justify-end">
                    <Button color="gray" type="button" onClick={onClose}>Hủy</Button>
                    {editingProduct && (
                        <Button color="failure" type="button" onClick={() => setDeleteConfirmOpen(true)}>Xóa</Button>
                    )}
                    <Button color="blue" type="submit" onClick={handleSubmit}>Lưu</Button>
                </Modal.Footer>
            </Modal>

            {/* Delete confirmation */}
            <Modal show={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
                <Modal.Header>Xác nhận xóa</Modal.Header>
                <Modal.Body>
                    <p className="text-sm text-gray-600">
                        Bạn có chắc muốn xóa mặt hàng "{editingProduct?.name}"?
                    </p>
                </Modal.Body>
                <Modal.Footer className="justify-end">
                    <Button color="gray" onClick={() => setDeleteConfirmOpen(false)}>Hủy</Button>
                    <Button color="failure" onClick={handleDeleteProduct}>Xóa</Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default ProductFormModal;
