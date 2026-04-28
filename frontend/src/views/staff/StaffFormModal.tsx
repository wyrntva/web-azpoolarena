/**
 * Staff Form Modal — create/edit staff member with role, salary, and PIN.
 * Extracted from Staff.tsx for maintainability.
 */
import { useState, useRef } from 'react';
import { Button, Modal, Label, TextInput, Select, Radio } from 'flowbite-react';
import toast from 'react-hot-toast';
import { userAPI } from '../../api/user.api';

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

    // Sync form data when editingUser changes
    const prevUserId = useRef<number | null | undefined>(undefined);
    const isEditing = editingUser !== null;

    if ((editingUser?.id ?? null) !== prevUserId.current) {
        prevUserId.current = editingUser?.id ?? null;
        setFormData(getInitialFormData(editingUser, roles));
    }

    const update = <K extends keyof StaffFormData>(key: K, value: StaffFormData[K]) =>
        setFormData(prev => ({ ...prev, [key]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.username || !formData.full_name || !formData.role_id) {
            toast.error('Vui lòng điền đầy đủ thông tin');
            return;
        }
        try {
            const data: any = { ...formData };
            if (data.salary_type === 'hourly') delete data.fixed_salary;
            else delete data.hourly_rate;

            if (isEditing) {
                delete data.username;
                if (!data.password) delete data.password;
                await userAPI.updateUser(editingUser!.id, data);
                toast.success('Cập nhật nhân viên thành công');
            } else {
                await userAPI.createUser(data);
                toast.success('Thêm nhân viên thành công');
            }
            onClose();
            onSaved();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Thao tác thất bại');
        }
    };

    return (
        <Modal show={open} onClose={onClose}>
            <form onSubmit={handleSubmit}>
                <Modal.Header>
                    {isEditing ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}
                </Modal.Header>
                <Modal.Body className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="username" value="Số điện thoại" />
                            <TextInput id="username" value={formData.username}
                                onChange={(e) => update('username', e.target.value)}
                                disabled={isEditing} required placeholder="0123456789" />
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
                            <Label htmlFor="password"
                                value={isEditing ? 'Mật khẩu mới (tùy chọn)' : 'Mật khẩu'} />
                            <TextInput id="password" type="password" value={formData.password}
                                onChange={(e) => update('password', e.target.value)}
                                required={!isEditing} placeholder="******" />
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

                    {/* Salary type toggle */}
                    <SalarySection
                        salaryType={formData.salary_type}
                        hourlyRate={formData.hourly_rate}
                        fixedSalary={formData.fixed_salary}
                        onTypeChange={(type) => update('salary_type', type)}
                        onHourlyChange={(val) => update('hourly_rate', val)}
                        onFixedChange={(val) => update('fixed_salary', val)}
                    />
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
