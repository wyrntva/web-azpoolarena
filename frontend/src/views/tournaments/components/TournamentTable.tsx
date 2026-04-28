import { Card, Table, TextInput, Button } from 'flowbite-react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router';
import { useState, useCallback, useMemo } from 'react';
import CustomPagination from '../../../components/shared/CustomPagination';
import { tournamentAPI, type Tournament } from '../../../api/tournament.api';
import BaseDialog from '../../../components/shared/BaseDialog';
import { TOURNAMENT_STATUS_MAP, TOURNAMENT_TYPE_MAP, getImageUrl as getImageUrlShared } from '../../../constants/shared';

interface TournamentTableProps {
    tournaments: Tournament[];
    currentPage: number;
    onPageChange: (page: number) => void;
    onRefresh?: () => void;
    onUpdate?: (tournamentId: number) => void;
}



const TournamentTable = ({ tournaments, currentPage, onPageChange, onRefresh, onUpdate }: TournamentTableProps) => {
    const navigate = useNavigate();
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [tournamentToDelete, setTournamentToDelete] = useState<Tournament | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const handleDeleteClick = useCallback((tournament: Tournament) => {
        setTournamentToDelete(tournament);
        setDeleteModalOpen(true);
    }, []);

    const handleDeleteConfirm = async () => {
        if (!tournamentToDelete) return;

        try {
            setDeleting(true);
            await tournamentAPI.deleteTournament(tournamentToDelete.id);
            setDeleteModalOpen(false);
            setTournamentToDelete(null);
            onRefresh?.();
        } catch {
            alert('Không thể xóa giải đấu. Vui lòng thử lại.');
        } finally {
            setDeleting(false);
        }
    };

    const getImageUrl = useCallback((tournament: Tournament) => {
        const url = tournament.banner || tournament.organizer_logo;
        return getImageUrlShared(url);
    }, []);

    // Filter tournaments by search term
    const filteredTournaments = useMemo(() => {
        if (!searchTerm.trim()) return tournaments;
        const term = searchTerm.toLowerCase();
        return tournaments.filter(t =>
            t.name.toLowerCase().includes(term) ||
            t.location?.toLowerCase().includes(term) ||
            t.organizer?.toLowerCase().includes(term)
        );
    }, [tournaments, searchTerm]);
    return (
        <Card className="overflow-hidden rounded-lg shadow-sm">
            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row justify-end items-center gap-4 p-4 border-b dark:border-gray-700">
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <TextInput
                        id="search"
                        type="text"
                        placeholder="Tìm kiếm..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        icon={() => <Icon icon="solar:magnifer-outline" />}
                        className="w-full md:w-auto"
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <Table hoverable>
                    <Table.Head>
                        <Table.HeadCell className="text-center">STT</Table.HeadCell>
                        <Table.HeadCell className="text-center">ẢNH</Table.HeadCell>
                        <Table.HeadCell className="text-center">TÊN</Table.HeadCell>
                        <Table.HeadCell className="text-center">HẠNG</Table.HeadCell>
                        <Table.HeadCell className="text-center">TRẠNG THÁI</Table.HeadCell>
                        <Table.HeadCell className="text-center">HIỂN THỊ</Table.HeadCell>
                        <Table.HeadCell className="text-center">LƯỢT ĐĂNG KÝ</Table.HeadCell>
                        <Table.HeadCell className="text-center">LOẠI GIẢI ĐẤU</Table.HeadCell>
                        <Table.HeadCell className="text-center">HÀNH ĐỘNG</Table.HeadCell>
                    </Table.Head>
                    <Table.Body className="divide-y">
                        {filteredTournaments.length === 0 ? (
                            <Table.Row>
                                <Table.Cell colSpan={9} className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    {searchTerm ? 'Không tìm thấy kết quả' : 'Không có dữ liệu'}
                                </Table.Cell>
                            </Table.Row>
                        ) : (
                            filteredTournaments.map((tournament, index) => {
                                const imageUrl = getImageUrl(tournament);
                                return (
                                    <Table.Row
                                        key={tournament.id}
                                        className="bg-white dark:border-gray-700 dark:bg-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                                        onClick={() => navigate(`/tournaments/${tournament.id}`)}
                                    >
                                        <Table.Cell className="text-center">{(currentPage - 1) * 50 + index + 1}</Table.Cell>
                                        <Table.Cell className="text-center">
                                            {imageUrl ? (
                                                <img
                                                    src={imageUrl}
                                                    alt={tournament.name}
                                                    className="w-12 h-8 object-cover rounded mx-auto"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                                    }}
                                                />
                                            ) : null}
                                            <div className={`w-12 h-8 bg-gray-200 rounded overflow-hidden flex items-center justify-center mx-auto ${imageUrl ? 'hidden' : ''}`}>
                                                <div className="w-full h-full bg-slate-900 flex items-center justify-center text-xs text-white font-bold">AZ</div>
                                            </div>
                                        </Table.Cell>
                                        <Table.Cell className="text-center whitespace-nowrap font-medium text-gray-900 dark:text-white">
                                            {tournament.name}
                                        </Table.Cell>
                                        <Table.Cell className="text-center">
                                            {tournament.ranks && tournament.ranks.length > 0 ? (
                                                <div className="flex flex-wrap gap-1 justify-center">
                                                    {tournament.ranks.map((rank, idx) => (
                                                        <span key={idx} className="px-2 py-1 text-blue-800 text-xs">
                                                            {rank}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </Table.Cell>
                                        <Table.Cell className="text-center">
                                            <span className="px-2 py-1 text-gray-800 text-xs">
                                                {TOURNAMENT_STATUS_MAP[tournament.status] || tournament.status}
                                            </span>
                                        </Table.Cell>
                                        <Table.Cell className="text-center">
                                            <span className="px-2 py-1 text-green-800 text-xs">
                                                {tournament.display === 'public' ? 'Công khai' : 'Riêng tư'}
                                            </span>
                                        </Table.Cell>
                                        <Table.Cell className="text-center">
                                            <span className="text-gray-500">
                                                {tournament.registration_count ?? 0}/{tournament.number_of_players}
                                            </span>
                                        </Table.Cell>
                                        <Table.Cell className="text-center">
                                            {tournament.tournament_type ? (TOURNAMENT_TYPE_MAP[tournament.tournament_type] || tournament.tournament_type) : '-'}
                                        </Table.Cell>
                                        <Table.Cell className="text-center">
                                            <div className="flex items-center gap-2 justify-center" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={() => onUpdate?.(tournament.id)}
                                                    className="font-medium text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                                                >
                                                    <Icon icon="solar:pen-new-square-outline" /> Cập nhật
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(tournament)}
                                                    className="font-medium text-red-600 hover:underline flex items-center gap-1 cursor-pointer"
                                                >
                                                    <Icon icon="solar:trash-bin-trash-outline" /> Xóa
                                                </button>
                                            </div>
                                        </Table.Cell>
                                    </Table.Row>
                                );
                            })
                        )}
                    </Table.Body>
                </Table>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t">
                <span className="text-sm text-blue-700 dark:text-blue-400">
                    Hiển thị {filteredTournaments.length} / {tournaments.length} giải đấu
                    {searchTerm && ` (tìm kiếm: "${searchTerm}")`}
                </span>
                <CustomPagination
                    currentPage={currentPage}
                    totalPages={Math.max(1, Math.ceil(filteredTournaments.length / 50))}
                    onPageChange={onPageChange}
                />
            </div>

            {/* Delete Confirmation Dialog */}
            <BaseDialog
                open={deleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setTournamentToDelete(null);
                }}
                title="Xác nhận xóa"
                size="md"
                showFooter={true}
                footer={
                    <>
                        <Button
                            type="button"
                            color="gray"
                            onClick={() => {
                                setDeleteModalOpen(false);
                                setTournamentToDelete(null);
                            }}
                            disabled={deleting}
                        >
                            Hủy
                        </Button>
                        <Button
                            type="button"
                            color="failure"
                            onClick={handleDeleteConfirm}
                            disabled={deleting}
                        >
                            {deleting ? 'Đang xóa...' : 'Xóa'}
                        </Button>
                    </>
                }
            >
                <p className="text-gray-700 dark:text-gray-300">
                    Bạn có chắc chắn muốn xóa giải đấu <strong>{tournamentToDelete?.name}</strong> không?
                </p>
                <p className="text-sm text-red-600 mt-2">Hành động này không thể hoàn tác.</p>
            </BaseDialog>
        </Card>
    );
};

export default TournamentTable;
