/* eslint-disable react-refresh/only-export-components */
/**
 * Product Form sub-components — field sections used by ProductFormModal.
 * Extracted to reduce ProductFormModal.tsx line count and improve reusability.
 */
import { Button, Card, Label, TextInput, Select, Textarea, ToggleSwitch, Checkbox, Radio } from 'flowbite-react';
import { Icon } from '@iconify/react';
import type { ProductFormData, TimePricingData } from './ProductFormModal';
import type { Unit, ReceiptType } from '../../types/api';

// ============================================
// CONSTANTS
// ============================================

const PRODUCT_COLORS = [
    '#9CA3AF', '#F59E0B', '#FCD34D', '#F87171', '#A3E635', '#D8B4FE',
    '#C084FC', '#60A5FA', '#818CF8', '#FB7185', '#9F1239', '#F472B6',
    '#0EA5E9', '#6366F1', '#FBA98C', '#F43F5E', '#0F172A', '#06B6D4'
];

// ============================================
// HELPERS (shared)
// ============================================

export function formatNumber(value: number): string {
    if (!value) return '';
    return value.toLocaleString('en-US');
}

export function parseNumberInput(input: string): number {
    const raw = input.replace(/[^0-9]/g, '');
    return raw ? Number(raw) : 0;
}

export function generateCode(name: string): string {
    return name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d").replace(/Đ/g, "D")
        .replace(/[^a-zA-Z0-9\s]/g, "")
        .split(/\s+/)
        .map((word) => word.substring(0, 2))
        .join("")
        .toUpperCase();
}

// ============================================
// SHARED PROP TYPES
// ============================================

type FormProps = { formData: ProductFormData; setFormData: React.Dispatch<React.SetStateAction<ProductFormData>> };

// ============================================
// SUB-COMPONENTS
// ============================================

export function ProductNameField({ formData, setFormData }: FormProps) {
    return (
        <div>
            <div className="mb-2 block"><Label htmlFor="productName" value="Tên mặt hàng" /></div>
            <TextInput id="productName" placeholder="Nhập tên mặt hàng" required value={formData.name}
                onChange={(e) => { const name = e.target.value; setFormData(prev => ({ ...prev, name, code: generateCode(name) })); }} />
        </div>
    );
}

export function ProductTypeField({ formData, setFormData }: FormProps) {
    return (
        <div>
            <div className="mb-2 block"><Label htmlFor="productType" value="Loại mặt hàng" /></div>
            <Select id="productType" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                <option>Tính tiền theo số lượng</option>
                <option>Tính tiền theo thời gian</option>
                <option>Dịch vụ khác</option>
            </Select>
        </div>
    );
}

export function PriceSection({ formData, setFormData, timePricing, setTimePricing, useUnitPriceForCost }: FormProps & {
    timePricing: TimePricingData; setTimePricing: React.Dispatch<React.SetStateAction<TimePricingData>>;
    useUnitPriceForCost: boolean;
}) {
    const isTimeBased = formData.type === 'Tính tiền theo thời gian';
    return (
        <div className="space-y-4">
            <div className={isTimeBased ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-1 md:grid-cols-3 gap-4'}>
                <div>
                    <Label htmlFor="productCode" value="Mã mặt hàng" className="mb-2 block" />
                    <TextInput id="productCode" placeholder="Nhập mã mặt hàng" value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })} />
                </div>
                {!isTimeBased && (
                    <>
                        <div>
                            <Label htmlFor="sellPrice" value="Giá bán" className="mb-2 block text-xs" />
                            <TextInput id="sellPrice" type="text" placeholder="0" value={formatNumber(formData.sellPrice)}
                                onChange={(e) => setFormData({ ...formData, sellPrice: parseNumberInput(e.target.value) })}
                                rightIcon={() => <span className="text-gray-500 text-sm p-2">đ</span>} />
                        </div>
                        <div>
                            <Label htmlFor="costPrice" value="Giá vốn" className="mb-2 block text-xs" />
                            <TextInput id="costPrice" type="number" placeholder="0" value={formData.costPrice || ''}
                                onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                                disabled={useUnitPriceForCost}
                                rightIcon={() => <span className="text-gray-500 text-sm p-2">đ</span>} />
                        </div>
                    </>
                )}
            </div>
            {!isTimeBased && (
                <>
                    <div className="flex items-center gap-2">
                        <Checkbox id="inputPriceOnSell" />
                        <Label htmlFor="inputPriceOnSell" className="text-sm font-normal">Nhập giá khi bán</Label>
                    </div>
                    <div>
                        <a href="#" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                            <Icon icon="solar:add-circle-outline" /> Thêm giá
                        </a>
                    </div>
                </>
            )}
            {isTimeBased && <TimePricingSection timePricing={timePricing} setTimePricing={setTimePricing} />}
        </div>
    );
}

export function TimePricingSection({ timePricing, setTimePricing }: {
    timePricing: TimePricingData; setTimePricing: React.Dispatch<React.SetStateAction<TimePricingData>>;
}) {
    return (
        <div className="space-y-4">
            <div className="text-sm text-gray-500">
                * Lưu ý: Thứ tự ưu tiên tính tiền: Khung giờ đầu tiên =&gt; Khung giờ đặc biệt =&gt; Giờ thường.
            </div>
            <Card className="shadow-sm">
                <div className="space-y-4">
                    <div className="font-semibold text-gray-900">Giờ bán thường</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="timePrice" value="Giá bán" />
                            <TextInput id="timePrice" type="text" placeholder="0" value={formatNumber(timePricing.price)}
                                onChange={(e) => setTimePricing({ ...timePricing, price: parseNumberInput(e.target.value) })}
                                rightIcon={() => <span className="text-gray-500 text-sm p-2">đ</span>} />
                        </div>
                        <div>
                            <Label htmlFor="timeInterval" value="Áp dụng mỗi khoảng thời gian" />
                            <div className="flex gap-2">
                                <TextInput id="timeInterval" type="number" min={1} value={timePricing.intervalValue}
                                    onChange={(e) => setTimePricing({ ...timePricing, intervalValue: Number(e.target.value) || 1 })} />
                                <Select value={timePricing.intervalUnit}
                                    onChange={(e) => setTimePricing({ ...timePricing, intervalUnit: e.target.value })}>
                                    <option value="phút">Phút</option>
                                    <option value="giờ">Giờ</option>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <div className="text-xs text-gray-400 italic">
                        * Lưu ý: Thời gian sử dụng nếu nhỏ hơn thời gian được thiết lập áp dụng cho giá bán thường
                        sẽ được làm tròn bằng thời gian được thiết lập áp dụng cho giá bán thường.
                    </div>
                </div>
            </Card>
            <Card className="shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="font-semibold text-gray-900">Giờ đầu tiên</div>
                    <ToggleSwitch checked={timePricing.firstHourEnabled}
                        onChange={(checked) => setTimePricing({ ...timePricing, firstHourEnabled: checked })} />
                </div>
            </Card>
            <Card className="shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="font-semibold text-gray-900">Giờ đặc biệt</div>
                    <ToggleSwitch checked={timePricing.specialHourEnabled}
                        onChange={(checked) => setTimePricing({ ...timePricing, specialHourEnabled: checked })} />
                </div>
            </Card>
        </div>
    );
}

export function UnitField({ units, selectedUnitId, onUnitChange }: {
    units: Unit[]; selectedUnitId: number | null; onUnitChange: (unitId: number | null, unitName: string) => void;
}) {
    return (
        <div>
            <div className="mb-2 block"><Label htmlFor="unit" value="Đơn vị" /></div>
            <Select id="unit" value={selectedUnitId ?? ''} onChange={(e) => {
                const unitId = e.target.value ? Number(e.target.value) : null;
                const unit = units.find((item) => item.id === unitId);
                onUnitChange(unitId, unit?.name || '');
            }}>
                <option value="">Chọn đơn vị</option>
                {units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
            </Select>
        </div>
    );
}

export function ToggleFields({ linkWarehouse, setLinkWarehouse }: { linkWarehouse: boolean; setLinkWarehouse: (v: boolean) => void }) {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Label htmlFor="printLabel" value="In tem mặt hàng" className="font-medium" />
                <ToggleSwitch checked={false} onChange={() => { }} id="printLabel" />
            </div>
            <div className="flex justify-between items-center">
                <Label htmlFor="manageCode" value="Quản lý mã" className="font-medium" />
                <ToggleSwitch checked={false} onChange={() => { }} id="manageCode" />
            </div>
            <div className="flex justify-between items-center">
                <Label htmlFor="linkWarehouse" value="Liên kết kho hàng" className="font-medium" />
                <ToggleSwitch checked={linkWarehouse} onChange={setLinkWarehouse} id="linkWarehouse" />
            </div>
            <div className="flex justify-between items-center">
                <Label htmlFor="optionGroup" value="Nhóm lựa chọn" className="font-medium" />
                <ToggleSwitch checked={false} onChange={() => { }} id="optionGroup" />
            </div>
        </div>
    );
}

export function WarehouseSection({ inventoryCategories, inventoryCategoryId, onInventoryCategoryChange, warehouseQuantity, setWarehouseQuantity, warehouseMinQuantity, setWarehouseMinQuantity, warehouseUnitPrice, setWarehouseUnitPrice, useUnitPriceForCost, setUseUnitPriceForCost, disabled }: {
    inventoryCategories: ReceiptType[]; inventoryCategoryId: number | null; onInventoryCategoryChange: (id: number | null) => void;
    warehouseQuantity: number; setWarehouseQuantity: (v: number) => void;
    warehouseMinQuantity: number; setWarehouseMinQuantity: (v: number) => void;
    warehouseUnitPrice: number; setWarehouseUnitPrice: (v: number) => void;
    useUnitPriceForCost: boolean; setUseUnitPriceForCost: (v: boolean) => void;
    disabled: boolean;
}) {
    return (
        <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <Label value="Quản lý hàng tồn" className="font-medium" />
            <div>
                <Label htmlFor="warehouseCategory" value="Danh mục kho hàng *" />
                <Select id="warehouseCategory" value={inventoryCategoryId ?? ''}
                    onChange={(e) => onInventoryCategoryChange(e.target.value ? Number(e.target.value) : null)} >
                    <option value="">Chọn danh mục</option>
                    {inventoryCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <Label htmlFor="warehouseQuantity" value="Số lượng *" />
                    <TextInput id="warehouseQuantity" type="number" min={0} value={warehouseQuantity}
                        onChange={(e) => setWarehouseQuantity(Number(e.target.value))} disabled={disabled} required />
                </div>
                <div>
                    <Label htmlFor="warehouseMinQuantity" value="Số lượng tối thiểu" />
                    <TextInput id="warehouseMinQuantity" type="number" min={0} value={warehouseMinQuantity}
                        onChange={(e) => setWarehouseMinQuantity(Number(e.target.value))} disabled={disabled} />
                </div>
                <div>
                    <Label htmlFor="warehouseUnitPrice" value="Đơn giá *" />
                    <TextInput id="warehouseUnitPrice" type="text" min={0} value={formatNumber(warehouseUnitPrice)}
                        onChange={(e) => setWarehouseUnitPrice(parseNumberInput(e.target.value))} required />
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Checkbox id="useUnitPriceForCost" checked={useUnitPriceForCost}
                    onChange={(e) => setUseUnitPriceForCost(e.target.checked)} />
                <Label htmlFor="useUnitPriceForCost" className="text-sm font-normal">Giá vốn sử dụng theo Đơn giá</Label>
            </div>
        </div>
    );
}

export function DescriptionField({ formData, setFormData }: FormProps) {
    return (
        <div>
            <div className="mb-2 block"><Label htmlFor="description" value="Mô tả" /></div>
            <Textarea id="description" placeholder="Mô tả" rows={4} value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
        </div>
    );
}

export function AvatarSection({ showColorPicker, setShowColorPicker, selectedColor, setSelectedColor, selectedImage, setSelectedImage, imageInputRef, onImageUpload }: {
    showColorPicker: boolean; setShowColorPicker: (v: boolean) => void;
    selectedColor: string; setSelectedColor: (v: string) => void;
    selectedImage: string; setSelectedImage: (v: string) => void;
    imageInputRef: React.RefObject<HTMLInputElement | null>;
    onImageUpload: (file: File | null) => void;
}) {
    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <Label value="Hình đại diện" className="block mb-3 font-semibold" />
            <div className="flex gap-6 mb-4">
                <div className="flex items-center gap-2">
                    <Radio id="colorParams" name="avatarType" value="color" checked={showColorPicker} onChange={() => setShowColorPicker(true)} />
                    <Label htmlFor="colorParams">Màu sắc</Label>
                </div>
                <div className="flex items-center gap-2">
                    <Radio id="imageType" name="avatarType" value="image" checked={!showColorPicker} onChange={() => setShowColorPicker(false)} />
                    <Label htmlFor="imageType">Hình ảnh</Label>
                </div>
            </div>
            {showColorPicker && (
                <div className="grid grid-cols-6 gap-0 rounded-md overflow-hidden border border-gray-200">
                    {PRODUCT_COLORS.map((color) => (
                        <div key={color} className="h-10 w-full cursor-pointer flex items-center justify-center relative hover:opacity-90 transition-opacity"
                            style={{ backgroundColor: color }} onClick={() => setSelectedColor(color)}>
                            {selectedColor === color && <Icon icon="solar:check-read-outline" className="text-white text-xl drop-shadow-md" />}
                        </div>
                    ))}
                </div>
            )}
            {!showColorPicker && (
                <div className="space-y-4">
                    <input ref={imageInputRef} type="file" accept="image/*" className="hidden"
                        onChange={(e) => onImageUpload(e.target.files?.[0] || null)} />
                    <div className="border rounded-lg overflow-hidden bg-gray-50 aspect-square">
                        {selectedImage
                            ? <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                            : <div className="h-full flex items-center justify-center text-gray-400">Chưa có hình ảnh</div>}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button color="blue" size="sm" onClick={() => imageInputRef.current?.click()}>Tải hình ảnh</Button>
                        {selectedImage && <Button color="gray" size="sm" onClick={() => setSelectedImage('')}>Xóa ảnh</Button>}
                    </div>
                </div>
            )}
        </div>
    );
}

export function CategoryField({ categories, formData, setFormData }: { categories: { id: number; name: string }[] } & FormProps) {
    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <div className="mb-2 block"><Label htmlFor="category" value="Danh mục" className="font-semibold" /></div>
            <Select id="category" value={formData.categoryId ?? ''}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value ? Number(e.target.value) : null })}>
                <option value="">Chọn danh mục</option>
                {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </Select>
        </div>
    );
}

export function MenuField({ menus, formData, setFormData }: { menus: { id: number; name: string }[] } & FormProps) {
    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <div className="mb-2 block"><Label htmlFor="menu" value="Thực đơn" className="font-semibold" /></div>
            <Select id="menu" value={formData.menuId ?? ''}
                onChange={(e) => setFormData({ ...formData, menuId: e.target.value ? Number(e.target.value) : null })}>
                <option value="">Chọn thực đơn</option>
                {menus.map((menu) => <option key={menu.id} value={menu.id}>{menu.name}</option>)}
            </Select>
            <p className="text-xs text-gray-500 mt-1">Thêm mặt hàng vào thực đơn để dễ dàng tìm kiếm khi bán hàng</p>
        </div>
    );
}

export function ManagementAreaSection() {
    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <div className="mb-2 block"><Label htmlFor="manageArea" value="Khu vực bar / bếp quản lý" className="font-semibold" /></div>
            <Select id="manageArea">
                <option>Chọn và tìm kiếm bar / bếp quản lý</option>
            </Select>
            <div className="mt-4 pt-4 border-t border-gray-100 relative">
                <div className="flex justify-between items-start mb-1">
                    <Label value="Bếp mặc định" className="font-medium text-gray-700" />
                    <button className="text-gray-400 hover:text-gray-600"><Icon icon="solar:close-circle-bold" /></button>
                </div>
                <ul className="list-disc list-inside text-xs text-gray-500 space-y-1">
                    <li>Mặt hàng được quản lý theo bar / bếp để chế biến.</li>
                    <li>Mặt hàng chỉ được in khi đã được gán vào bar / bếp quản lý và thiết lập kết nối với máy in.</li>
                </ul>
            </div>
        </div>
    );
}
