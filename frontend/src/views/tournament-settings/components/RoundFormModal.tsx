/* eslint-disable react-refresh/only-export-components */
/**
 * Tournament Round Form Modal — create/edit tournament round settings.
 * Extracted from TournamentsTab.tsx for maintainability.
 */
import { useState, useEffect } from 'react';
import { Button, Modal, Label, TextInput } from 'flowbite-react';
import type { TournamentRound } from '../../../types/api';

// ============================================
// TYPES
// ============================================

export interface RoundFormData {
    name: string;
    description: string;
    order: number;
    tournament_type: string;
    number_of_players: number | null;
    multiplier: number | null;
    is_active: boolean;
    network: '' | '1' | '2' | '3';
}

export const DEFAULT_ROUND_FORM: RoundFormData = {
    name: '',
    description: '',
    order: 1,
    tournament_type: '',
    number_of_players: null,
    multiplier: null,
    is_active: true,
    network: '',
};

interface RoundFormModalProps {
    open: boolean;
    onClose: () => void;
    editingRound: TournamentRound | null;
    formData: RoundFormData;
    setFormData: React.Dispatch<React.SetStateAction<RoundFormData>>;
    onSubmit: (e: React.FormEvent) => void;
}

// ============================================
// HELPERS
// ============================================

function calculateRounds(players: number): number {
    if (!players || players < 2) return 0;
    let rounds = 0;
    let current = players;
    while (current > 2) {
        current = Math.floor(current / 2);
        rounds++;
    }
    return rounds + 1;
}

// ============================================
// COMPONENT
// ============================================

export default function RoundFormModal({
    open,
    onClose,
    editingRound,
    formData,
    setFormData,
    onSubmit,
}: RoundFormModalProps) {
    const [dynamicRounds, setDynamicRounds] = useState<Array<{ name: string; players: number; multiplier: number | null }>>([]);

    // Generate dynamic rounds when network/players change
    useEffect(() => {
        if (formData.network === '1' && formData.number_of_players) {
            const validPlayers = [16, 32, 64, 128];
            if (validPlayers.includes(formData.number_of_players)) {
                const numRounds = calculateRounds(formData.number_of_players);
                const newRounds: Array<{ name: string; players: number; multiplier: number | null }> = [];
                let currentPlayers = formData.number_of_players;

                for (let i = 1; i <= numRounds; i++) {
                    newRounds.push({ name: `Vòng ${i}`, players: currentPlayers, multiplier: null });
                    currentPlayers = Math.floor(currentPlayers / 2);
                }
                setDynamicRounds(newRounds);
            } else {
                setDynamicRounds([]);
            }
        } else {
            setDynamicRounds([]);
        }
    }, [formData.network, formData.number_of_players]);

    return (
        <Modal show={open} onClose={onClose}>
            <form onSubmit={onSubmit}>
                <Modal.Header>
                    {editingRound ? 'Chỉnh sửa loại giải đấu' : 'Thêm loại giải đấu mới'}
                </Modal.Header>
                <Modal.Body>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="order" value="Thứ tự" />
                            <TextInput
                                id="order"
                                type="number"
                                min={1}
                                value={formData.order}
                                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="name" value="Tên loại giải đấu" />
                            <TextInput
                                id="name"
                                type="text"
                                placeholder="VD: Loại trực tiếp, Nhánh thắng thua, Vòng tròn..."
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <Label value="Chọn mạng" />
                            <div className="flex gap-4 mt-2">
                                {(['1', '2', '3'] as const).map((val) => (
                                    <label key={val} className="flex items-center">
                                        <input
                                            type="radio"
                                            name="network"
                                            value={val}
                                            checked={formData.network === val}
                                            onChange={(e) => setFormData({ ...formData, network: e.target.value as '1' | '2' | '3' })}
                                            className="mr-2"
                                        />
                                        <span>{val} mạng</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="number_of_players" value="Số lượng cơ thủ" />
                            <TextInput
                                id="number_of_players"
                                type="number"
                                min={0}
                                placeholder="VD: 16, 32, 64, 128..."
                                value={formData.number_of_players || ''}
                                onChange={(e) => setFormData({ ...formData, number_of_players: e.target.value ? parseInt(e.target.value) : null })}
                            />
                            {formData.network === '1' && formData.number_of_players && ![16, 32, 64, 128].includes(formData.number_of_players) && (
                                <p className="text-red-500 text-sm mt-1">Số lượng cơ thủ phải là 16, 32, 64 hoặc 128</p>
                            )}
                        </div>

                        {/* Dynamic rounds for 1-network mode */}
                        {formData.network === '1' && formData.number_of_players && [16, 32, 64, 128].includes(formData.number_of_players) && dynamicRounds.length > 0 && (
                            <div className="space-y-3 border-t pt-4">
                                <Label value="Các vòng đấu" />
                                {dynamicRounds.map((round, index) => (
                                    <div key={index} className="grid grid-cols-3 gap-3 items-end">
                                        <div>
                                            <Label htmlFor={`round_name_${index}`} value={`Vòng ${index + 1}`} />
                                            <TextInput
                                                id={`round_name_${index}`}
                                                type="text"
                                                placeholder="Tên vòng"
                                                value={round.name}
                                                onChange={(e) => {
                                                    const newRounds = [...dynamicRounds];
                                                    newRounds[index].name = e.target.value;
                                                    setDynamicRounds(newRounds);
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor={`round_players_${index}`} value="Số lượng cơ thủ" />
                                            <TextInput
                                                id={`round_players_${index}`}
                                                type="number"
                                                value={round.players}
                                                disabled
                                                className="bg-gray-100 dark:bg-gray-700"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor={`round_multiplier_${index}`} value="Hệ số" />
                                            <TextInput
                                                id={`round_multiplier_${index}`}
                                                type="number"
                                                step="0.01"
                                                min={0}
                                                placeholder="Hệ số"
                                                value={round.multiplier || ''}
                                                onChange={(e) => {
                                                    const newRounds = [...dynamicRounds];
                                                    newRounds[index].multiplier = e.target.value ? parseFloat(e.target.value) : null;
                                                    setDynamicRounds(newRounds);
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button type="submit" color="blue">
                        {editingRound ? 'Cập nhật' : 'Thêm'}
                    </Button>
                    <Button color="gray" onClick={onClose}>
                        Hủy
                    </Button>
                </Modal.Footer>
            </form>
        </Modal>
    );
}
