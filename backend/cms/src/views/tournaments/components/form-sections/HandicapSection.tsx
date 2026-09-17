/**
 * HandicapSection — Section 6: Tỉ lệ chấp (draw settings, handicap rounds, quarter/semi/final)
 */
import { Label, TextInput, ToggleSwitch } from 'flowbite-react';
import type { TournamentFormData } from '../../types';

interface HandicapSectionProps {
    formData: TournamentFormData;
    setFormData: React.Dispatch<React.SetStateAction<TournamentFormData>>;
}

export default function HandicapSection({ formData, setFormData }: HandicapSectionProps) {
    const n = parseInt(formData.number_of_players || '0', 10);
    const showFromR8 = n === 24 || n === 32;
    const showFromR16 = n === 48 || n === 64 || n === 96 || n === 128;
    const showR16 = showFromR16;
    const showR8 = showFromR16 || showFromR8;

    // Xác định các round textbox cần hiện dựa theo draw_from_round
    const ROUND_ORDER = ['r16', 'r8', 'qf', 'sf', 'f'];
    const drawFromIdx = ROUND_ORDER.indexOf(formData.draw_from_round);
    const showQF = drawFromIdx >= 0 && drawFromIdx <= ROUND_ORDER.indexOf('qf');
    const showSF = drawFromIdx >= 0 && drawFromIdx <= ROUND_ORDER.indexOf('sf');
    const showFinal = drawFromIdx >= 0;

    return (
        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Tỉ lệ chấp
            </h3>

            {/* Draw Toggle */}
            <div className="flex items-center gap-3 pb-2">
                <ToggleSwitch
                    checked={formData.has_draw}
                    onChange={(checked) => setFormData({ ...formData, has_draw: checked })}
                    label="Đồng cơ"
                />
            </div>

            {/* Đồng cơ chạm 9 + Đồng cơ chạm 11 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="draw_touch" className="mb-2 block">Đồng cơ chạm 9</Label>
                    <TextInput
                        id="draw_touch" type="text"
                        value={formData.draw_touch}
                        onChange={(e) => setFormData({ ...formData, draw_touch: e.target.value })}
                        placeholder="Nhập điểm"
                    />
                </div>
                <div>
                    <Label htmlFor="draw_touch_11" className="mb-2 block">Đồng cơ chạm 11</Label>
                    <TextInput
                        id="draw_touch_11" type="text"
                        value={formData.draw_touch_11}
                        onChange={(e) => setFormData({ ...formData, draw_touch_11: e.target.value })}
                        placeholder="Nhập điểm"
                    />
                </div>
            </div>

            {/* Handicap 1/2 Touch (when no draw) */}
            {!formData.has_draw && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="handicap_1_touch" className="mb-2 block">Chạm 8 chấp 1</Label>
                        <TextInput
                            id="handicap_1_touch" type="text"
                            value={formData.handicap_1_touch}
                            onChange={(e) => setFormData({ ...formData, handicap_1_touch: e.target.value })}
                            placeholder="Nhập điểm"
                        />
                    </div>
                    <div>
                        <Label htmlFor="handicap_2_touch" className="mb-2 block">Chạm 13 chấp 2</Label>
                        <TextInput
                            id="handicap_2_touch" type="text"
                            value={formData.handicap_2_touch}
                            onChange={(e) => setFormData({ ...formData, handicap_2_touch: e.target.value })}
                            placeholder="Nhập điểm"
                        />
                    </div>
                </div>
            )}

            {/* Bonus */}
            <div>
                <Label htmlFor="bonus" className="mb-2 block">Bonus</Label>
                <TextInput
                    id="bonus" type="text"
                    value={formData.bonus}
                    onChange={(e) => setFormData({ ...formData, bonus: e.target.value })}
                    placeholder="Nhập bonus"
                />
            </div>

            {/* Round-specific toggles (R16 / R8) */}
            {(showR16 || showR8) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {showR16 && (
                        <div>
                            <RoundHandicapToggle
                                label="Vòng 1/16"
                                checked={formData.round_1_16}
                                onToggle={(checked) => setFormData({ ...formData, round_1_16: checked })}
                                formData={formData}
                                setFormData={setFormData}
                            />
                        </div>
                    )}
                    {showR8 && (
                        <div>
                            <RoundHandicapToggle
                                label="Vòng 1/8"
                                checked={formData.round_1_8}
                                onToggle={(checked) => setFormData({ ...formData, round_1_8: checked })}
                                formData={formData}
                                setFormData={setFormData}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Quarter / Semi / Final — chỉ hiện từ vòng được chọn trở đi */}
            {(showQF || showSF || showFinal) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {showQF && (
                        <div>
                            <Label htmlFor="quarter_final" className="mb-2 block">Tứ kết</Label>
                            <TextInput
                                id="quarter_final" type="text"
                                value={formData.quarter_final}
                                onChange={(e) => setFormData({ ...formData, quarter_final: e.target.value })}
                                placeholder="Nhập điểm"
                            />
                        </div>
                    )}
                    {showSF && (
                        <div>
                            <Label htmlFor="semi_final" className="mb-2 block">Bán kết</Label>
                            <TextInput
                                id="semi_final" type="text"
                                value={formData.semi_final}
                                onChange={(e) => setFormData({ ...formData, semi_final: e.target.value })}
                                placeholder="Nhập điểm"
                            />
                        </div>
                    )}
                    {showFinal && (
                        <div>
                            <Label htmlFor="final" className="mb-2 block">Chung kết</Label>
                            <TextInput
                                id="final" type="text"
                                value={formData.final}
                                onChange={(e) => setFormData({ ...formData, final: e.target.value })}
                                placeholder="Nhập điểm"
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ============================================
// Round Handicap Toggle — reusable sub-component
// ============================================

function RoundHandicapToggle({ label, checked, onToggle, formData, setFormData }: {
    label: string;
    checked: boolean;
    onToggle: (checked: boolean) => void;
    formData: TournamentFormData;
    setFormData: React.Dispatch<React.SetStateAction<TournamentFormData>>;
}) {
    return (
        <div className="flex flex-col gap-3">
            <div>
                <ToggleSwitch checked={checked} onChange={onToggle} label={label} />
                {checked && (
                    <div className="mt-3 space-y-3 pl-8">
                        <div>
                            <Label className="mb-2 block text-sm">Đồng cơ chạm 9</Label>
                            <TextInput
                                type="text"
                                value={formData.draw_touch}
                                onChange={(e) => setFormData({ ...formData, draw_touch: e.target.value })}
                                placeholder="Nhập điểm"
                                className="w-full"
                            />
                        </div>
                        {!formData.has_draw && (
                            <>
                                <div>
                                    <Label className="mb-2 block text-sm">Chạm 8 chấp 1</Label>
                                    <TextInput
                                        type="text"
                                        value={formData.handicap_1_touch}
                                        onChange={(e) => setFormData({ ...formData, handicap_1_touch: e.target.value })}
                                        placeholder="Nhập điểm"
                                        className="w-full"
                                    />
                                </div>
                                <div>
                                    <Label className="mb-2 block text-sm">Chạm 13 chấp 2</Label>
                                    <TextInput
                                        type="text"
                                        value={formData.handicap_2_touch}
                                        onChange={(e) => setFormData({ ...formData, handicap_2_touch: e.target.value })}
                                        placeholder="Nhập điểm"
                                        className="w-full"
                                    />
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
