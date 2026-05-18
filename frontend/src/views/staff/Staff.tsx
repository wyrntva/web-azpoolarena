/**
 * Staff Page — displays staff list with pagination, create/edit/delete actions.
 *
 * Extracted: StaffFormModal → StaffFormModal.tsx
 */
import { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Checkbox, Label } from 'flowbite-react';
import toast from 'react-hot-toast';
import { userAPI } from '../../api/user.api';
import { roleAPI } from '../../api/role.api';
import CustomPagination from '../../components/shared/CustomPagination';
import StaffFormModal from './StaffFormModal';
import type { User, Role } from './StaffFormModal';

// ============================================
// CONSTANTS
// ============================================

const ROLE_BADGE_COLORS: Record<string, string> = {
    'admin': 'failure',
    'Quản trị': 'failure',
    'accountant': 'info',
    'Trưởng ca': 'info',
    'staff': 'success',
    'Nhân viên': 'success',
};

const ITEMS_PER_PAGE = 50;

// ============================================
// MAIN COMPONENT
// ============================================

const Staff = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [showInactive, setShowInactive] = useState(false);

    // --- Data Loading ---

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await userAPI.getUsers();
            setUsers(response.data as any);
        } catch (error) {
            toast.error('Không thể tải danh sách nhân viên');
        } finally {
            setLoading(false);
        }
    };

    const fetchRoles = async () => {
        try {
            const response = await roleAPI.getRoles();
            setRoles(response.data);
        } catch (error) {
            toast.error('Không thể tải danh sách vai trò');
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchRoles();
    }, []);

    // --- Pagination ---

    const filteredUsers = users.filter(u => showInactive || u.is_active);
    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);

    // --- Actions ---

    const handleCreate = () => {
        setEditingUser(null);
        setModalOpen(true);
    };

    const handleEdit = async (user: User) => {
        try {
            const res = await userAPI.getUser(user.id);
            setEditingUser(res.data as any);
            setModalOpen(true);
        } catch (error) {
            toast.error('Không thể tải thông tin chi tiết nhân viên');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Bạn có chắc muốn xóa nhân viên này?')) return;
        try {
            await userAPI.deleteUser(id);
            toast.success('Xóa nhân viên thành công');
            fetchUsers();
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || error.response?.data?.detail || 'Xóa nhân viên thất bại';
            toast.error(errorMsg);
        }
    };

    // --- Render ---

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý nhân viên</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Quản lý thông tin nhân viên và phân quyền hệ thống
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Checkbox id="showInactive" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
                        <Label htmlFor="showInactive" className="text-sm text-gray-500 font-medium cursor-pointer">Hiển thị NV đã xóa</Label>
                    </div>
                    <Button onClick={handleCreate} color="blue">Thêm nhân viên</Button>
                </div>
            </div>

            <Card>
                <div className="overflow-x-auto">
                    <Table>
                        <Table.Head>
                            <Table.HeadCell>Số điện thoại</Table.HeadCell>
                            <Table.HeadCell>Gmail</Table.HeadCell>
                            <Table.HeadCell>Họ và tên</Table.HeadCell>
                            <Table.HeadCell>Mã PIN</Table.HeadCell>
                            <Table.HeadCell>Vai trò</Table.HeadCell>
                            <Table.HeadCell>Trạng thái</Table.HeadCell>
                            <Table.HeadCell><span className="sr-only">Actions</span></Table.HeadCell>
                        </Table.Head>
                        <Table.Body className="divide-y">
                            {loading ? (
                                <Table.Row>
                                    <Table.Cell colSpan={7} className="text-center py-8">
                                        <div className="flex justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                                        </div>
                                    </Table.Cell>
                                </Table.Row>
                            ) : users.length === 0 ? (
                                <Table.Row>
                                    <Table.Cell colSpan={7} className="text-center py-8 text-gray-500">
                                        Chưa có nhân viên nào
                                    </Table.Cell>
                                </Table.Row>
                            ) : (
                                currentUsers.map((staff) => (
                                    <StaffRow
                                        key={staff.id}
                                        staff={staff}
                                        onEdit={() => handleEdit(staff)}
                                        onDelete={() => handleDelete(staff.id)}
                                    />
                                ))
                            )}
                        </Table.Body>
                    </Table>
                </div>

                {filteredUsers.length > 0 && (
                    <div className="flex justify-between items-center pt-4 p-4 border-t border-gray-200 dark:border-gray-700">
                        <span className="text-sm text-blue-700 dark:text-blue-400">
                            Hiển thị từ {indexOfFirstItem + 1} đến {Math.min(indexOfLastItem, filteredUsers.length)} trên tổng {filteredUsers.length}
                        </span>
                        <CustomPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                    </div>
                )}
            </Card>

            <StaffFormModal
                open={modalOpen}
                onClose={() => { setModalOpen(false); setEditingUser(null); }}
                editingUser={editingUser}
                roles={roles}
                onSaved={fetchUsers}
            />
        </div>
    );
};

export default Staff;

// ============================================
// SUB-COMPONENT: Staff Table Row
// ============================================

function StaffRow({ staff, onEdit, onDelete }: {
    staff: User; onEdit: () => void; onDelete: () => void;
}) {
    return (
        <Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800">
            <Table.Cell className="font-medium text-gray-900 dark:text-white">
                <strong>{staff.username}</strong>
            </Table.Cell>
            <Table.Cell>{staff.email || '----'}</Table.Cell>
            <Table.Cell>{staff.full_name}</Table.Cell>
            <Table.Cell className="font-mono font-bold tracking-widest">{staff.pin || '----'}</Table.Cell>
            <Table.Cell>
                <Badge color={ROLE_BADGE_COLORS[staff.role?.name] || 'gray'}>{staff.role?.name || 'N/A'}</Badge>
            </Table.Cell>
            <Table.Cell>
                <Badge color={staff.is_active ? 'success' : 'gray'}>
                    {staff.is_active ? 'Hoạt động' : 'Vô hiệu'}
                </Badge>
            </Table.Cell>
            <Table.Cell>
                <div className="flex gap-2">
                    <Button size="xs" color="info" onClick={onEdit}>Sửa</Button>
                    <Button size="xs" color="failure" onClick={onDelete}>Xóa</Button>
                </div>
            </Table.Cell>
        </Table.Row>
    );
}
