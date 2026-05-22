import { useState, useEffect } from 'react';
import { Table, Button, Spinner } from 'flowbite-react';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import CustomPagination from '../../../components/shared/CustomPagination';
import { tournamentSettingsAPI } from '../../../api/tournamentSettings.api';
import type { TournamentRound } from '../../../types/api';
import RoundFormModal, { type RoundFormData, DEFAULT_ROUND_FORM } from '../components/RoundFormModal';

// ============================================
// HELPERS
// ============================================


// ============================================
// COMPONENT
// ============================================

const TournamentsTab = () => {
    const [tournamentRounds, setTournamentRounds] = useState<TournamentRound[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingRound, setEditingRound] = useState<TournamentRound | null>(null);
    const [formData, setFormData] = useState<RoundFormData>(DEFAULT_ROUND_FORM);
    const [currentPage, setCurrentPage] = useState(1);

    const itemsPerPage = 10;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentRounds = tournamentRounds.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(tournamentRounds.length / itemsPerPage);

    useEffect(() => { fetchRounds(); }, []);

    const fetchRounds = async () => {
        try {
            setLoading(true);
            const response = await tournamentSettingsAPI.getRounds();
            setTournamentRounds(response.data || []);
            setCurrentPage(1);
        } catch (error) {
            toast.error((error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Không thể tải danh sách giải đấu');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingRound(null);
        setFormData({ ...DEFAULT_ROUND_FORM, order: tournamentRounds.length + 1 });
        setModalOpen(true);
    };

    const handleEdit = (round: TournamentRound) => {
        setEditingRound(round);
        setFormData({
            name: round.name,
            description: round.description || '',
            order: round.order,
            tournament_type: round.tournament_type || '',
            number_of_players: round.number_of_players || null,
            multiplier: round.multiplier || null,
            is_active: round.is_active,
            network: '',
        });
        setModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Bạn có chắc muốn xóa giải đấu này?')) {
            try {
                await tournamentSettingsAPI.deleteRound(id);
                toast.success('Xóa giải đấu thành công');
                fetchRounds();
            } catch (error) {
                toast.error((error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Không thể xóa giải đấu');
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast.error('Vui lòng nhập tên loại giải đấu');
            return;
        }
        try {
            if (editingRound) {
                await tournamentSettingsAPI.updateRound(editingRound.id, formData);
                toast.success('Cập nhật giải đấu thành công');
            } else {
                await tournamentSettingsAPI.createRound(formData);
                toast.success('Thêm loại giải đấu thành công');
            }
            setModalOpen(false);
            fetchRounds();
        } catch (error) {
            toast.error((error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Không thể lưu giải đấu');
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Quản lý loại giải đấu
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Thêm và quản lý các loại giải đấu (Loại trực tiếp, Nhánh thắng thua, Vòng tròn, Thụy Sĩ, Loại trực tiếp đơn)
                    </p>
                </div>
                <Button onClick={handleCreate} color="blue" size="sm">
                    <Icon icon="solar:add-circle-outline" className="mr-2" />
                    Thêm loại giải đấu
                </Button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <Table hoverable>
                    <Table.Head>
                        <Table.HeadCell className="text-center">THỨ TỰ</Table.HeadCell>
                        <Table.HeadCell className="text-center">LOẠI GIẢI ĐẤU</Table.HeadCell>
                        <Table.HeadCell className="text-center">SỐ LƯỢNG CƠ THỦ</Table.HeadCell>
                        <Table.HeadCell className="text-center">TRẠNG THÁI</Table.HeadCell>
                        <Table.HeadCell className="text-center">HÀNH ĐỘNG</Table.HeadCell>
                    </Table.Head>
                    <Table.Body className="divide-y">
                        {loading ? (
                            <Table.Row>
                                <Table.Cell colSpan={5} className="text-center py-8">
                                    <Spinner />
                                </Table.Cell>
                            </Table.Row>
                        ) : currentRounds.length === 0 ? (
                            <Table.Row>
                                <Table.Cell colSpan={5} className="text-center py-8 text-gray-500">
                                    Chưa có giải đấu nào
                                </Table.Cell>
                            </Table.Row>
                        ) : (
                            currentRounds.map((round) => (
                                <Table.Row key={round.id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                                    <Table.Cell className="text-center">{round.order}</Table.Cell>
                                    <Table.Cell className="text-center">{round.name || '-'}</Table.Cell>
                                    <Table.Cell className="text-center">
                                        {round.number_of_players != null ? round.number_of_players : '-'}
                                    </Table.Cell>
                                    <Table.Cell className="text-center">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${round.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {round.is_active ? 'Hoạt động' : 'Vô hiệu'}
                                        </span>
                                    </Table.Cell>
                                    <Table.Cell className="text-center">
                                        <div className="flex items-center gap-2 justify-center">
                                            <Button size="xs" color="blue" onClick={() => handleEdit(round)}>
                                                <Icon icon="solar:pen-new-square-outline" className="mr-1" /> Sửa
                                            </Button>
                                            <Button size="xs" color="failure" onClick={() => handleDelete(round.id)}>
                                                <Icon icon="solar:trash-bin-trash-outline" className="mr-1" /> Xóa
                                            </Button>
                                        </div>
                                    </Table.Cell>
                                </Table.Row>
                            ))
                        )}
                    </Table.Body>
                </Table>
            </div>

            {/* Pagination */}
            {tournamentRounds.length > 0 && (
                <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-blue-700 dark:text-blue-400">
                        Hiển thị từ {indexOfFirstItem + 1} đến {Math.min(indexOfLastItem, tournamentRounds.length)} trên tổng {tournamentRounds.length}
                    </span>
                    <CustomPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </div>
            )}

            {/* Modal */}
            <RoundFormModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                editingRound={editingRound}
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleSubmit}
            />
        </div>
    );
};

export default TournamentsTab;
