/**
 * InventoryFormModal — modal form để tạo/sửa sản phẩm tồn kho.
 * Tách từ Inventory.tsx để giảm kích thước component chính.
 */
import { Button, Label, TextInput, Select } from 'flowbite-react';
import BaseDialog from '../../components/shared/BaseDialog';

interface Unit {
    id: number;
    name: string;
}

interface Category {
    id: number;
    name: string;
}

export interface InventoryFormData {
    product_name: string;
    category_id: number;
    quantity: number;
    min_quantity: number;
    base_unit_id: number;
    conversion_unit_id?: number;
    conversion_rate: number;
}

interface Props {
    open: boolean;
    onClose: () => void;
    isEditing: boolean;
    formData: InventoryFormData;
    onFormChange: (data: InventoryFormData) => void;
    onSubmit: (e: React.FormEvent) => void;
    units: Unit[];
    categories: Category[];
}

export default function InventoryFormModal({ open, onClose, isEditing, formData, onFormChange, onSubmit, units = [], categories = [] }: Props) {
    const set = (field: keyof InventoryFormData, value: any) =>
        onFormChange({ ...formData, [field]: value });

    return (
        <BaseDialog
            open={open}
            onClose={onClose}
            title={isEditing ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
            showFooter={false}
            bodyClassName="space-y-4"
        >
            <form onSubmit={onSubmit}>
                <div>
                    <Label htmlFor="product_name" value="Tên sản phẩm" />
                    <TextInput id="product_name" value={formData.product_name}
                        onChange={(e) => set('product_name', e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="category_id" value="Danh mục" />
                        <Select id="category_id" value={formData.category_id}
                            onChange={(e) => set('category_id', Number(e.target.value))} required>
                            <option value={0}>Chọn danh mục</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="quantity" value="Số lượng hiện tại" />
                        <TextInput id="quantity" type="number" value={formData.quantity}
                            onChange={(e) => set('quantity', Number(e.target.value))} required />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="min_quantity" value="Số lượng tối thiểu" />
                        <TextInput id="min_quantity" type="number" value={formData.min_quantity}
                            onChange={(e) => set('min_quantity', Number(e.target.value))}
                            helperText="Hệ thống cảnh báo khi tồn kho thấp hơn mức này" required />
                    </div>
                    <div>
                        <Label htmlFor="base_unit_id" value="Đơn vị cơ bản" />
                        <Select id="base_unit_id" value={formData.base_unit_id}
                            onChange={(e) => set('base_unit_id', Number(e.target.value))} required>
                            <option value={0}>Chọn đơn vị</option>
                            {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </Select>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="conversion_unit_id" value="Đơn vị lớn (tùy chọn)" />
                        <Select id="conversion_unit_id" value={formData.conversion_unit_id || ''}
                            onChange={(e) => set('conversion_unit_id', e.target.value ? Number(e.target.value) : undefined)}>
                            <option value="">Không dùng</option>
                            {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="conversion_rate" value="Tỷ lệ quy đổi" />
                        <TextInput id="conversion_rate" type="number" value={formData.conversion_rate}
                            onChange={(e) => set('conversion_rate', Number(e.target.value))}
                            disabled={!formData.conversion_unit_id} placeholder="VD: 24 (24 chai = 1 thùng)" />
                    </div>
                </div>
                <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                    <Button type="submit" color="blue">{isEditing ? 'Cập nhật' : 'Thêm'}</Button>
                    <Button type="button" color="gray" onClick={onClose}>Hủy</Button>
                </div>
            </form>
        </BaseDialog>
    );
}
