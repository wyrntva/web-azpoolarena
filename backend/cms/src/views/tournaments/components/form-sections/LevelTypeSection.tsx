/**
 * LevelTypeSection — Section 2: Cấp độ và loại giải đấu (ranks, tournament type, format, player count)
 */
import { Checkbox, Label, Select } from 'flowbite-react';
import type { TournamentFormData } from '../../types';
import type { TournamentRank } from '../../../../types/api';
import { formatLevel } from '../../../../utils/formatters';

interface LevelTypeSectionProps {
    formData: TournamentFormData;
    setFormData: React.Dispatch<React.SetStateAction<TournamentFormData>>;
    ranks: TournamentRank[];
    handleRankToggle: (rank: string) => void;
}

export default function LevelTypeSection({
    formData, setFormData, ranks, handleRankToggle,
}: LevelTypeSectionProps) {
    return (
        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Cấp độ và loại giải đấu
            </h3>
            <div>
                <Label className="mb-3 block text-blue-600 dark:text-blue-400">
                    Ranks <span className="text-red-500">(*)</span>
                </Label>
                <div className="flex flex-wrap gap-3">
                    {ranks.map((rank) => (
                        <div key={rank.id} className="flex items-center gap-2">
                            <Checkbox
                                id={`rank-${rank.id}`}
                                checked={formData.ranks.includes(rank.name)}
                                onChange={() => handleRankToggle(rank.name)}
                            />
                            <Label htmlFor={`rank-${rank.id}`} className="cursor-pointer font-medium">
                                {formatLevel(rank.name)}
                            </Label>
                        </div>
                    ))}
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="tournament_type" className="mb-2 block text-blue-600 dark:text-blue-400">
                        Loại giải đấu <span className="text-red-500">(*)</span>
                    </Label>
                    <Select
                        id="tournament_type"
                        value={formData.tournament_type}
                        onChange={(e) => setFormData({ ...formData, tournament_type: e.target.value })}
                        required
                    >
                        <option value="knockout">Loại trực tiếp</option>
                        <option value="double_elimination">Nhánh thắng thua</option>
                    </Select>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="competition_format" className="mb-2 block">
                        Thể thức thi đấu
                    </Label>
                    <Select
                        id="competition_format"
                        value={formData.competition_format}
                        onChange={(e) => setFormData({ ...formData, competition_format: e.target.value })}
                    >
                        <option value="">Chọn thể thức thi đấu</option>
                        <option value="9_bi_xep_thap">9 Ball - Xếp thấp</option>
                        <option value="9_bi_xep_cao">9 Ball - Xếp cao</option>
                        <option value="10_bi">10 Ball</option>
                        <option value="8_bi">8 Ball</option>
                    </Select>
                </div>
                <div>
                    <Label htmlFor="number_of_players" className="mb-2 block text-blue-600 dark:text-blue-400">
                        Số lượng cơ thủ <span className="text-red-500">(*)</span>
                    </Label>
                    <Select
                        id="number_of_players"
                        value={formData.number_of_players}
                        onChange={(e) => setFormData({ ...formData, number_of_players: e.target.value })}
                        required
                        className="max-w-xs"
                    >
                        <option value="">Chọn số lượng cơ thủ</option>
                        <option value="16">16</option>
                        <option value="24">24</option>
                        <option value="32">32</option>
                        <option value="48">48</option>
                        <option value="64">64</option>
                        <option value="96">96</option>
                        <option value="128">128</option>
                    </Select>
                </div>
            </div>
        </div>
    );
}
