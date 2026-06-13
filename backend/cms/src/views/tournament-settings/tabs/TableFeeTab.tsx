import { useState, useEffect } from 'react';
import { Button, Label, Spinner } from 'flowbite-react';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import { tournamentSettingsAPI } from '../../../api/tournamentSettings.api';

const TableFeeTab = () => {
    const [price, setPrice] = useState<string>('');
    const [perMinutes, setPerMinutes] = useState<string>('1');
    const [surcharge, setSurcharge] = useState<string>('0');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetch = async () => {
            try {
                setLoading(true);
                const res = await tournamentSettingsAPI.getTableFee();
                setPrice(res.data.price > 0 ? String(res.data.price) : '');
                setPerMinutes(String(res.data.per_minutes || 1));
                setSurcharge(String(res.data.surcharge ?? 0));
            } catch {
                toast.error('Không thể tải cấu hình tiền bàn');
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    const handleSave = async () => {
        const priceVal = parseFloat(price);
        const minutesVal = parseInt(perMinutes);
        const surchargeVal = parseFloat(surcharge || '0');
        if (isNaN(priceVal) || priceVal < 0) {
            toast.error('Vui lòng nhập số tiền hợp lệ');
            return;
        }
        if (isNaN(minutesVal) || minutesVal < 1) {
            toast.error('Số phút phải lớn hơn 0');
            return;
        }
        if (isNaN(surchargeVal) || surchargeVal < 0) {
            toast.error('Phụ phí phải lớn hơn hoặc bằng 0');
            return;
        }
        try {
            setSaving(true);
            await tournamentSettingsAPI.saveTableFee({ price: priceVal, per_minutes: minutesVal, surcharge: surchargeVal });
            toast.success('Đã lưu cấu hình tiền bàn');
        } catch {
            toast.error('Không thể lưu cấu hình tiền bàn');
        } finally {
            setSaving(false);
        }
    };

    const perHour = (() => {
        const p = parseFloat(price);
        const m = parseInt(perMinutes);
        if (isNaN(p) || p === 0 || isNaN(m) || m === 0) return null;
        return ((p / m) * 60).toLocaleString('vi-VN', { maximumFractionDigits: 0 });
    })();

    return (
        <div className="space-y-6 max-w-lg">
            <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tiền bàn</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Cấu hình giá thuê bàn bi-a áp dụng trong giải đấu
                </p>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><Spinner /></div>
            ) : (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-5">
                    <div className="space-y-2">
                        <Label value="Giá tiền bàn" />
                        <div className="flex items-center gap-2">
                            {/* Price input */}
                            <div className="relative flex-1">
                                <input
                                    type="number"
                                    min={0}
                                    step={500}
                                    placeholder="VD: 4000"
                                    value={price}
                                    onChange={e => setPrice(e.target.value)}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 pr-10
                                               text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700
                                               focus:outline-none focus:ring-2 focus:ring-blue-400"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">đ</span>
                            </div>

                            <span className="text-gray-400 font-medium">/</span>

                            {/* Minutes input */}
                            <div className="relative w-28">
                                <input
                                    type="number"
                                    min={1}
                                    step={1}
                                    placeholder="1"
                                    value={perMinutes}
                                    onChange={e => setPerMinutes(e.target.value)}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 pr-10
                                               text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700
                                               focus:outline-none focus:ring-2 focus:ring-blue-400"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">p</span>
                            </div>
                        </div>

                        {/* Preview */}
                        {price && perMinutes && (
                            <div className="flex items-center gap-2 pt-1">
                                <Icon icon="solar:calculator-outline" className="text-blue-500 text-base" />
                                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                                    {parseFloat(price).toLocaleString('vi-VN')}đ / {perMinutes} phút
                                    {perHour && <span className="text-gray-400 font-normal ml-2">≈ {perHour} đ/giờ</span>}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Surcharge */}
                    <div className="space-y-2">
                        <Label value="Phụ phí cố định" />
                        <div className="relative w-48">
                            <input
                                type="number"
                                min={0}
                                step={500}
                                placeholder="0"
                                value={surcharge}
                                onChange={e => setSurcharge(e.target.value)}
                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 pr-10
                                           text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700
                                           focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">đ</span>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                            Cộng thêm vào tổng tiền bàn (không hiển thị riêng trên màn hình thanh toán)
                        </p>
                    </div>

                    <Button color="blue" onClick={handleSave} disabled={saving}>
                        {saving
                            ? <><Spinner size="sm" className="mr-2" />Đang lưu...</>
                            : <><Icon icon="solar:floppy-disk-outline" className="mr-2 text-base" />Lưu cấu hình</>
                        }
                    </Button>
                </div>
            )}
        </div>
    );
};

export default TableFeeTab;
