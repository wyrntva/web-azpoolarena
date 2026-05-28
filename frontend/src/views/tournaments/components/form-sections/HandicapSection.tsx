/**
 * HandicapSection — Section 6: Tỉ lệ chấp (draw settings, handicap rounds, quarter/semi/final)
 */
import { Label, TextInput, Select, ToggleSwitch } from 'flowbite-react';
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

            {/* Draw From Round + Draw Touch */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="draw_from_round" className="mb-2 block">Đồng cơ từ vòng</Label>
                    {(() => {
                        const options: Array<{ value: string; label: string }> = [];
                        if (showR16) options.push({ value: 'r16', label: 'Vòng 1/16' });
                        if (showR8) options.push({ value: 'r8', label: 'Vòng 1/8' });
                        options.push({ value: 'qf', label: 'Tứ kết' });
                        options.push({ value: 'sf', label: 'Bán kết' });
                        options.push({ value: 'f', label: 'Chung kết' });

                        const allowed = new Set(options.map((o) => o.value));
                        const value = allowed.has(formData.draw_from_round) ? formData.draw_from_round : '';

                        return (
                            <Select
                                id="draw_from_round"
                                value={value}
                                onChange={(e) => setFormData({ ...formData, draw_from_round: e.target.value })}
                            >
                                <option value="">Chọn vòng</option>
                                {options.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </Select>
                        );
                    })()}
                </div>
                <div>
                    <Label htmlFor="draw_touch" className="mb-2 block">Đồng cơ chạm</Label>
                    <TextInput
                        id="draw_touch" type="text"
                        value={formData.draw_touch}
                        onChange={(e) => setFormData({ ...formData, draw_touch: e.target.value })}
                        placeholder="Nhập tỉ lệ"
                    />
                </div>
            </div>

            {/* Handicap 1/2 Touch (when no draw) */}
            {!formData.has_draw && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="handicap_1_touch" className="mb-2 block">Chấp 1 chạm</Label>
                        <TextInput
                            id="handicap_1_touch" type="text"
                            value={formData.handicap_1_touch}
                            onChange={(e) => setFormData({ ...formData, handicap_1_touch: e.target.value })}
                            placeholder="Nhập tỉ lệ"
                        />
                    </div>
                    <div>
                        <Label htmlFor="handicap_2_touch" className="mb-2 block">Chấp 2 chạm</Label>
                        <TextInput
                            id="handicap_2_touch" type="text"
                            value={formData.handicap_2_touch}
                            onChange={(e) => setFormData({ ...formData, handicap_2_touch: e.target.value })}
                            placeholder="Nhập tỉ lệ"
                        />
                    </div>
                </div>
            )}

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
                                placeholder="Nhập tỉ lệ"
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
                                placeholder="Nhập tỉ lệ"
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
                                placeholder="Nhập tỉ lệ"
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
                            <Label className="mb-2 block text-sm">Đồng cơ chạm</Label>
                            <TextInput
                                type="text"
                                value={formData.draw_touch}
                                onChange={(e) => setFormData({ ...formData, draw_touch: e.target.value })}
                                placeholder="Nhập tỉ lệ"
                                className="w-full"
                            />
                        </div>
                        {!formData.has_draw && (
                            <>
                                <div>
                                    <Label className="mb-2 block text-sm">Chấp 1 chạm</Label>
                                    <TextInput
                                        type="text"
                                        value={formData.handicap_1_touch}
                                        onChange={(e) => setFormData({ ...formData, handicap_1_touch: e.target.value })}
                                        placeholder="Nhập tỉ lệ"
                                        className="w-full"
                                    />
                                </div>
                                <div>
                                    <Label className="mb-2 block text-sm">Chấp 2 chạm</Label>
                                    <TextInput
                                        type="text"
                                        value={formData.handicap_2_touch}
                                        onChange={(e) => setFormData({ ...formData, handicap_2_touch: e.target.value })}
                                        placeholder="Nhập tỉ lệ"
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
