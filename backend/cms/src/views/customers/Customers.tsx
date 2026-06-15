/**
 * Customers Page — displays customer list with search, pagination, edit/delete actions.
 *
 * Extracted: CustomerEditModal → CustomerEditModal.tsx
 */
import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Table, TextInput } from 'flowbite-react';
import toast from 'react-hot-toast';
import CustomPagination from '../../components/shared/CustomPagination';
import { poolArenaUserAPI } from '../../api/poolArenaUser.api';
import { tournamentSettingsAPI } from '../../api/tournamentSettings.api';
import type { PoolArenaUser, TournamentRank } from '../../types/api';
import CustomerEditModal from './CustomerEditModal';
import { defaultAvatar, GENDER_LABELS } from '../../constants/shared';

const ITEMS_PER_PAGE = 50;

// ============================================
// MAIN COMPONENT
// ============================================

const Customers = () => {
    const [customers, setCustomers] = useState<PoolArenaUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<PoolArenaUser | null>(null);
    const [ranks, setRanks] = useState<TournamentRank[]>([]);
    const [currentPage, setCurrentPage] = useState(1);

    // --- Data Loading ---

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const response = await poolArenaUserAPI.getUsers({ limit: 10000 });
            setCustomers(response.data?.data || []);
        } catch (_error) {
            toast.error('Không thể tải danh sách khách hàng');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
        tournamentSettingsAPI.getRanks()
            .then(res => setRanks(res.data || []))
            .catch(() => toast.error('Không thể tải danh sách hạng'));
    }, []);


    // --- Filtering & Pagination ---

    const filteredCustomers = useMemo(() => {
        if (!Array.isArray(customers)) return [];
        const keyword = search.trim().toLowerCase();
        if (!keyword) return customers;
        return customers.filter((c) =>
            [c.full_name, c.phone_number, c.email || '', c.rank || '']
                .join(' ').toLowerCase().includes(keyword)
        );
    }, [customers, search]);

    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    const currentCustomers = filteredCustomers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);

    // --- Actions ---

    const handleEdit = (customer: PoolArenaUser) => {
        setEditingCustomer(customer);
        setModalOpen(true);
    };

    const handleDelete = async (customer: PoolArenaUser) => {
        if (!window.confirm(`Bạn có chắc muốn xóa khách hàng ${customer.full_name}?`)) return;
        try {
            await poolArenaUserAPI.deleteUser(customer.id);
            toast.success('Xóa khách hàng thành công');
            fetchCustomers();
        } catch (error) {
            const detail = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
            toast.error(detail || 'Xóa khách hàng thất bại');
        }
    };

    // --- Render ---

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Danh sách khách hàng</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Hiển thị toàn bộ người chơi đã đăng ký qua web PoolArena
                    </p>
                </div>
                <div className="w-full md:w-72">
                    <TextInput value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                        placeholder="Tìm theo tên, SĐT, email, hạng" />
                </div>
            </div>

            {/* Customer Table */}
            <Card>
                <div className="overflow-x-auto">
                    <Table>
                        <Table.Head>
                            <Table.HeadCell className="w-20">Ảnh</Table.HeadCell>
                            <Table.HeadCell>Họ và tên</Table.HeadCell>
                            <Table.HeadCell>Số điện thoại</Table.HeadCell>
                            <Table.HeadCell>Email</Table.HeadCell>
                            <Table.HeadCell>Giới tính</Table.HeadCell>
                            <Table.HeadCell>Hạng</Table.HeadCell>
                            <Table.HeadCell>Điểm</Table.HeadCell>
                            <Table.HeadCell><span className="sr-only">Actions</span></Table.HeadCell>
                        </Table.Head>
                        <Table.Body className="divide-y">
                            {loading ? (
                                <Table.Row>
                                    <Table.Cell colSpan={8} className="text-center py-8">
                                        <div className="flex justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                                        </div>
                                    </Table.Cell>
                                </Table.Row>
                            ) : filteredCustomers.length === 0 ? (
                                <Table.Row>
                                    <Table.Cell colSpan={8} className="text-center py-8 text-gray-500">
                                        Chưa có khách hàng nào
                                    </Table.Cell>
                                </Table.Row>
                            ) : (
                                currentCustomers.map((customer) => (
                                    <CustomerRow
                                        key={customer.id}
                                        customer={customer}
                                        onEdit={() => handleEdit(customer)}
                                        onDelete={() => handleDelete(customer)}
                                    />
                                ))
                            )}
                        </Table.Body>
                    </Table>
                </div>

                {filteredCustomers.length > 0 && (
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between pt-4 p-4 border-t border-gray-200 dark:border-gray-700">
                        <span className="text-sm text-blue-700 dark:text-blue-400">
                            Hiển thị từ {indexOfFirstItem + 1} đến {Math.min(indexOfLastItem, filteredCustomers.length)} trên tổng {filteredCustomers.length}
                        </span>
                        <CustomPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                    </div>
                )}
            </Card>

            {/* Edit Modal */}
            <CustomerEditModal
                open={modalOpen}
                onClose={() => { setModalOpen(false); setEditingCustomer(null); }}
                customer={editingCustomer}
                ranks={ranks}
                onSaved={fetchCustomers}
            />
        </div>
    );
};

export default Customers;

// ============================================
// SUB-COMPONENT: Customer Table Row
// ============================================

function CustomerRow({ customer, onEdit, onDelete }: {
    customer: PoolArenaUser; onEdit: () => void; onDelete: () => void;
}) {
    return (
        <Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800">
            <Table.Cell>
                <div className="w-[60px] h-[75px] rounded overflow-hidden flex items-center justify-center">
                    <img 
                        src={customer.avatar_url 
                            ? (customer.avatar_url.startsWith('http') || customer.avatar_url.startsWith('data:') 
                                ? customer.avatar_url 
                                : `${import.meta.env.VITE_API_URL || ''}${customer.avatar_url.startsWith('/') ? '' : '/'}${customer.avatar_url}`) 
                            : defaultAvatar
                        } 
                        alt={customer.full_name}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.src = defaultAvatar; }} 
                    />
                </div>
            </Table.Cell>
            <Table.Cell className="font-medium text-gray-900 dark:text-white">{customer.full_name}</Table.Cell>
            <Table.Cell>{customer.phone_number}</Table.Cell>
            <Table.Cell>{customer.email || '-'}</Table.Cell>
            <Table.Cell>{GENDER_LABELS[customer.gender || ''] || '-'}</Table.Cell>
            <Table.Cell>{customer.rank || '-'}</Table.Cell>
            <Table.Cell>{customer.points ?? 0}</Table.Cell>
            <Table.Cell>
                <div className="flex gap-2">
                    <Button size="xs" color="info" onClick={onEdit}>Sửa</Button>
                    <Button size="xs" color="failure" onClick={onDelete}>Xóa</Button>
                </div>
            </Table.Cell>
        </Table.Row>
    );
}
