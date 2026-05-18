import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { userAPI } from '../../../api/user.api';
import { useAuth } from '../../../auth/AuthContext';
import { isAdmin as checkIsAdmin } from '../../../auth/roles';

interface PayrollItemAPI {
    getAll: (params?: any) => Promise<{ data: any[] }>;
    create: (data: any) => Promise<any>;
    update: (id: number, data: any) => Promise<any>;
    delete: (id: number) => Promise<any>;
}

interface UsePayrollItemOptions {
    api: PayrollItemAPI;
    itemName: string;
    selectedDate?: dayjs.Dayjs;
}

export const usePayrollItem = ({ api, itemName, selectedDate }: UsePayrollItemOptions) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<any>(null);

    const [formData, setFormData] = useState({
        user_id: '',
        date: dayjs().format('YYYY-MM-DD'),
        amount: '',
        notes: '',
    });

    const isAdmin = checkIsAdmin(user);

    const fetchEmployees = useCallback(async () => {
        try {
            const res = await userAPI.getUsers();
            setEmployees(res.data.filter((u: any) => u.is_active));
        } catch (error) {
            // Silently fail
        }
    }, []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = selectedDate ? {
                start_date: selectedDate.startOf('month').format('YYYY-MM-DD'),
                end_date: selectedDate.endOf('month').format('YYYY-MM-DD')
            } : undefined;
            const res = await api.getAll(params);
            setItems(res.data || []);
        } catch (error) {
            toast.error(`Không thể tải danh sách ${itemName}`);
        } finally {
            setLoading(false);
        }
    }, [api, itemName, selectedDate]);

    useEffect(() => {
        fetchData();
        if (isAdmin) fetchEmployees();
    }, [fetchData, fetchEmployees, isAdmin]);

    const handleOpenModal = useCallback((record: any = null) => {
        if (record) {
            setEditingRecord(record);
            setFormData({
                user_id: record.user_id?.toString() || '',
                date: record.date || dayjs().format('YYYY-MM-DD'),
                amount: record.amount?.toString() || '',
                notes: record.notes || '',
            });
        } else {
            setEditingRecord(null);
            setFormData({
                user_id: '',
                date: dayjs().format('YYYY-MM-DD'),
                amount: '',
                notes: '',
            });
        }
        setModalOpen(true);
    }, []);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                user_id: parseInt(formData.user_id),
                amount: parseFloat(formData.amount),
            };

            if (editingRecord) {
                await api.update(editingRecord.id, payload);
                toast.success('Cập nhật thành công');
            } else {
                await api.create(payload);
                toast.success('Thêm mới thành công');
            }
            setModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error('Lỗi khi lưu dữ liệu');
        }
    }, [api, editingRecord, fetchData, formData]);

    const handleDelete = useCallback(async (id: number) => {
        if (window.confirm('Bạn có chắc muốn xóa phiếu này?')) {
            try {
                await api.delete(id);
                toast.success('Đã xóa');
                fetchData();
            } catch (error) {
                toast.error('Xóa thất bại');
            }
        }
    }, [api, fetchData]);

    const closeModal = useCallback(() => {
        setModalOpen(false);
    }, []);

    return {
        loading,
        items,
        employees,
        modalOpen,
        editingRecord,
        formData,
        setFormData,
        isAdmin,
        handleOpenModal,
        handleSubmit,
        handleDelete,
        closeModal,
        fetchData,
    };
};
