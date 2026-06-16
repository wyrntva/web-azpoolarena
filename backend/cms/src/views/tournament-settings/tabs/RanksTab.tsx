import { useState, useEffect } from 'react';
import { Table, Button, Modal, Label, TextInput, Spinner } from 'flowbite-react';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import CustomPagination from '../../../components/shared/CustomPagination';
import { tournamentSettingsAPI } from '../../../api/tournamentSettings.api';
import type { TournamentRank } from '../../../types/api';
import { formatFullLevel } from '../../../utils/formatters';

const RanksTab = () => {
    const [ranks, setRanks] = useState<TournamentRank[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingRank, setEditingRank] = useState<TournamentRank | null>(null);
    const [formData, setFormData] = useState({
        order: 1,
        name: '',
        min_score: 0,
        max_score: 0,
        default_score: 0,
    });

    useEffect(() => {
        fetchRanks();
    }, []);

    const fetchRanks = async () => {
        try {
            setLoading(true);
            const response = await tournamentSettingsAPI.getRanks();
            setRanks(response.data || []);
            setCurrentPage(1);
        } catch (error) {
            toast.error((error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Không thể tải danh sách hạng');
        } finally {
            setLoading(false);
        }
    };

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentRanks = ranks.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(ranks.length / itemsPerPage);

    const handleCreate = () => {
        setEditingRank(null);
        setFormData({
            order: ranks.length + 1,
            name: '',
            min_score: 0,
            max_score: 0,
            default_score: 0,
        });
        setModalOpen(true);
    };

    const handleEdit = (rank: TournamentRank) => {
        setEditingRank(rank);
        setFormData({
            order: rank.order,
            name: rank.name,
            min_score: rank.min_score,
            max_score: rank.max_score,
            default_score: rank.default_score,
        });
        setModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Bạn có chắc muốn xóa hạng này?')) {
            try {
                await tournamentSettingsAPI.deleteRank(id);
                toast.success('Xóa hạng thành công');
                fetchRanks();
            } catch (error) {
                toast.error((error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Không thể xóa hạng');
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error('Vui lòng nhập tên hạng');
            return;
        }

        try {
            if (editingRank) {
                await tournamentSettingsAPI.updateRank(editingRank.id, formData);
                toast.success('Cập nhật hạng thành công');
            } else {
                await tournamentSettingsAPI.createRank(formData);
                toast.success('Thêm hạng thành công');
            }
            setModalOpen(false);
            fetchRanks();
        } catch (error) {
            toast.error((error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Không thể lưu hạng');
        }
    };

    const onPageChange = (page: number) => setCurrentPage(page);

    return (
        <div className="space-y-4">
            {/* Header with Add button */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Quản lý Level
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Cấu hình các mức Level và điểm số tương ứng
                    </p>
                </div>
                <Button onClick={handleCreate} color="blue" size="sm">
                    <Icon icon="solar:add-circle-outline" className="mr-2" />
                    Thêm Level
                </Button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <Table hoverable>
                    <Table.Head>
                        <Table.HeadCell>ID</Table.HeadCell>
                        <Table.HeadCell>THỨ TỰ</Table.HeadCell>
                        <Table.HeadCell>TÊN LEVEL</Table.HeadCell>
                        <Table.HeadCell>ĐIỂM TỐI THIỂU</Table.HeadCell>
                        <Table.HeadCell>ĐIỂM TỐI ĐA</Table.HeadCell>
                        <Table.HeadCell>ĐIỂM MẶC ĐỊNH</Table.HeadCell>
                        <Table.HeadCell>HÀNH ĐỘNG</Table.HeadCell>
                    </Table.Head>
                    <Table.Body className="divide-y">
                        {loading ? (
                            <Table.Row>
                                <Table.Cell colSpan={7} className="text-center py-8">
                                    <Spinner />
                                </Table.Cell>
                            </Table.Row>
                        ) : currentRanks.length === 0 ? (
                            <Table.Row>
                                <Table.Cell colSpan={7} className="text-center py-8 text-gray-500">
                                    Chưa có level nào
                                </Table.Cell>
                            </Table.Row>
                        ) : (
                            currentRanks.map((rank) => (
                                <Table.Row key={rank.id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                                    <Table.Cell className="font-medium">{rank.id}</Table.Cell>
                                    <Table.Cell>{rank.order}</Table.Cell>
                                    <Table.Cell className="font-bold text-lg">{formatFullLevel(rank.name)}</Table.Cell>
                                    <Table.Cell>{rank.min_score.toLocaleString()}</Table.Cell>
                                    <Table.Cell>{rank.max_score.toLocaleString()}</Table.Cell>
                                    <Table.Cell>{rank.default_score.toLocaleString()}</Table.Cell>
                                    <Table.Cell>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="xs"
                                                color="blue"
                                                onClick={() => handleEdit(rank)}
                                            >
                                                <Icon icon="solar:pen-new-square-outline" className="mr-1" />
                                                Cập nhật
                                            </Button>
                                            <Button
                                                size="xs"
                                                color="failure"
                                                onClick={() => handleDelete(rank.id)}
                                            >
                                                <Icon icon="solar:trash-bin-trash-outline" className="mr-1" />
                                                Xóa
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
            {ranks.length > 0 && (
                <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-blue-700 dark:text-blue-400">
                        Hiển thị từ {indexOfFirstItem + 1} đến {Math.min(indexOfLastItem, ranks.length)} trên tổng {ranks.length}
                    </span>
                    <CustomPagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={onPageChange}
                    />
                </div>
            )}

            {/* Create/Edit Modal */}
            <Modal show={modalOpen} onClose={() => setModalOpen(false)}>
                <form onSubmit={handleSubmit}>
                    <Modal.Header>
                        {editingRank ? 'Chỉnh sửa level' : 'Thêm level mới'}
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
                                <Label htmlFor="name" value="Mã Level (VD: I, H, G...)" />
                                <TextInput
                                    id="name"
                                    type="text"
                                    placeholder="VD: K, I, H, G, F..."
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    maxLength={10}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <Label htmlFor="min_score" value="Điểm tối thiểu" />
                                    <TextInput
                                        id="min_score"
                                        type="number"
                                        min={0}
                                        value={formData.min_score}
                                        onChange={(e) => setFormData({ ...formData, min_score: parseInt(e.target.value) || 0 })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="max_score" value="Điểm tối đa" />
                                    <TextInput
                                        id="max_score"
                                        type="number"
                                        min={0}
                                        value={formData.max_score}
                                        onChange={(e) => setFormData({ ...formData, max_score: parseInt(e.target.value) || 0 })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="default_score" value="Điểm mặc định" />
                                    <TextInput
                                        id="default_score"
                                        type="number"
                                        min={0}
                                        value={formData.default_score}
                                        onChange={(e) => setFormData({ ...formData, default_score: parseInt(e.target.value) || 0 })}
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button type="submit" color="blue">
                            {editingRank ? 'Cập nhật' : 'Thêm'}
                        </Button>
                        <Button color="gray" onClick={() => setModalOpen(false)}>
                            Hủy
                        </Button>
                    </Modal.Footer>
                </form>
            </Modal>
        </div>
    );
};

export default RanksTab;
