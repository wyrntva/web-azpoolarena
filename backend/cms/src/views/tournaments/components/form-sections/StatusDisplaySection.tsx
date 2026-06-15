/**
 * StatusDisplaySection — Section 3: Trạng thái và hiển thị
 */
import { Label, Select, TextInput, Checkbox } from 'flowbite-react';
import type { TournamentFormData } from '../../types';

interface StatusDisplaySectionProps {
    formData: TournamentFormData;
    setFormData: React.Dispatch<React.SetStateAction<TournamentFormData>>;
}

export default function StatusDisplaySection({ formData, setFormData }: StatusDisplaySectionProps) {
    return (
        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Trạng thái và hiển thị
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <Label htmlFor="display" className="mb-2 block text-blue-600 dark:text-blue-400">
                        Hiện thị <span className="text-red-500">(*)</span>
                    </Label>
                    <Select
                        id="display"
                        value={formData.display}
                        onChange={(e) => setFormData({ ...formData, display: e.target.value })}
                        required
                    >
                        <option value="public">Công khai</option>
                        <option value="private">Riêng tư</option>
                    </Select>
                </div>
                <div>
                    <Label htmlFor="status" className="mb-2 block text-blue-600 dark:text-blue-400">
                        Trạng thái <span className="text-red-500">(*)</span>
                    </Label>
                    <Select
                        id="status"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        required
                    >
                        <option value="upcoming">Sắp diễn ra</option>
                        <option value="ongoing">Đang diễn ra</option>
                        <option value="completed">Đã kết thúc</option>
                        <option value="cancelled">Đã hủy</option>
                    </Select>
                </div>
                <div>
                    <Label htmlFor="public_date" className="mb-2 block">
                        Ngày công khai
                    </Label>
                    <TextInput
                        id="public_date"
                        type="datetime-local"
                        value={formData.public_date}
                        onChange={(e) => setFormData({ ...formData, public_date: e.target.value })}
                    />
                </div>
            </div>
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Checkbox
                    id="is_pinned"
                    checked={formData.is_pinned}
                    onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
                />
                <Label htmlFor="is_pinned" className="cursor-pointer font-semibold text-amber-600 dark:text-amber-400">
                    Ghim giải đấu lên đầu trang Pool Arena
                </Label>
            </div>
        </div>
    );
}
