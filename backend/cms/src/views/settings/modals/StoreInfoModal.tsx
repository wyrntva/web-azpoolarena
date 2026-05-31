/**
 * Store Information Modal — settings for store name, address, business type, etc.
 */
import { Label, Select, TextInput, ToggleSwitch } from 'flowbite-react';
import BaseDialog from '../../../components/shared/BaseDialog';
import {
    type StoreInfo,
    PROVINCES,
    DISTRICTS,
    WARDS,
    BUSINESS_TYPES,
    CURRENCIES,
} from '../constants';

interface StoreInfoModalProps {
    open: boolean;
    onClose: () => void;
    storeInfo: StoreInfo;
    onChange: (info: StoreInfo) => void;
    onSave: () => void;
}

const StoreInfoModal = ({ open, onClose, storeInfo, onChange, onSave }: StoreInfoModalProps) => {
    const availableDistricts = DISTRICTS[storeInfo.province] || [];
    const availableWards = WARDS[storeInfo.district] || [];

    const update = (partial: Partial<StoreInfo>) => {
        onChange({ ...storeInfo, ...partial });
    };

    return (
        <BaseDialog
            open={open}
            onClose={onClose}
            title="Thông tin cửa hàng"
            size="lg"
            onConfirm={onSave}
            confirmText="Lưu"
            bodyClassName="space-y-4"
        >
            {/* Store Name */}
            <div>
                <div className="flex justify-between items-center mb-1">
                    <Label htmlFor="store_name" className="text-blue-600">
                        Tên cửa hàng <span className="text-red-500">(*)</span>
                    </Label>
                    <span className="text-xs text-gray-400">Có thể nhập nhiều dòng, tối đa 255 ký tự</span>
                </div>
                <TextInput
                    id="store_name"
                    value={storeInfo.name}
                    onChange={(e) => update({ name: e.target.value })}
                    maxLength={255}
                />
            </div>

            {/* Phone & Currency */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="store_phone" className="text-gray-700 dark:text-gray-300">
                        Số điện thoại cửa hàng
                    </Label>
                    <TextInput
                        id="store_phone"
                        value={storeInfo.phone}
                        onChange={(e) => update({ phone: e.target.value })}
                    />
                </div>
                <div>
                    <Label htmlFor="currency" className="text-blue-600">
                        Đơn vị tiền tệ <span className="text-red-500">(*)</span>
                    </Label>
                    <Select
                        id="currency"
                        value={storeInfo.currency}
                        onChange={(e) => update({ currency: e.target.value })}
                    >
                        {CURRENCIES.map((c) => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                    </Select>
                </div>
            </div>

            {/* Address */}
            <div>
                <div className="flex justify-between items-center mb-1">
                    <Label htmlFor="address" className="text-blue-600">
                        Địa chỉ <span className="text-red-500">(*)</span>
                    </Label>
                    <span className="text-xs text-gray-400">Tối đa 255 ký tự</span>
                </div>
                <TextInput
                    id="address"
                    value={storeInfo.address}
                    onChange={(e) => update({ address: e.target.value })}
                    maxLength={255}
                />
            </div>

            {/* Use New Address Toggle */}
            <div className="flex justify-end items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Địa chỉ mới sắp nhập</span>
                <ToggleSwitch
                    checked={storeInfo.useNewAddress}
                    onChange={(checked) => update({ useNewAddress: checked })}
                />
            </div>

            {/* Province, District */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="province" className="text-blue-600">
                        Tỉnh / Thành phố <span className="text-red-500">(*)</span>
                    </Label>
                    <Select
                        id="province"
                        value={storeInfo.province}
                        onChange={(e) => update({ province: e.target.value, district: '', ward: '' })}
                    >
                        <option value="">Chọn tỉnh/thành phố</option>
                        {PROVINCES.map((p) => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                    </Select>
                </div>
                <div>
                    <Label htmlFor="district" className="text-blue-600">
                        Quận / Huyện <span className="text-red-500">(*)</span>
                    </Label>
                    <Select
                        id="district"
                        value={storeInfo.district}
                        onChange={(e) => update({ district: e.target.value, ward: '' })}
                    >
                        <option value="">Chọn quận/huyện</option>
                        {availableDistricts.map((d) => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </Select>
                </div>
            </div>

            {/* Ward, Business Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="ward" className="text-blue-600">
                        Phường / Xã <span className="text-red-500">(*)</span>
                    </Label>
                    <Select
                        id="ward"
                        value={storeInfo.ward}
                        onChange={(e) => update({ ward: e.target.value })}
                    >
                        <option value="">Chọn phường/xã</option>
                        {availableWards.map((w) => (
                            <option key={w} value={w}>{w}</option>
                        ))}
                    </Select>
                </div>
                <div>
                    <Label htmlFor="businessType" className="text-blue-600">
                        Loại hình kinh doanh <span className="text-red-500">(*)</span>
                    </Label>
                    <Select
                        id="businessType"
                        value={storeInfo.businessType}
                        onChange={(e) => update({ businessType: e.target.value })}
                    >
                        {BUSINESS_TYPES.map((t) => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </Select>
                </div>
            </div>
        </BaseDialog>
    );
};

export default StoreInfoModal;
