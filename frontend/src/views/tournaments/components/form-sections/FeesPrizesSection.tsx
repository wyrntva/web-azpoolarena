/**
 * FeesPrizesSection — Section 5: Lệ phí và giải thưởng
 */
import { Label, TextInput, ToggleSwitch } from 'flowbite-react';
import type { TournamentFormData } from '../../types';

interface FeesPrizesSectionProps {
    formData: TournamentFormData;
    setFormData: React.Dispatch<React.SetStateAction<TournamentFormData>>;
    handleCurrencyChange: (field: keyof TournamentFormData, value: string) => void;
    getFormattedValue: (value: string) => string;
}

export default function FeesPrizesSection({
    formData, setFormData, handleCurrencyChange, getFormattedValue,
}: FeesPrizesSectionProps) {
    return (
        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Lệ phí và giải thưởng
            </h3>
            <div className="flex items-center gap-6 pb-2">
                <ToggleSwitch
                    checked={formData.free_table_fee}
                    onChange={(checked) => setFormData({ ...formData, free_table_fee: checked })}
                    label="FREE tiền bàn"
                />
                <ToggleSwitch
                    checked={formData.pre_payment}
                    onChange={(checked) => setFormData({ ...formData, pre_payment: checked })}
                    label="Thanh toán trước"
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="registration_fee" className="mb-2 block">Lệ phí tham gia</Label>
                    <TextInput
                        id="registration_fee" type="text"
                        value={getFormattedValue(formData.registration_fee)}
                        onChange={(e) => handleCurrencyChange('registration_fee', e.target.value)}
                        placeholder="Nhập lệ phí tham gia"
                    />
                </div>
                <div>
                    <Label htmlFor="total_prize" className="mb-2 block">Tổng giải thưởng</Label>
                    <TextInput
                        id="total_prize" type="text"
                        value={getFormattedValue(formData.total_prize)}
                        onChange={(e) => handleCurrencyChange('total_prize', e.target.value)}
                        placeholder="Nhập tổng giải thưởng"
                    />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {PRIZE_FIELDS.map(({ id, label }) => (
                    <div key={id}>
                        <Label htmlFor={id} className="mb-2 block">{label}</Label>
                        <TextInput
                            id={id} type="text"
                            value={getFormattedValue(formData[id as keyof TournamentFormData] as string)}
                            onChange={(e) => handleCurrencyChange(id as keyof TournamentFormData, e.target.value)}
                            placeholder="Nhập giải thưởng"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

/** Prize field definitions to reduce repetition */
const PRIZE_FIELDS = [
    { id: 'first_prize', label: 'Giải nhất' },
    { id: 'second_prize', label: 'Giải nhì' },
    { id: 'third_prize', label: 'Giải ba' },
    { id: 'top_5_8_prize', label: 'Top 5-8' },
    { id: 'top_9_16_prize', label: 'Top 9-16' },
    { id: 'top_17_32_prize', label: 'Top 17-32' },
    { id: 'top_33_64_prize', label: 'Top 33-64' },
    { id: 'top_65_128_prize', label: 'Top 65-128' },
    { id: 'top_129_256_prize', label: 'Top 129-256' },
] as const;
