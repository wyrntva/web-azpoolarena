/**
 * ScheduleSection — Section 4: Thời gian (start date, registration dates)
 */
import { Label, TextInput } from 'flowbite-react';
import type { TournamentFormData } from '../../types';

interface ScheduleSectionProps {
    formData: TournamentFormData;
    setFormData: React.Dispatch<React.SetStateAction<TournamentFormData>>;
    onStartDateChange: (value: string) => void;
}

export default function ScheduleSection({ formData, setFormData, onStartDateChange }: ScheduleSectionProps) {
    return (
        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Thời gian
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                    <Label htmlFor="start_date" className="mb-2 block text-blue-600 dark:text-blue-400">
                        Ngày bắt đầu <span className="text-red-500">(*)</span>
                    </Label>
                    <TextInput
                        id="start_date"
                        type="datetime-local"
                        value={formData.start_date}
                        onChange={(e) => onStartDateChange(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <Label htmlFor="end_date" className="mb-2 block">
                        Ngày kết thúc
                    </Label>
                    <TextInput
                        id="end_date"
                        type="datetime-local"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                </div>
                <div>
                    <Label className="mb-2 block">
                        Thời gian tạo trận đấu
                    </Label>
                    <div className="flex items-center gap-2">
                        <TextInput
                            id="match_creation_time"
                            type="time"
                            value={formData.match_creation_time}
                            onChange={(e) => setFormData({ ...formData, match_creation_time: e.target.value })}
                            className="flex-1"
                        />
                        <span className="text-gray-500 dark:text-gray-400 text-sm">đến</span>
                        <TextInput
                            id="match_creation_time_end"
                            type="time"
                            value={formData.match_creation_time_end}
                            onChange={(e) => setFormData({ ...formData, match_creation_time_end: e.target.value })}
                            className="flex-1"
                        />
                    </div>
                </div>
                <div>
                    <Label htmlFor="registration_start_date" className="mb-2 block">
                        Ngày bắt đầu đăng ký
                    </Label>
                    <TextInput
                        id="registration_start_date"
                        type="datetime-local"
                        value={formData.registration_start_date}
                        onChange={(e) => setFormData({ ...formData, registration_start_date: e.target.value })}
                    />
                </div>
                <div>
                    <Label htmlFor="registration_end_date" className="mb-2 block">
                        Ngày kết thúc đăng ký
                    </Label>
                    <TextInput
                        id="registration_end_date"
                        type="datetime-local"
                        value={formData.registration_end_date}
                        onChange={(e) => setFormData({ ...formData, registration_end_date: e.target.value })}
                    />
                </div>
            </div>
        </div>
    );
}
