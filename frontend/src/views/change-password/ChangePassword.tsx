import { useState } from 'react';
import { Card, Button, Label, TextInput } from 'flowbite-react';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import { userAPI } from '../../api/user.api';

const ChangePassword = () => {
    const [oldPassword, setOldPassword] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            toast.error('Mật khẩu xác nhận không khớp!');
            return;
        }

        if (password.length < 6) {
            toast.error('Mật khẩu phải có ít nhất 6 ký tự!');
            return;
        }

        setLoading(true);
        try {
            await userAPI.changeMyPassword(oldPassword, password);
            toast.success('Đổi mật khẩu thành công!');
            setOldPassword('');
            setPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Lỗi khi đổi mật khẩu!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center h-full pt-10 px-4">
            <Card className="w-full max-w-md shadow-md rounded-2xl">
                <div className="flex flex-col gap-2 mb-6 text-center">
                    <div className="flex justify-center mb-2 text-primary">
                        <Icon icon="solar:lock-password-outline" height={48} />
                    </div>
                    <h5 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                        Đổi mật khẩu
                    </h5>
                    <p className="text-sm text-gray-500">
                        Vui lòng nhập mật khẩu mới để bảo mật tài khoản.
                    </p>
                </div>

                <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                    <div>
                        <div className="mb-2 block">
                            <Label htmlFor="old-password" value="Mật khẩu hiện tại" />
                        </div>
                        <div className="relative">
                            <TextInput
                                id="old-password"
                                type={showOldPassword ? 'text' : 'password'}
                                icon={() => <Icon icon="solar:key-minimalistic-square-outline" height={18} className="text-gray-500" />}
                                placeholder="Nhập mật khẩu hiện tại"
                                required
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                            />
                            <div 
                                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700"
                                onClick={() => setShowOldPassword(!showOldPassword)}
                            >
                                <Icon icon={showOldPassword ? "solar:eye-outline" : "solar:eye-closed-outline"} height={20} />
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <div className="mb-2 block">
                            <Label htmlFor="new-password" value="Mật khẩu mới" />
                        </div>
                        <div className="relative">
                            <TextInput
                                id="new-password"
                                type={showPassword ? 'text' : 'password'}
                                icon={() => <Icon icon="solar:key-outline" height={18} className="text-gray-500" />}
                                placeholder="Nhập mật khẩu mới"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <div 
                                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                <Icon icon={showPassword ? "solar:eye-outline" : "solar:eye-closed-outline"} height={20} />
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <div className="mb-2 block">
                            <Label htmlFor="confirm-password" value="Xác nhận mật khẩu mới" />
                        </div>
                        <div className="relative">
                            <TextInput
                                id="confirm-password"
                                type={showConfirmPassword ? 'text' : 'password'}
                                icon={() => <Icon icon="solar:key-minimalistic-outline" height={18} className="text-gray-500" />}
                                placeholder="Nhập lại mật khẩu mới"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                            <div 
                                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                <Icon icon={showConfirmPassword ? "solar:eye-outline" : "solar:eye-closed-outline"} height={20} />
                            </div>
                        </div>
                    </div>

                    <Button type="submit" className="w-full mt-4" disabled={loading}>
                        {loading ? 'Đang lưu...' : 'Lưu mật khẩu mới'}
                    </Button>
                </form>
            </Card>
        </div>
    );
};

export default ChangePassword;
