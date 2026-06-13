import { useState, useEffect, useCallback } from 'react';
import { Button, Spinner } from 'flowbite-react';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import { tournamentSettingsAPI } from '../../../api/tournamentSettings.api';
import type { TournamentRound } from '../../../types/api';

// ─── Predefined rounds per tournament size ───────────────────────────────────

interface RoundDef {
    key: string;    // unique key matching round name in DB
    label: string;  // display name
    matches: string;
}

const ROUNDS_BY_SIZE: Record<number, RoundDef[]> = {
    16: [
        { key: 'Tứ kết',      label: 'Tứ kết',      matches: '4 trận' },
        { key: 'Bán kết',     label: 'Bán kết',     matches: '2 trận' },
        { key: 'Chung kết',   label: 'Chung kết',   matches: '1 trận' },
    ],
    24: [
        { key: 'Vòng 1/8',    label: 'Vòng 1/8',    matches: '8 trận' },
        { key: 'Tứ kết',      label: 'Tứ kết',      matches: '4 trận' },
        { key: 'Bán kết',     label: 'Bán kết',     matches: '2 trận' },
        { key: 'Chung kết',   label: 'Chung kết',   matches: '1 trận' },
    ],
    32: [
        { key: 'Vòng 1/8',    label: 'Vòng 1/8',    matches: '8 trận' },
        { key: 'Tứ kết',      label: 'Tứ kết',      matches: '4 trận' },
        { key: 'Bán kết',     label: 'Bán kết',     matches: '2 trận' },
        { key: 'Chung kết',   label: 'Chung kết',   matches: '1 trận' },
    ],
    48: [
        { key: 'Vòng 1/16',   label: 'Vòng 1/16',   matches: '16 trận' },
        { key: 'Vòng 1/8',    label: 'Vòng 1/8',    matches: '8 trận' },
        { key: 'Tứ kết',      label: 'Tứ kết',      matches: '4 trận' },
        { key: 'Bán kết',     label: 'Bán kết',     matches: '2 trận' },
        { key: 'Chung kết',   label: 'Chung kết',   matches: '1 trận' },
    ],
    64: [
        { key: 'Vòng 1/16',   label: 'Vòng 1/16',   matches: '16 trận' },
        { key: 'Vòng 1/8',    label: 'Vòng 1/8',    matches: '8 trận' },
        { key: 'Tứ kết',      label: 'Tứ kết',      matches: '4 trận' },
        { key: 'Bán kết',     label: 'Bán kết',     matches: '2 trận' },
        { key: 'Chung kết',   label: 'Chung kết',   matches: '1 trận' },
    ],
    96: [
        { key: 'Vòng 1/32',   label: 'Vòng 1/32',   matches: '32 trận' },
        { key: 'Vòng 1/16',   label: 'Vòng 1/16',   matches: '16 trận' },
        { key: 'Vòng 1/8',    label: 'Vòng 1/8',    matches: '8 trận' },
        { key: 'Tứ kết',      label: 'Tứ kết',      matches: '4 trận' },
        { key: 'Bán kết',     label: 'Bán kết',     matches: '2 trận' },
        { key: 'Chung kết',   label: 'Chung kết',   matches: '1 trận' },
    ],
    128: [
        { key: 'Vòng 1/32',   label: 'Vòng 1/32',   matches: '32 trận' },
        { key: 'Vòng 1/16',   label: 'Vòng 1/16',   matches: '16 trận' },
        { key: 'Vòng 1/8',    label: 'Vòng 1/8',    matches: '8 trận' },
        { key: 'Tứ kết',      label: 'Tứ kết',      matches: '4 trận' },
        { key: 'Bán kết',     label: 'Bán kết',     matches: '2 trận' },
        { key: 'Chung kết',   label: 'Chung kết',   matches: '1 trận' },
    ],
};

const TOURNAMENT_SIZES = [16, 24, 32, 48, 64, 96, 128];

// order key = size * 100 + roundIndex to keep globally unique
const orderKey = (size: number, idx: number) => size * 100 + idx + 1;

// ─── Component ────────────────────────────────────────────────────────────────

const CoefficientTab = () => {
    const [allRounds, setAllRounds] = useState<TournamentRound[]>([]);
    const [loadingAll, setLoadingAll] = useState(false);
    const [selectedSize, setSelectedSize] = useState<number | null>(null);

    // per-row multiplier edits: key = roundDef.key, value = string (controlled input)
    const [multipliers, setMultipliers] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

    const fetchAll = useCallback(async () => {
        try {
            setLoadingAll(true);
            const res = await tournamentSettingsAPI.getRounds();
            setAllRounds(res.data || []);
        } catch {
            toast.error('Không thể tải dữ liệu hệ số');
        } finally {
            setLoadingAll(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // When size changes, load current multipliers from DB into local state
    useEffect(() => {
        if (selectedSize == null) return;
        const defs = ROUNDS_BY_SIZE[selectedSize] ?? [];
        const dbMap: Record<string, TournamentRound> = {};
        allRounds
            .filter(r => r.number_of_players === selectedSize)
            .forEach(r => { dbMap[r.name] = r; });

        const init: Record<string, string> = {};
        defs.forEach(def => {
            init[def.key] = dbMap[def.key]
                ? String(dbMap[def.key].multiplier ?? 1)
                : '1';
        });
        setMultipliers(init);
    }, [selectedSize, allRounds]);

    const handleSave = async () => {
        if (selectedSize == null) return;
        const defs = ROUNDS_BY_SIZE[selectedSize] ?? [];
        const dbMap: Record<string, TournamentRound> = {};
        allRounds
            .filter(r => r.number_of_players === selectedSize)
            .forEach(r => { dbMap[r.name] = r; });

        setSaving(true);
        try {
            await Promise.all(
                defs.map(async (def, idx) => {
                    const value = parseFloat(multipliers[def.key]) || 1;
                    const existing = dbMap[def.key];
                    if (existing) {
                        await tournamentSettingsAPI.updateRound(existing.id, { multiplier: value });
                    } else {
                        await tournamentSettingsAPI.createRound({
                            name: def.key,
                            order: orderKey(selectedSize, idx),
                            number_of_players: selectedSize,
                            multiplier: value,
                            is_active: true,
                        });
                    }
                })
            );
            toast.success(`Đã lưu hệ số giải ${selectedSize} người`);
            await fetchAll();
        } catch (error) {
            toast.error((error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Không thể lưu hệ số');
        } finally {
            setSaving(false);
        }
    };

    const configuredCount = (size: number) => {
        const validKeys = new Set((ROUNDS_BY_SIZE[size] ?? []).map(d => d.key));
        return allRounds.filter(r => r.number_of_players === size && validKeys.has(r.name)).length;
    };

    const defs = selectedSize != null ? (ROUNDS_BY_SIZE[selectedSize] ?? []) : [];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Hệ số theo giải đấu</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Chọn kích thước giải để cấu hình hệ số nhân điểm cho từng vòng đấu
                </p>
            </div>

            {/* Size picker */}
            {loadingAll ? (
                <div className="flex justify-center py-8"><Spinner /></div>
            ) : (
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
                    {TOURNAMENT_SIZES.map(size => {
                        const count = configuredCount(size);
                        const isSelected = selectedSize === size;

                        return (
                            <button
                                key={size}
                                type="button"
                                onClick={() => setSelectedSize(prev => prev === size ? null : size)}
                                className={`relative flex flex-col items-center justify-center gap-1 p-4 rounded-xl border-2 transition-all cursor-pointer
                                    ${isSelected
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-md'
                                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300'
                                    }`}
                            >
                                <span className={`text-2xl font-bold ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-200'}`}>
                                    {size}
                                </span>
                                <span className="text-xs text-gray-400">người</span>
                                {count > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Round coefficient table for selected size */}
            {selectedSize != null && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                    {/* header */}
                    <div className="flex items-center justify-between px-5 py-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                Giải <span className="text-blue-600 dark:text-blue-400">{selectedSize} người</span>
                                <span className="ml-2 text-sm font-normal text-gray-500">— Vòng loại trực tiếp</span>
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {defs.length} vòng đấu · Nhập hệ số nhân điểm cho mỗi vòng rồi nhấn Lưu
                            </p>
                        </div>
                        <Button
                            color="blue"
                            size="sm"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving
                                ? <><Spinner size="sm" className="mr-2" />Đang lưu...</>
                                : <><Icon icon="solar:floppy-disk-outline" className="mr-2 text-base" />Lưu hệ số</>
                            }
                        </Button>
                    </div>

                    {/* table */}
                    <table className="w-full text-sm">
                        <thead className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="text-left px-5 py-3 font-medium text-gray-500 uppercase text-xs w-10">#</th>
                                <th className="text-left px-5 py-3 font-medium text-gray-500 uppercase text-xs">Vòng đấu</th>
                                <th className="text-left px-5 py-3 font-medium text-gray-500 uppercase text-xs">Số trận</th>
                                <th className="px-5 py-3 font-medium text-gray-500 uppercase text-xs text-center w-48">Hệ số nhân điểm</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {defs.map((def, idx) => {
                                const isLast = idx === defs.length - 1;
                                return (
                                    <tr
                                        key={def.key}
                                        className={`bg-white dark:bg-gray-800 ${isLast ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''}`}
                                    >
                                        <td className="px-5 py-4 text-gray-400 text-xs">{idx + 1}</td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                {isLast && (
                                                    <Icon icon="solar:cup-star-bold" className="text-yellow-400 text-base" />
                                                )}
                                                <span className={`font-semibold ${isLast ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-gray-100'}`}>
                                                    {def.label}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-gray-400 text-xs">{def.matches}</td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <span className="text-gray-400 text-sm font-medium">x</span>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    step={0.01}
                                                    value={multipliers[def.key] ?? '1'}
                                                    onChange={e => setMultipliers(prev => ({ ...prev, [def.key]: e.target.value }))}
                                                    className="w-28 text-center border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2
                                                               text-sm font-bold text-blue-700 dark:text-blue-300
                                                               bg-white dark:bg-gray-700
                                                               focus:outline-none focus:ring-2 focus:ring-blue-400"
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {selectedSize == null && !loadingAll && (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-600">
                    <Icon icon="solar:cursor-square-outline" className="text-5xl mb-3 text-gray-300" />
                    <p className="text-sm">Chọn một kích thước giải bên trên để cấu hình hệ số</p>
                </div>
            )}
        </div>
    );
};

export default CoefficientTab;
