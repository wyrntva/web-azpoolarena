/**
 * Customer Edit Modal — edit customer profile, avatar, and social links.
 * Extracted from Customers.tsx for maintainability.
 */
import { FormEvent, useRef, useState } from 'react';
import { Button, Label, Select, TextInput } from 'flowbite-react';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import BaseDialog from '../../components/shared/BaseDialog';
import ImageCropModal from '../../components/ImageCropModal';
import { poolArenaUserAPI } from '../../api/poolArenaUser.api';
import type { PoolArenaUser, TournamentRank } from '../../types/api';
import { defaultAvatar } from '../../constants/shared';
import { formatFullLevel } from '../../utils/formatters';

// ============================================
// TYPES
// ============================================

interface CustomerFormData {
    full_name: string;
    phone_number: string;
    email: string;
    gender: string;
    birthday: string;
    rank: string;
    address: string;
    is_active: boolean;
    is_phone_verified: boolean;
    points: number;
    avatar_url: string;
    tiktok_url: string;
    facebook_url: string;
    instagram_url: string;
}

const DEFAULT_FORM_DATA: CustomerFormData = {
    full_name: '',
    phone_number: '',
    email: '',
    gender: '',
    birthday: '',
    rank: '',
    address: '',
    is_active: true,
    is_phone_verified: false,
    points: 0,
    avatar_url: '',
    tiktok_url: '',
    facebook_url: '',
    instagram_url: '',
};

const SOCIAL_FIELDS: { id: keyof CustomerFormData; label: string; placeholder: string }[] = [
    { id: 'tiktok_url', label: 'TikTok URL', placeholder: 'https://tiktok.com/@username' },
    { id: 'facebook_url', label: 'Facebook URL', placeholder: 'https://facebook.com/username' },
    { id: 'instagram_url', label: 'Instagram URL', placeholder: 'https://instagram.com/username' },
];

export const getMissingVerificationFields = (data: CustomerFormData): string[] => {
    const missing: string[] = [];
    if (!data.full_name || !data.full_name.trim()) missing.push('Họ và tên');
    if (!data.phone_number || !data.phone_number.trim()) missing.push('Số điện thoại');
    if (!data.email || !data.email.trim()) missing.push('Email');
    if (!data.gender || !data.gender.trim()) missing.push('Giới tính');
    if (!data.rank || !data.rank.trim()) missing.push('Level');
    if (data.points === undefined || data.points === null || isNaN(Number(data.points))) missing.push('Điểm');
    if (!data.birthday || !data.birthday.trim()) missing.push('Ngày sinh');
    if (!data.is_active) missing.push('Trạng thái (Hoạt động)');
    return missing;
};

interface CustomerEditModalProps {
    open: boolean;
    onClose: () => void;
    customer: PoolArenaUser | null;
    ranks: TournamentRank[];
    onSaved: () => void;
}

// ============================================
// COMPONENT
// ============================================

const CustomerEditModal = ({ open, onClose, customer, ranks, onSaved }: CustomerEditModalProps) => {
    const [formData, setFormData] = useState<CustomerFormData>(DEFAULT_FORM_DATA);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [resettingPassword, setResettingPassword] = useState(false);
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [selectedImageSrc, setSelectedImageSrc] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // populate form when customer changes
    const prevCustomerId = useRef<number | null>(null);
    if (customer && customer.id !== prevCustomerId.current) {
        prevCustomerId.current = customer.id;
        // Sync form data with incoming customer prop (runs once per customer)
        setFormData({
            full_name: customer.full_name,
            phone_number: customer.phone_number,
            email: customer.email || '',
            gender: customer.gender || '',
            birthday: customer.birthday ? customer.birthday.slice(0, 10) : '',
            rank: customer.rank || '',
            address: customer.address || '',
            is_active: customer.is_active,
            is_phone_verified: Boolean(customer.is_phone_verified),
            points: customer.points ?? 0,
            avatar_url: customer.avatar_url || '',
            tiktok_url: customer.tiktok_url || '',
            facebook_url: customer.facebook_url || '',
            instagram_url: customer.instagram_url || '',
        });
    }

    const update = <K extends keyof CustomerFormData>(key: K, value: CustomerFormData[K]) =>
        setFormData(prev => ({ ...prev, [key]: value }));

    // --- Avatar ---

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !customer) return;
        if (!file.type.startsWith('image/')) { toast.error('Vui lòng chọn file ảnh'); return; }
        const reader = new FileReader();
        reader.onload = () => { setSelectedImageSrc(reader.result as string); setCropModalOpen(true); };
        reader.readAsDataURL(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleCropComplete = async (croppedImage: Blob) => {
        if (!customer) return;
        setUploadingAvatar(true);
        try {
            const file = new File([croppedImage], 'avatar.png', { type: 'image/png' });
            const response = await poolArenaUserAPI.uploadAvatar(customer.id, file);
            update('avatar_url', response.data.avatar_url);
            toast.success('Tải ảnh lên thành công');
        } catch (error) {
            const detail = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
            toast.error(detail || 'Tải ảnh lên thất bại');
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleDeleteAvatar = async () => {
        if (!customer || !window.confirm('Bạn có chắc muốn xóa ảnh đại diện?')) return;
        try {
            await poolArenaUserAPI.deleteAvatar(customer.id);
            update('avatar_url', '');
            toast.success('Đã xóa ảnh đại diện');
        } catch (error) {
            const detail = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
            toast.error(detail || 'Xóa ảnh thất bại');
        }
    };

    // --- Reset Password ---

    const handleResetPassword = async () => {
        if (!customer) return;
        if (!window.confirm(`Bạn có chắc chắn muốn đặt lại mật khẩu của khách hàng "${customer.full_name}" về mặc định (poolarenavn)?`)) {
            return;
        }
        setResettingPassword(true);
        try {
            await poolArenaUserAPI.resetPassword(customer.id);
            toast.success('Đặt lại mật khẩu thành công! Mật khẩu mới: poolarenavn');
        } catch (error) {
            const detail = (error as { response?: { data?: { detail?: string; message?: string } } })?.response?.data;
            toast.error(detail?.detail || detail?.message || 'Đặt lại mật khẩu thất bại');
        } finally {
            setResettingPassword(false);
        }
    };

    // --- Submit ---

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!customer) return;
        if (!formData.full_name || !formData.phone_number) {
            toast.error('Vui lòng điền đầy đủ thông tin'); return;
        }
        if (formData.is_phone_verified) {
            const missing = getMissingVerificationFields(formData);
            if (missing.length > 0) {
                toast.error(`Không thể xác thực tài khoản. Vui lòng bổ sung: ${missing.join(', ')}`);
                return;
            }
        }
        try {
            await poolArenaUserAPI.updateUser(customer.id, {
                full_name: formData.full_name,
                phone_number: formData.phone_number,
                email: formData.email || null,
                gender: formData.gender || null,
                birthday: formData.birthday || null,
                rank: formData.rank || null,
                address: formData.address || null,
                is_active: formData.is_active,
                is_phone_verified: formData.is_phone_verified,
                points: formData.points,
                avatar_url: formData.avatar_url || null,
                tiktok_url: formData.tiktok_url || null,
                facebook_url: formData.facebook_url || null,
                instagram_url: formData.instagram_url || null,
            });
            toast.success('Cập nhật khách hàng thành công');
            onSaved();
            onClose();
        } catch (error) {
            const detail = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
            toast.error(detail || 'Cập nhật thất bại');
        }
    };

    return (
        <>
            <BaseDialog
                open={open}
                onClose={onClose}
                title="Chỉnh sửa khách hàng"
                size="lg"
                showFooter={false}
                bodyClassName="space-y-4 max-h-[70vh] overflow-y-auto"
            >
                <form onSubmit={handleSubmit}>
                    {/* Avatar Upload */}
                    <AvatarUploadSection
                        avatarUrl={formData.avatar_url}
                        uploading={uploadingAvatar}
                        fileInputRef={fileInputRef}
                        onFileChange={handleAvatarChange}
                        onDelete={handleDeleteAvatar}
                    />

                    {/* Main form fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="full_name" value="Họ và tên" />
                            <TextInput id="full_name" value={formData.full_name}
                                onChange={(e) => update('full_name', e.target.value)} required />
                        </div>
                        <div>
                            <Label htmlFor="phone_number" value="Số điện thoại" />
                            <TextInput id="phone_number" value={formData.phone_number}
                                onChange={(e) => update('phone_number', e.target.value)} required />
                        </div>
                        <div>
                            <Label htmlFor="email" value="Email" />
                            <TextInput id="email" value={formData.email}
                                onChange={(e) => update('email', e.target.value)} />
                        </div>
                        <div>
                            <Label htmlFor="gender" value="Giới tính" />
                            <Select id="gender" value={formData.gender}
                                onChange={(e) => update('gender', e.target.value)}>
                                <option value="">Chọn giới tính</option>
                                <option value="male">Nam</option>
                                <option value="female">Nữ</option>
                                <option value="other">Khác</option>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="rank" value="Level" />
                            <Select id="rank" value={formData.rank}
                                onChange={(e) => {
                                    const selectedName = e.target.value;
                                    const selectedRank = ranks.find(r => r.name === selectedName);
                                    setFormData(prev => ({
                                        ...prev,
                                        rank: selectedName,
                                        ...(selectedRank ? { points: selectedRank.default_score } : {}),
                                    }));
                                }}>
                                <option value="">Chọn level</option>
                                {ranks.map((rank) => (
                                    <option key={rank.id} value={rank.name}>{formatFullLevel(rank.name)}</option>
                                ))}
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="points" value="Điểm" />
                            <TextInput id="points" type="number" value={formData.points}
                                onChange={(e) => update('points', Number(e.target.value))} />
                        </div>
                        <div>
                            <Label htmlFor="birthday" value="Ngày sinh" />
                            <TextInput
                                id="birthday"
                                type="date"
                                value={formData.birthday}
                                onChange={(e) => update('birthday', e.target.value)}
                            />
                        </div>
                        <div>
                            <Label htmlFor="is_active" value="Trạng thái" />
                            <Select id="is_active" value={formData.is_active.toString()}
                                onChange={(e) => update('is_active', e.target.value === 'true')}>
                                <option value="true">Hoạt động</option>
                                <option value="false">Vô hiệu</option>
                            </Select>
                        </div>
                        <div className="md:col-span-2">
                            <Label htmlFor="address" value="Địa chỉ" />
                            <TextInput id="address" value={formData.address}
                                onChange={(e) => update('address', e.target.value)} />
                        </div>

                        {/* Verified Account Section */}
                        <div className="md:col-span-2 p-3.5 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-1.5 font-semibold text-sm text-gray-800 dark:text-gray-200">
                                        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none">
                                            <circle cx="12" cy="12" r="11" fill="#3793F6" />
                                            <path d="M7.5 12.3L10.5 15.3L16.5 8.8" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <span>Tài khoản xác thực</span>
                                        {formData.is_phone_verified && (
                                            <span className="bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-xs px-2 py-0.5 rounded-full font-semibold inline-flex items-center gap-1 border border-blue-200 dark:border-blue-800">
                                                <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none">
                                                    <circle cx="12" cy="12" r="11" fill="#3793F6" />
                                                    <path d="M7.5 12.3L10.5 15.3L16.5 8.8" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                Đã có tích xanh
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {getMissingVerificationFields(formData).length > 0 ? (
                                            <span className="text-amber-600 dark:text-amber-400 font-medium">
                                                * Cần điền đủ các mục để chọn xác thực: {getMissingVerificationFields(formData).join(', ')}
                                            </span>
                                        ) : (
                                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                                ✓ Đã đủ thông tin để kích hoạt tài khoản xác thực (tích xanh)
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <div className="shrink-0 w-full sm:w-48">
                                    <Select
                                        id="is_phone_verified"
                                        value={formData.is_phone_verified ? 'true' : 'false'}
                                        onChange={(e) => {
                                            const willVerify = e.target.value === 'true';
                                            if (willVerify) {
                                                const missing = getMissingVerificationFields(formData);
                                                if (missing.length > 0) {
                                                    toast.error(`Chưa thể xác thực! Cần điền đầy đủ: ${missing.join(', ')}`, {
                                                        duration: 4500,
                                                    });
                                                    return;
                                                }
                                            }
                                            update('is_phone_verified', willVerify);
                                        }}
                                    >
                                        <option value="false">Chưa xác thực</option>
                                        <option value="true" disabled={getMissingVerificationFields(formData).length > 0}>
                                            Xác thực (Tích xanh) {getMissingVerificationFields(formData).length > 0 ? '— Chưa đủ thông tin' : ''}
                                        </option>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Social Media Links */}
                    <div className="border-t pt-4 mt-2">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                            Liên kết mạng xã hội
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                            {SOCIAL_FIELDS.map((field) => (
                                <div key={field.id}>
                                    <Label htmlFor={field.id} value={field.label} />
                                    <TextInput
                                        id={field.id}
                                        value={formData[field.id] as string}
                                        onChange={(e) => update(field.id, e.target.value)}
                                        placeholder={field.placeholder}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Password Reset Section */}
                    <div className="border-t pt-4 mt-2">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                            <Icon icon="solar:shield-keyhole-outline" className="text-base text-amber-500" />
                            Mật khẩu tài khoản
                        </h3>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                            <div>
                                <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                                    Đặt lại mật khẩu mặc định
                                </p>
                                <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                                    Mật khẩu của khách hàng sẽ được đặt lại về mặc định: <span className="font-mono font-bold bg-amber-100 dark:bg-amber-900/50 px-1.5 py-0.5 rounded text-amber-800 dark:text-amber-200">poolarenavn</span>
                                </p>
                            </div>
                            <Button
                                type="button"
                                color="warning"
                                size="sm"
                                onClick={handleResetPassword}
                                disabled={resettingPassword}
                                className="shrink-0"
                            >
                                <Icon icon="solar:restart-bold" className="mr-1.5 text-base" />
                                {resettingPassword ? 'Đang đặt lại...' : 'Reset mật khẩu'}
                            </Button>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                        <Button type="submit" color="blue">Cập nhật</Button>
                        <Button type="button" color="gray" onClick={onClose}>Hủy</Button>
                    </div>
                </form>
            </BaseDialog>

            <ImageCropModal
                open={cropModalOpen}
                onClose={() => setCropModalOpen(false)}
                imageSrc={selectedImageSrc}
                onCropComplete={handleCropComplete}
                aspect={3 / 4}
            />
        </>
    );
};

export default CustomerEditModal;

// ============================================
// SUB-COMPONENT: Avatar Upload
// ============================================

function AvatarUploadSection({ avatarUrl, uploading, fileInputRef, onFileChange, onDelete }: {
    avatarUrl: string;
    uploading: boolean;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onDelete: () => void;
}) {
    return (
        <div className="flex flex-col items-center gap-4">
            <div className="w-[123px] h-[155px] rounded overflow-hidden flex items-center justify-center">
                <img
                    src={avatarUrl || defaultAvatar}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.src = defaultAvatar; }}
                />
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
            <div className="flex gap-2">
                <Button type="button" color="light" size="sm"
                    onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    {uploading ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2" />
                            Đang tải...
                        </>
                    ) : (
                        <>
                            <Icon icon="solar:camera-outline" className="mr-2" />
                            {avatarUrl ? 'Thay đổi ảnh' : 'Tải ảnh lên'}
                        </>
                    )}
                </Button>
                {avatarUrl && (
                    <Button type="button" color="failure" size="sm" onClick={onDelete} disabled={uploading}>
                        <Icon icon="solar:trash-bin-minimalistic-outline" className="mr-2" />
                        Xóa ảnh
                    </Button>
                )}
            </div>
        </div>
    );
}
