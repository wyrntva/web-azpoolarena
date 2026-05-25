/**
 * OtherInfoSection — Section 7: Thông tin khác (location, organizer, phone, registration toggle)
 */
import { Label, TextInput, ToggleSwitch } from 'flowbite-react';
import type { TournamentFormData } from '../../types';

interface OtherInfoSectionProps {
    formData: TournamentFormData;
    setFormData: React.Dispatch<React.SetStateAction<TournamentFormData>>;
}

export default function OtherInfoSection({ formData, setFormData }: OtherInfoSectionProps) {
    return (
        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Thông tin khác
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="location" className="mb-2 block">Địa điểm</Label>
                    <TextInput
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                </div>
                <div>
                    <Label htmlFor="organizer" className="mb-2 block">Đơn vị tổ chức</Label>
                    <TextInput
                        id="organizer"
                        value={formData.organizer}
                        onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                    />
                </div>
                <div>
                    <Label htmlFor="support_phone" className="mb-2 block">Số điện thoại hỗ trợ</Label>
                    <TextInput
                        id="support_phone"
                        type="tel"
                        value={formData.support_phone}
                        onChange={(e) => setFormData({ ...formData, support_phone: e.target.value })}
                        placeholder="Nhập số điện thoại"
                    />
                </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
                <ToggleSwitch
                    checked={formData.can_register}
                    onChange={(checked) => setFormData({ ...formData, can_register: checked })}
                    label="Có thể đăng ký"
                />
            </div>
        </div>
    );
}
