import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Select, TextInput } from 'flowbite-react';
import { Icon } from '@iconify/react';
import type { Tournament, TournamentRegisteredPlayer } from '../../../api/tournament.api';
import { tournamentSettingsAPI } from '../../../api/tournamentSettings.api';
import type { MatchVM } from './knockoutHelpers';
import { getMinDatetimeLocal, getRaceToInfo, getMatchRoundLabel, STATUS_OPTIONS, toDatetimeLocal } from '../utils/bracketUtils';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    match: MatchVM | null;
    players: TournamentRegisteredPlayer[];
    tables: { id: number; name: string }[];
    tournament: Tournament;
    onChange: (field: keyof MatchVM, value: string) => void;
    onSave: () => Promise<void>;
    isPlayerSelectable?: boolean;
    availablePlayers?: TournamentRegisteredPlayer[];
    selectedIds?: string[];
}

const STATUS_DOT: Record<string, string> = {
    pending: '#C6010B',
    upcoming: '#FAC600',
    ongoing: '#00B814',
    completed: '#575E70',
};

const MatchManagementDialog: React.FC<Props> = ({
    isOpen, onClose, match, players, tables, tournament,
    onChange, onSave,
    isPlayerSelectable: _isPlayerSelectable = false, availablePlayers: _availablePlayers = [], selectedIds: _selectedIds = [],
}) => {
    const [saving, setSaving] = useState(false);
    const [statusOpen, setStatusOpen] = useState(false);
    const [p1StatusOpen, setP1StatusOpen] = useState(false);
    const [p2StatusOpen, setP2StatusOpen] = useState(false);
    const [datePickerOpen, setDatePickerOpen] = useState(false);
    const dateInputRef = useRef<HTMLInputElement>(null);

    const [ranks, setRanks] = useState<any[]>([]);
    const [ratingMatrix, setRatingMatrix] = useState<any[]>([]);
    const isPointsManuallyEdited = useRef(false);

    useEffect(() => {
        if (isOpen && match) {
            const hasSavedP1Points = match.player1_points !== undefined && match.player1_points !== null && match.player1_points !== '';
            const hasSavedP2Points = match.player2_points !== undefined && match.player2_points !== null && match.player2_points !== '';
            
            isPointsManuallyEdited.current = hasSavedP1Points || hasSavedP2Points;

            // Default match start time to tournament start date if empty and both players are present
            if (!match.match_time && tournament.start_date && match.player1_id && match.player2_id) {
                const defaultTime = toDatetimeLocal(tournament.start_date);
                if (defaultTime) {
                    onChange('match_time', defaultTime);
                }
            }

            tournamentSettingsAPI.getRanks().then(res => setRanks(res.data || [])).catch(() => {});
            tournamentSettingsAPI.getRatingMatrix().then(res => setRatingMatrix(res.data || [])).catch(() => {});
        }
    }, [isOpen]);

    const calculateDefaultPoints = (
        p1Rank: string | null | undefined,
        p2Rank: string | null | undefined,
        winnerId: string | null | undefined
    ) => {
        if (!p1Rank || !p2Rank || !winnerId) return { p1: 10, p2: -10 };

        const r1 = ranks.find(r => r.name.toUpperCase() === p1Rank.toUpperCase());
        const r2 = ranks.find(r => r.name.toUpperCase() === p2Rank.toUpperCase());
        if (!r1 || !r2) return { p1: 10, p2: -10 };

        const diff = Math.abs(r1.order - r2.order);
        const isPlayer1Fav = r1.order < r2.order;
        const isWinnerFav = (String(winnerId) === String(match?.player1_id) && isPlayer1Fav) || (String(winnerId) === String(match?.player2_id) && !isPlayer1Fav);

        let matrix = ratingMatrix.length > 0 ? ratingMatrix : [
            { diff: 0, winFav: 15, winUnd: 15, loseFav: -15, loseUnd: -15 },
            { diff: 1, winFav: 10, winUnd: 25, loseFav: -25, loseUnd: -10 },
            { diff: 2, winFav: 5, winUnd: 30, loseFav: -30, loseUnd: -5 },
        ];

        const matrixItem = matrix.find(item => item.diff === diff);
        let pointsChange = 10;
        if (matrixItem) {
            pointsChange = isWinnerFav ? Math.abs(matrixItem.winFav) : Math.abs(matrixItem.winUnd);
        } else {
            const sorted = [...matrix].sort((a, b) => b.diff - a.diff);
            if (sorted.length > 0) {
                pointsChange = isWinnerFav ? Math.abs(sorted[0].winFav) : Math.abs(sorted[0].winUnd);
            } else {
                pointsChange = isWinnerFav ? 5 : 35;
            }
        }

        const p1Change = String(winnerId) === String(match?.player1_id) ? pointsChange : -pointsChange;
        const p2Change = String(winnerId) === String(match?.player2_id) ? pointsChange : -pointsChange;

        return { p1: p1Change, p2: p2Change };
    };

    useEffect(() => {
        if (!isOpen || !match || match.status !== 'completed' || ranks.length === 0) return;

        if (isPointsManuallyEdited.current) return;

        const s1 = parseInt(match.player1_score, 10) || 0;
        const s2 = parseInt(match.player2_score, 10) || 0;
        const winnerId = match.winner_id || (s1 > s2 ? match.player1_id : s2 > s1 ? match.player2_id : '');

        if (!winnerId) return;

        const player1Obj = players.find(p => p.id === parseInt(match.player1_id, 10));
        const player2Obj = players.find(p => p.id === parseInt(match.player2_id, 10));

        const defaults = calculateDefaultPoints(player1Obj?.rank, player2Obj?.rank, winnerId);

        if (match.player1_points !== String(defaults.p1)) {
            onChange('player1_points', String(defaults.p1));
        }
        if (match.player2_points !== String(defaults.p2)) {
            onChange('player2_points', String(defaults.p2));
        }
    }, [isOpen, match?.status, match?.winner_id, match?.player1_score, match?.player2_score, ranks, ratingMatrix]);

    if (!match) return null;

    const p1 = players.find(p => p.id === parseInt(match.player1_id, 10));
    const p2 = players.find(p => p.id === parseInt(match.player2_id, 10));

    const handleSave = async () => {
        setSaving(true);
        try { await onSave(); }
        catch { /* error shown via toast by parent */ }
        finally { setSaving(false); }
    };

    const DropdownArrow = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="6" viewBox="0 0 11 6" fill="none">
            <path d="M0.75 0.75L5.1625 5.15L9.575 0.75" stroke="#37393E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );

    const PLAYER_STATUS_OPTIONS = [
        { value: 'unconfirmed', label: 'Chưa xác nhận tham gia', dot: 'bg-yellow-400' },
        { value: 'confirmed', label: 'Xác nhận tham gia', dot: 'bg-green-500' },
        { value: 'absent', label: 'Vắng mặt', dot: 'bg-red-500' },
    ];

        const renderPlayerRow = (label: string, _playerId: string, isPlayer1: boolean) => {
        const field = isPlayer1 ? 'player1_check_in' : 'player2_check_in';
        const statusVal = match[field] || 'unconfirmed';
        const isOpen = isPlayer1 ? p1StatusOpen : p2StatusOpen;
        const setOpen = isPlayer1 ? setP1StatusOpen : setP2StatusOpen;
        const current = PLAYER_STATUS_OPTIONS.find(o => o.value === statusVal) || PLAYER_STATUS_OPTIONS[0];

        const pointsField = isPlayer1 ? 'player1_points' : 'player2_points';
        const pointsVal = match[pointsField] !== undefined && match[pointsField] !== null ? match[pointsField] : '';

        return (
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <span className="match-dialog-label w-[140px] truncate">{label}</span>
                    <div className="relative">
                        <div className="match-dialog-select" onClick={() => setOpen(!isOpen)}>
                            <span className={`rounded-full flex-shrink-0 ${current.dot}`} style={{ width: '12px', height: '12px' }} />
                            <span className="flex-1">{current.label}</span>
                            <DropdownArrow />
                        </div>
                        {isOpen && (
                            <div className="match-dialog-select-dropdown">
                                {PLAYER_STATUS_OPTIONS.map(o => (
                                    <div key={o.value}
                                        className="match-dialog-select-option"
                                        onClick={() => { onChange(field, o.value); setOpen(false); }}>
                                        <span className={`rounded-full flex-shrink-0 ${o.dot}`} style={{ width: '12px', height: '12px' }} />
                                        {o.label}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                {/* Points row - only appears when status is completed */}
                {match.status === 'completed' && _playerId && (
                    <div className="flex items-center justify-between" style={{ paddingLeft: '16px' }}>
                        <span className="text-xs text-gray-500 font-medium italic">Cộng/Trừ điểm</span>
                        <div className="match-dialog-score w-[160px]">
                            <TextInput 
                                type="number" 
                                placeholder="Nhập điểm" 
                                value={pointsVal}
                                onChange={e => {
                                    isPointsManuallyEdited.current = true;
                                    onChange(pointsField, e.target.value);
                                }} 
                                sizing="sm" 
                            />
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const currentStatusLabel = STATUS_OPTIONS.find(o => o.value === match.status)?.label || 'Chưa diễn ra';

    if (!isOpen) return null;

    return createPortal(
        <div
            className="match-dialog-overlay"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
        >
            <div className="match-dialog-modal-box">
                <div className="pt-6 match-dialog-content" style={{ paddingLeft: '24px', paddingRight: '24px', paddingBottom: '24px' }}>
                    {/* Header */}
                    <div className="flex justify-between items-center" style={{ marginBottom: '24px' }}>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                            Quản lý trận đấu
                        </h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                            <Icon icon="mdi:close" className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex flex-col" style={{ gap: '16px' }}>
                        {/* Status - Custom dropdown */}
                        <div className="flex items-center justify-between">
                            <span className="match-dialog-label w-[140px]">Trạng thái</span>
                            <div className="relative">
                                <div className="match-dialog-select" onClick={() => setStatusOpen(!statusOpen)}>
                                    <span className="rounded-full flex-shrink-0" style={{ width: '12px', height: '12px', background: STATUS_DOT[match.status] || '#C6010B' }} />
                                    <span className="flex-1">{currentStatusLabel}</span>
                                    <DropdownArrow />
                                </div>
                                {statusOpen && (
                                    <div className="match-dialog-select-dropdown">
                                        {STATUS_OPTIONS.map(o => (
                                            <div key={o.value}
                                                className="match-dialog-select-option"
                                                onClick={() => { onChange('status', o.value); setStatusOpen(false); }}>
                                                <span className="rounded-full flex-shrink-0" style={{ width: '12px', height: '12px', background: STATUS_DOT[o.value] || '#C6010B' }} />
                                                {o.label}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Table */}
                        <div className="flex items-center justify-between">
                            <span className="match-dialog-label w-[140px]">Bàn thi đấu</span>
                            <div className="match-dialog-field">
                                <Select value={match.table_no} onChange={e => onChange('table_no', e.target.value)} sizing="sm" className="flex-1">
                                    <option value="">Chọn bàn</option>
                                    {tables.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                                </Select>
                            </div>
                        </div>

                        {/* Time */}
                        <div className="flex items-center justify-between">
                            <span className="match-dialog-label w-[140px]">Thời gian bắt đầu</span>
                            <div className="match-dialog-field" style={{ position: 'relative' }}>
                                <input ref={dateInputRef} type="datetime-local" value={match.match_time}
                                    min={getMinDatetimeLocal(tournament.start_date)}
                                    onChange={e => onChange('match_time', e.target.value)}
                                    onBlur={() => setDatePickerOpen(false)} />
                                <button
                                    type="button"
                                    style={{ position: 'absolute', right: 0, top: 0, width: 40, height: '100%', cursor: 'pointer', background: 'none', border: 'none', zIndex: 2 }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        const input = dateInputRef.current;
                                        if (!input) return;
                                        if (datePickerOpen) {
                                            input.blur();
                                            setDatePickerOpen(false);
                                        } else {
                                            input.showPicker();
                                            setDatePickerOpen(true);
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        {/* Players */}
                        {renderPlayerRow(p1?.full_name || 'Chờ...', match.player1_id, true)}
                        {renderPlayerRow(p2?.full_name || 'Chờ...', match.player2_id, false)}

                        {/* Race To */}
                        <div className="flex items-center justify-between">
                            <span className="match-dialog-label w-[140px]">Race to</span>
                            <div className="match-dialog-static">
                                {(() => {
                                    if (!match.player1_id || !match.player2_id) return '—';
                                    const roundLabel = getMatchRoundLabel(match.match_no, tournament.number_of_players);
                                    const info = getRaceToInfo(match.player1_id, match.player2_id, players, tournament, roundLabel);
                                    if (!info.raceTo) return '—';
                                    if (info.handicap === 0) return `Chạm ${info.raceTo}`;
                                    return `Chạm ${info.raceTo} chấp ${info.handicap}`;
                                })()}
                            </div>
                        </div>

                        {/* Scores */}
                        <div className="flex items-center justify-between">
                            <span className="match-dialog-label w-[140px]">Tỉ số</span>
                            <div className="flex items-center gap-2" style={{ width: '300px' }}>
                                <div className="match-dialog-score flex-1">
                                    <TextInput type="number" min={0} value={match.player1_score}
                                        onChange={e => onChange('player1_score', e.target.value)} sizing="sm" />
                                </div>
                                <span className="text-gray-400 font-bold">-</span>
                                <div className="match-dialog-score flex-1">
                                    <TextInput type="number" min={0} value={match.player2_score}
                                        onChange={e => onChange('player2_score', e.target.value)} sizing="sm" />
                                </div>
                            </div>
                        </div>

                        {/* Save */}
                        <div className="flex justify-end" style={{ marginTop: '8px' }}>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="match-dialog-save-btn"
                            >
                                {saving ? 'Đang lưu...' : 'Lưu'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default MatchManagementDialog;
