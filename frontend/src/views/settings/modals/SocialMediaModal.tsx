/**
 * Social Media Information Modal — edit TikTok, Facebook, YouTube, etc.
 */
import { Label, TextInput } from 'flowbite-react';
import BaseDialog from '../../../components/shared/BaseDialog';
import { type SocialMediaInfo } from '../constants';

interface SocialMediaModalProps {
    open: boolean;
    onClose: () => void;
    socialMediaInfo: SocialMediaInfo;
    onChange: (info: SocialMediaInfo) => void;
    onSave: () => void;
}

const SOCIAL_FIELDS: {
    key: keyof SocialMediaInfo;
    label: string;
    id: string;
    type: string;
    placeholder: string;
}[] = [
        { key: 'tiktok', label: 'TikTok', id: 'tiktok', type: 'url', placeholder: 'https://www.tiktok.com/@username' },
        { key: 'facebook', label: 'Facebook', id: 'facebook', type: 'url', placeholder: 'https://www.facebook.com/username' },
        { key: 'youtube', label: 'YouTube', id: 'youtube', type: 'url', placeholder: 'https://www.youtube.com/@channel' },
        { key: 'phone', label: 'Số điện thoại', id: 'social_phone', type: 'tel', placeholder: '0842486222' },
        { key: 'gmail', label: 'Gmail', id: 'gmail', type: 'email', placeholder: 'example@gmail.com' },
        { key: 'address', label: 'Địa chỉ', id: 'social_address', type: 'text', placeholder: 'Nhập địa chỉ' },
    ];

const SocialMediaModal = ({ open, onClose, socialMediaInfo, onChange, onSave }: SocialMediaModalProps) => {
    return (
        <BaseDialog
            open={open}
            onClose={onClose}
            title="Thiết lập thông tin mạng xã hội"
            size="2xl"
            onConfirm={onSave}
            confirmText="Lưu"
            bodyClassName="space-y-4"
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SOCIAL_FIELDS.map((field) => (
                    <div key={field.key}>
                        <Label htmlFor={field.id} className="text-gray-700 dark:text-gray-300">
                            {field.label}
                        </Label>
                        <TextInput
                            id={field.id}
                            type={field.type}
                            placeholder={field.placeholder}
                            value={socialMediaInfo[field.key]}
                            onChange={(e) => onChange({ ...socialMediaInfo, [field.key]: e.target.value })}
                        />
                    </div>
                ))}
            </div>
        </BaseDialog>
    );
};

export default SocialMediaModal;
