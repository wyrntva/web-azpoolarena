import { useState, useEffect, useCallback, useRef } from 'react';
import { Table, Card, Spinner, Button, Label, TextInput, Modal } from 'flowbite-react';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import { tournamentAPI, type TournamentRegisteredPlayer, type TournamentEligibleUser } from '../../../api/tournament.api';
import { defaultAvatar, getAvatarUrl } from '../../../constants/shared';

interface TournamentRegistrationsTabProps {
    tournamentId: number;
    numberOfPlayers?: number;
    onBracketRefresh?: () => void;
}

const TournamentRegistrationsTab = ({ tournamentId, numberOfPlayers = 32, onBracketRefresh }: TournamentRegistrationsTabProps) => {
    const [players, setPlayers] = useState<TournamentRegisteredPlayer[]>([]);
    const [eligibleUsers, setEligibleUsers] = useState<TournamentEligibleUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingEligible, setLoadingEligible] = useState(false);
    const [adding, setAdding] = useState(false);
    const [removingId, setRemovingId] = useState<number | null>(null);
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
    const [playerToRemove, setPlayerToRemove] = useState<TournamentRegisteredPlayer | null>(null);
    const [showUserList, setShowUserList] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const fetchRegistrations = useCallback(async () => {
        try {
            setLoading(true);
            const res = await tournamentAPI.getRegistrations(tournamentId);
            setPlayers(Array.isArray(res.data) ? res.data : []);
        } catch (e) {
            toast.error((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Không thể tải danh sách đăng kí');
        } finally {
            setLoading(false);
        }
    }, [tournamentId]);

    const fetchEligibleUsers = useCallback(async () => {
        try {
            setLoadingEligible(true);
            const res = await tournamentAPI.getEligibleUsers(tournamentId, searchTerm || undefined);
            setEligibleUsers(Array.isArray(res.data) ? res.data : []);
        } catch (e) {
            toast.error((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Không thể tải danh sách khách hàng');
        } finally {
            setLoadingEligible(false);
        }
    }, [tournamentId, searchTerm]);

    useEffect(() => {
        fetchRegistrations();
    }, [fetchRegistrations]);

    // Debounce search - fetch eligible users when search term changes
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchEligibleUsers();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchEligibleUsers]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
                searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
                setShowUserList(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleAdd = async () => {
        const uid = selectedUserId ? parseInt(selectedUserId, 10) : 0;
        if (!uid) {
            toast.error('Vui lòng chọn khách hàng');
            return;
        }
        try {
            setAdding(true);
            await tournamentAPI.registerPlayer(tournamentId, uid);
            toast.success('Đăng kí thành công');
            setSelectedUserId('');
            setShowUserList(false);
            await fetchRegistrations();
            await fetchEligibleUsers();
            onBracketRefresh?.();
        } catch (e) {
            toast.error((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Không thể đăng kí');
        } finally {
            setAdding(false);
        }
    };

    const handleSelectUser = (userId: number) => {
        setSelectedUserId(userId.toString());
        setShowUserList(false);
    };

    const getSelectedUserName = () => {
        if (!selectedUserId) return '-- Chọn khách hàng --';
        const user = eligibleUsers.find(u => u.id === parseInt(selectedUserId, 10));
        if (!user) return '-- Chọn khách hàng --';
        return `${user.full_name} – ${user.phone_number} ${user.rank ? `(${user.rank})` : ''} ${user.email ? `- ${user.email}` : ''}`;
    };

    const handleRemoveClick = (player: TournamentRegisteredPlayer) => {
        setPlayerToRemove(player);
        setConfirmRemoveOpen(true);
    };

    const handleRemoveConfirm = async () => {
        if (!playerToRemove) return;
        try {
            setRemovingId(playerToRemove.id);
            await tournamentAPI.unregisterPlayer(tournamentId, playerToRemove.id);
            toast.success('Đã hủy đăng kí');
            setConfirmRemoveOpen(false);
            setPlayerToRemove(null);
            await fetchRegistrations();
            await fetchEligibleUsers();
            onBracketRefresh?.();
        } catch (e) {
            toast.error((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Không thể hủy đăng kí');
        } finally {
            setRemovingId(null);
        }
    };

    // getAvatarUrl is now imported from shared constants

    const isFull = numberOfPlayers > 0 && players.length >= numberOfPlayers;

    return (
        <div className="mt-4 space-y-4">
            {/* Thêm đăng kí: chọn khách hàng đủ điều kiện (hạng trùng, số lượng <= number_of_players) */}
            <Card>
                <div className="space-y-4">
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <Label htmlFor="search-user">Tìm kiếm (tên, số điện thoại, email)</Label>
                            <TextInput
                                ref={searchInputRef}
                                id="search-user"
                                type="text"
                                placeholder="Nhập tên, số điện thoại hoặc email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onFocus={() => setShowUserList(true)}
                                icon={() => <Icon icon="solar:magnifer-outline" />}
                            />
                        </div>
                    </div>
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="flex-1 min-w-[200px] relative" ref={dropdownRef}>
                            <Label htmlFor="eligible-user">Khách hàng đủ điều kiện (hạng trùng giải)</Label>
                            <div className="relative">
                                <button
                                    type="button"
                                    id="eligible-user"
                                    onClick={() => setShowUserList(!showUserList)}
                                    disabled={loadingEligible || isFull}
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-left text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
                                >
                                    <span className={selectedUserId ? '' : 'text-gray-500'}>
                                        {getSelectedUserName()}
                                    </span>
                                    <Icon
                                        icon="solar:alt-arrow-down-outline"
                                        className={`w-4 h-4 transition-transform ${showUserList ? 'rotate-180' : ''}`}
                                    />
                                </button>
                                {showUserList && (
                                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                                        {loadingEligible ? (
                                            <div className="p-4 text-center">
                                                <Spinner size="sm" />
                                            </div>
                                        ) : eligibleUsers.length === 0 ? (
                                            <div className="p-4 text-center text-gray-500 text-sm">
                                                {searchTerm ? 'Không tìm thấy khách hàng phù hợp' : 'Không có khách hàng đủ điều kiện'}
                                            </div>
                                        ) : (
                                            eligibleUsers.map((u) => (
                                                <button
                                                    key={u.id}
                                                    type="button"
                                                    onClick={() => handleSelectUser(u.id)}
                                                    className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${selectedUserId === u.id.toString() ? 'bg-blue-50 dark:bg-blue-900' : ''
                                                        }`}
                                                >
                                                    <div className="text-sm text-gray-900 dark:text-white">
                                                        {u.full_name} – {u.phone_number} {u.rank ? `(${u.rank})` : ''} {u.email ? `- ${u.email}` : ''}
                                                    </div>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        <Button
                            color="blue"
                            onClick={handleAdd}
                            disabled={adding || !selectedUserId || isFull}
                            className="mb-0"
                        >
                            {adding ? 'Đang thêm...' : 'Thêm đăng kí'}
                        </Button>
                    </div>
                    <div className="flex flex-col gap-1">
                        {loadingEligible && <span className="text-sm text-gray-500">Đang tải...</span>}
                        {isFull && <span className="text-sm text-amber-600">Giải đã đủ số lượng.</span>}
                        {!loadingEligible && !isFull && eligibleUsers.length === 0 && players.length > 0 && searchTerm && (
                            <span className="text-sm text-gray-500">Không tìm thấy khách hàng phù hợp với từ khóa tìm kiếm.</span>
                        )}
                        {!loadingEligible && !isFull && eligibleUsers.length === 0 && players.length > 0 && !searchTerm && (
                            <span className="text-sm text-gray-500">Không còn khách hàng phù hợp.</span>
                        )}
                        {!loadingEligible && !isFull && eligibleUsers.length === 0 && players.length === 0 && !searchTerm && (
                            <span className="text-sm text-gray-500">Chưa có khách hàng nào có hạng trùng với hạng giải.</span>
                        )}
                        {!loadingEligible && eligibleUsers.length > 0 && (
                            <span className="text-sm text-gray-500">Tìm thấy {eligibleUsers.length} khách hàng đủ điều kiện.</span>
                        )}
                    </div>
                    <p className="text-sm text-gray-500">
                        Đã đăng kí: {players.length} / {numberOfPlayers}
                    </p>
                </div>
            </Card>

            {/* Bảng danh sách đăng kí */}
            <div className="overflow-x-auto">
                <Table hoverable>
                    <Table.Head>
                        <Table.HeadCell className="text-center">STT</Table.HeadCell>
                        <Table.HeadCell className="text-center">ẢNH ĐẠI DIỆN</Table.HeadCell>
                        <Table.HeadCell className="text-center">TÊN</Table.HeadCell>
                        <Table.HeadCell className="text-center">SỐ ĐIỆN THOẠI</Table.HeadCell>
                        <Table.HeadCell className="text-center">HẠNG</Table.HeadCell>
                        <Table.HeadCell className="text-center">THỜI GIAN ĐĂNG KÍ</Table.HeadCell>
                        <Table.HeadCell className="text-center">HÀNH ĐỘNG</Table.HeadCell>
                    </Table.Head>
                    <Table.Body className="divide-y">
                        {loading ? (
                            <Table.Row>
                                <Table.Cell colSpan={7} className="text-center py-8">
                                    <Spinner />
                                </Table.Cell>
                            </Table.Row>
                        ) : players.length === 0 ? (
                            <Table.Row>
                                <Table.Cell colSpan={7} className="text-center py-8 text-gray-500">
                                    Chưa có người chơi nào đăng kí
                                </Table.Cell>
                            </Table.Row>
                        ) : (
                            players.map((player, index) => {
                                const avatarSrc = getAvatarUrl(player.avatar_url);
                                return (
                                    <Table.Row key={player.id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                                        <Table.Cell className="text-center">{index + 1}</Table.Cell>
                                        <Table.Cell className="text-center">
                                            <div className="w-10 h-10 mx-auto flex items-center justify-center">
                                                <img
                                                    src={avatarSrc}
                                                    alt={player.full_name}
                                                    className="max-w-full max-h-full object-contain"
                                                    onError={(e) => {
                                                        e.currentTarget.src = defaultAvatar;
                                                    }}
                                                />
                                            </div>
                                        </Table.Cell>
                                        <Table.Cell className="text-center font-medium">{player.full_name}</Table.Cell>
                                        <Table.Cell className="text-center">{player.phone_number}</Table.Cell>
                                        <Table.Cell className="text-center">{player.rank || '-'}</Table.Cell>
                                        <Table.Cell className="text-center">
                                            {player.registered_at ? new Date(player.registered_at).toLocaleString('vi-VN') : '-'}
                                        </Table.Cell>
                                        <Table.Cell className="text-center">
                                            <Button
                                                size="xs"
                                                color="failure"
                                                onClick={() => handleRemoveClick(player)}
                                                disabled={removingId === player.id}
                                            >
                                                {removingId === player.id ? '...' : 'Hủy đăng kí'}
                                            </Button>
                                        </Table.Cell>
                                    </Table.Row>
                                );
                            })
                        )}
                    </Table.Body>
                </Table>
            </div>

            {/* Dialog xác nhận hủy đăng kí */}
            <Modal show={confirmRemoveOpen} onClose={() => {
                setConfirmRemoveOpen(false);
                setPlayerToRemove(null);
            }}>
                <Modal.Header>Xác nhận hủy đăng kí</Modal.Header>
                <Modal.Body>
                    <p className="text-gray-700 dark:text-gray-300">
                        Bạn có chắc chắn muốn hủy đăng kí của <strong>{playerToRemove?.full_name}</strong> không?
                    </p>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        color="gray"
                        onClick={() => {
                            setConfirmRemoveOpen(false);
                            setPlayerToRemove(null);
                        }}
                        disabled={removingId !== null}
                    >
                        Hủy
                    </Button>
                    <Button
                        color="failure"
                        onClick={handleRemoveConfirm}
                        disabled={removingId !== null}
                    >
                        {removingId !== null ? 'Đang xử lý...' : 'Xác nhận'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default TournamentRegistrationsTab;
