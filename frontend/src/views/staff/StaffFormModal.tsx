import { useState, useRef, useEffect } from 'react';
import { Button, Modal, Label, TextInput, Select, Radio, Spinner } from 'flowbite-react';
import toast from 'react-hot-toast';
import { userAPI } from '../../api/user.api';
import { poolArenaUserAPI } from '../../api/poolArenaUser.api';
import type { PoolArenaUser } from '../../types/api';

// ============================================
// TYPES
// ============================================

interface Role {
    id: number;
    name: string;
}

interface User {
    id: number;
    username: string;
    full_name: string;
    email?: string;
    role_id: number;
    role: Role;
    is_active: boolean;
    pin: string;
    salary_type: 'hourly' | 'fixed';
    hourly_rate?: number;
    fixed_salary?: number;
}

interface StaffFormData {
    username: string;
    full_name: string;
    email: string;
    password: string;
    role_id: number;
    is_active: boolean;
    pin: string;
    salary_type: 'hourly' | 'fixed';
    hourly_rate: number;
    fixed_salary: number;
}

interface StaffFormModalProps {
    open: boolean;
    onClose: () => void;
    editingUser: User | null;
    roles: Role[];
    onSaved: () => void;
}

// ============================================
// COMPONENT
// ============================================

const StaffFormModal = ({ open, onClose, editingUser, roles, onSaved }: StaffFormModalProps) => {
    const [formData, setFormData] = useState<StaffFormData>(getInitialFormData(editingUser, roles));
    const prevUserId = useRef<number | null | undefined>(undefined);
    const isEditing = editingUser !== null;

    // Customer search state (create mode only)
    const [search, setSearch] = useState('');
    const [customers, setCustomers] = useState<PoolArenaUser[]>([]);
    const [searching, setSearching] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<PoolArenaUser | null>(null);

    // Sync form data when editingUser changes
    if ((editingUser?.id ?? null) !== prevUserId.current) {
        prevUserId.current = editingUser?.id ?? null;
        setFormData(getInitialFormData(editingUser, roles));
    }

    // Reset customer search when modal closes
    useEffect(() => {
        if (!open) {
            setSearch('');
            setCustomers([]);
            setSelectedCustomer(null);
        }
    }, [open]);

    // Debounced customer search
    useEffect(() => {
        if (isEditing || !open || !search.trim()) {
            setCustomers([]);
            return;
        }
        const timer = setTimeout(async () => {
            setSearching(true);
            try {
                const res = await poolArenaUserAPI.getUsers({ search: search.trim(), limit: 20 });
                setCustomers(res.data?.data || []);
            } catch { /* ignore */ }
            finally { setSearching(false); }
        }, 300);
        return () => clearTimeout(timer);
    }, [search, isEditing, open]);

    const update = <K extends keyof StaffFormData>(key: K, value: StaffFormData[K]) =>
        setFormData(prev => ({ ...prev, [key]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isEditing) {
            if (!formData.full_name || !formData.role_id) {
                toast.error('Vui lòng điền đầy đủ thông tin');
                return;
            }
            try {
                const data: Partial<StaffFormData & { password?: string }> & Record<string, unknown> = { ...formData };
                if (data.salary_type === 'hourly') delete data.fixed_salary;
                else delete data.hourly_rate;
                if (!data.email || (data.email as string).trim() === '') delete data.email;
                delete data.username;
                if (!data.password) delete data.password;
                await userAPI.updateUser(editingUser!.id, data);
                toast.success('Cập nhật nhân viên thành công');
                onClose();
                onSaved();
            } catch (error) {
                const errData = (error as { response?: { data?: { message?: string; detail?: string } } })?.response?.data;
                toast.error(errData?.message || errData?.detail || 'Thao tác thất bại');
            }
        } else {
            if (!selectedCustomer) {
                toast.error('Vui lòng chọn khách hàng');
                return;
            }
            if (!formData.role_id || !formData.pin) {
                toast.error('Vui lòng điền đầy đủ thông tin');
                return;
            }
            try {
                const data: Record<string, unknown> = {
                    pool_arena_user_id: selectedCustomer.id,
                    role_id: formData.role_id,
                    pin: formData.pin,
                    salary_type: formData.salary_type,
                    is_active: formData.is_active,
                };
                if (formData.salary_type === 'hourly') data.hourly_rate = formData.hourly_rate;
                else data.fixed_salary = formData.fixed_salary;
                await userAPI.promoteFromCustomer(data as unknown as Parameters<typeof userAPI.promoteFromCustomer>[0]);
                toast.success('Thêm nhân viên thành công');
                onClose();
                onSaved();
            } catch (error) {
                const errData = (error as { response?: { data?: { message?: string; detail?: string } } })?.response?.data;
                toast.error(errData?.message || errData?.detail || 'Thao tác thất bại');
            }
        }
    };

    return (
        <Modal show={open} onClose={onClose}>
            <form onSubmit={handleSubmit}>
                <Modal.Header>
                    {isEditing ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}
                </Modal.Header>
                <Modal.Body className="space-y-4">
                    {isEditing ? (
                        <EditFields formData={formData} update={update} roles={roles} />
                    ) : (
                        <>
                            <CustomerSearch
                                search={search}
                                onSearchChange={setSearch}
                                customers={customers}
                                searching={searching}
                                selectedCustomer={selectedCustomer}
                                onSelect={(c) => { setSelectedCustomer(c); setSearch(''); setCustomers([]); }}
                                onDeselect={() => setSelectedCustomer(null)}
                            />
                            {selectedCustomer && (
                                <CreateStaffFields formData={formData} update={update} roles={roles} />
                            )}
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button type="submit" color="blue">{isEditing ? 'Cập nhật' : 'Thêm'}</Button>
                    <Button color="gray" onClick={onClose}>Hủy</Button>
                </Modal.Footer>
            </form>
        </Modal>
    );
};

export default StaffFormModal;

// Re-export types for use by parent
export type { User, Role };

// ============================================
// HELPERS
// ============================================

function getInitialFormData(user: User | null, roles: Role[]): StaffFormData {
    if (user) {
        return {
            username: user.username,
            full_name: user.full_name,
            email: user.email || '',
            password: '',
            role_id: user.role?.id || user.role_id,
            is_active: user.is_active,
            pin: user.pin || '',
            salary_type: user.salary_type || 'hourly',
            hourly_rate: user.hourly_rate || 0,
            fixed_salary: user.fixed_salary || 0,
        };
    }
    return {
        username: '',
        full_name: '',
        email: '',
        password: '',
        role_id: roles[0]?.id || 0,
        is_active: true,
        pin: '',
        salary_type: 'hourly',
        hourly_rate: 20000,
        fixed_salary: 0,
    };
}

// ============================================
// SUB-COMPONENT: Edit fields (existing staff)
// ============================================

function EditFields({ formData, update, roles }: {
    formData: StaffFormData;
    update: <K extends keyof StaffFormData>(key: K, value: StaffFormData[K]) => void;
    roles: Role[];
}) {
    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="username" value="Số điện thoại" />
                    <TextInput id="username" value={formData.username} disabled />
                </div>
                <div>
                    <Label htmlFor="full_name" value="Họ và tên" />
                    <TextInput id="full_name" value={formData.full_name}
                        onChange={(e) => update('full_name', e.target.value)} required />
                </div>
                <div>
                    <Label htmlFor="email" value="Gmail" />
                    <TextInput id="email" type="email" value={formData.email}
                        onChange={(e) => update('email', e.target.value)}
                        placeholder="example@gmail.com" />
                </div>
                <div>
                    <Label htmlFor="password" value="Mật khẩu mới (tùy chọn)" />
                    <TextInput id="password" type="password" value={formData.password}
                        onChange={(e) => update('password', e.target.value)}
                        placeholder="******" />
                </div>
                <div>
                    <Label htmlFor="pin" value="Mã PIN (4 số)" />
                    <TextInput id="pin" value={formData.pin}
                        onChange={(e) => update('pin', e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                        maxLength={4} required placeholder="1234" />
                </div>
                <div>
                    <Label htmlFor="role_id" value="Vai trò" />
                    <Select id="role_id" value={formData.role_id}
                        onChange={(e) => update('role_id', Number(e.target.value))} required>
                        <option value={0}>Chọn vai trò</option>
                        {roles.map((role) => (
                            <option key={role.id} value={role.id}>{role.name}</option>
                        ))}
                    </Select>
                </div>
                <div>
                    <Label htmlFor="is_active" value="Trạng thái" />
                    <Select id="is_active" value={formData.is_active.toString()}
                        onChange={(e) => update('is_active', e.target.value === 'true')} required>
                        <option value="true">Hoạt động</option>
                        <option value="false">Vô hiệu hóa</option>
                    </Select>
                </div>
            </div>
            <SalarySection
                salaryType={formData.salary_type}
                hourlyRate={formData.hourly_rate}
                fixedSalary={formData.fixed_salary}
                onTypeChange={(type) => update('salary_type', type)}
                onHourlyChange={(val) => update('hourly_rate', val)}
                onFixedChange={(val) => update('fixed_salary', val)}
            />
        </>
    );
}

// ============================================
// SUB-COMPONENT: Create fields (after customer selected)
// ============================================

function CreateStaffFields({ formData, update, roles }: {
    formData: StaffFormData;
    update: <K extends keyof StaffFormData>(key: K, value: StaffFormData[K]) => void;
    roles: Role[];
}) {
    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="pin" value="Mã PIN (4 số)" />
                    <TextInput id="pin" value={formData.pin}
                        onChange={(e) => update('pin', e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                        maxLength={4} required placeholder="1234" />
                </div>
                <div>
                    <Label htmlFor="role_id" value="Vai trò" />
                    <Select id="role_id" value={formData.role_id}
                        onChange={(e) => update('role_id', Number(e.target.value))} required>
                        <option value={0}>Chọn vai trò</option>
                        {roles.map((role) => (
                            <option key={role.id} value={role.id}>{role.name}</option>
                        ))}
                    </Select>
                </div>
                <div>
                    <Label htmlFor="is_active" value="Trạng thái" />
                    <Select id="is_active" value={formData.is_active.toString()}
                        onChange={(e) => update('is_active', e.target.value === 'true')} required>
                        <option value="true">Hoạt động</option>
                        <option value="false">Vô hiệu hóa</option>
                    </Select>
                </div>
            </div>
            <SalarySection
                salaryType={formData.salary_type}
                hourlyRate={formData.hourly_rate}
                fixedSalary={formData.fixed_salary}
                onTypeChange={(type) => update('salary_type', type)}
                onHourlyChange={(val) => update('hourly_rate', val)}
                onFixedChange={(val) => update('fixed_salary', val)}
            />
        </>
    );
}

// ============================================
// SUB-COMPONENT: Customer Search
// ============================================

function CustomerSearch({ search, onSearchChange, customers, searching, selectedCustomer, onSelect, onDeselect }: {
    search: string;
    onSearchChange: (val: string) => void;
    customers: PoolArenaUser[];
    searching: boolean;
    selectedCustomer: PoolArenaUser | null;
    onSelect: (c: PoolArenaUser) => void;
    onDeselect: () => void;
}) {
    if (selectedCustomer) {
        return (
            <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20 p-4">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{selectedCustomer.full_name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{selectedCustomer.phone_number}</p>
                        {selectedCustomer.email && (
                            <p className="text-sm text-gray-500 dark:text-gray-500">{selectedCustomer.email}</p>
                        )}
                    </div>
                    <button type="button" onClick={onDeselect}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none ml-4">
                        ✕
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <Label htmlFor="customer-search" value="Tìm khách hàng" />
            <div className="relative">
                <TextInput
                    id="customer-search"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Nhập tên hoặc số điện thoại..."
                    autoComplete="off"
                />
                {searching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Spinner size="sm" />
                    </div>
                )}
            </div>
            {search.trim() && !searching && customers.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 px-1">Không tìm thấy khách hàng nào</p>
            )}
            {customers.length > 0 && (
                <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                    {customers.map((c) => {
                        const isAlreadyStaff = c.user_type === 'both';
                        return (
                            <div
                                key={c.id}
                                onClick={() => !isAlreadyStaff && onSelect(c)}
                                className={`flex items-center justify-between px-4 py-2.5 ${
                                    isAlreadyStaff
                                        ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800'
                                        : 'cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30'
                                }`}
                            >
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{c.full_name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{c.phone_number}</p>
                                </div>
                                {isAlreadyStaff && (
                                    <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full whitespace-nowrap">
                                        Đã là NV
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ============================================
// SUB-COMPONENT: Salary Section
// ============================================

function SalarySection({ salaryType, hourlyRate, fixedSalary, onTypeChange, onHourlyChange, onFixedChange }: {
    salaryType: 'hourly' | 'fixed';
    hourlyRate: number;
    fixedSalary: number;
    onTypeChange: (type: 'hourly' | 'fixed') => void;
    onHourlyChange: (value: number) => void;
    onFixedChange: (value: number) => void;
}) {
    return (
        <>
            <div className="space-y-2">
                <Label value="Loại lương" />
                <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                        <Radio id="hourly" name="salary_type" value="hourly"
                            checked={salaryType === 'hourly'} onChange={() => onTypeChange('hourly')} />
                        <Label htmlFor="hourly">Lương theo giờ</Label>
                    </div>
                    <div className="flex items-center gap-2">
                        <Radio id="fixed" name="salary_type" value="fixed"
                            checked={salaryType === 'fixed'} onChange={() => onTypeChange('fixed')} />
                        <Label htmlFor="fixed">Lương cứng</Label>
                    </div>
                </div>
            </div>

            {salaryType === 'fixed' ? (
                <div>
                    <Label htmlFor="fixed_salary" value="Lương tháng" />
                    <TextInput id="fixed_salary" type="number" value={fixedSalary}
                        onChange={(e) => onFixedChange(Number(e.target.value))} required />
                </div>
            ) : (
                <div>
                    <Label htmlFor="hourly_rate" value="Hệ số (Lương theo giờ)" />
                    <TextInput id="hourly_rate" type="number" value={hourlyRate}
                        onChange={(e) => onHourlyChange(Number(e.target.value))} required />
                </div>
            )}
        </>
    );
}
