import { useState } from 'react';
import { Button, Modal, Label, TextInput } from 'flowbite-react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { payrollAPI } from '../../../api/payroll.api';
import PayrollItemManager from './PayrollItemManager';
import { useAuth } from '../../../auth/AuthContext';

const penaltyAPI = {
    getAll: payrollAPI.getPenalties,
    create: payrollAPI.createPenalty,
    update: payrollAPI.updatePenalty,
    delete: payrollAPI.deletePenalty,
};

const Penalty = () => {
    const { user } = useAuth();
    const [autoGenModalOpen, setAutoGenModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [autoGenData, setAutoGenData] = useState({
        startDate: dayjs().subtract(7, 'days').format('YYYY-MM-DD'),
        endDate: dayjs().format('YYYY-MM-DD'),
    });

    const isAdmin = user?.role?.name === 'admin' || user?.role?.name === 'Quản lý';

    const handleAutoGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await payrollAPI.autoGeneratePenalties({
                start_date: autoGenData.startDate,
                end_date: autoGenData.endDate,
            });
            toast.success(`Đã tạo ${res.data.length} phiếu phạt tự động`);
            setAutoGenModalOpen(false);
            window.location.reload(); // Refresh to show new penalties
        } catch (error) {
            toast.error('Lỗi khi tạo phạt tự động');
        } finally {
            setLoading(false);
        }
    };

    const autoGenButton = isAdmin ? (
        <Button onClick={() => setAutoGenModalOpen(true)} color="warning" size="sm">
            Phạt tự động
        </Button>
    ) : null;

    return (
        <>
            <PayrollItemManager
                api={penaltyAPI}
                title="Danh sách phiếu phạt"
                itemName="phạt"
                buttonLabel="Tạo phiếu phạt"
                buttonColor="failure"
                amountColor="text-red-700"
                notesPlaceholder="Lý do phạt..."
                extraActions={autoGenButton}
            />

            <Modal show={autoGenModalOpen} onClose={() => setAutoGenModalOpen(false)}>
                <form onSubmit={handleAutoGenerate}>
                    <Modal.Header>Tạo phiếu phạt tự động</Modal.Header>
                    <Modal.Body className="space-y-4">
                        <p className="text-sm text-gray-500">
                            Hệ thống sẽ quét bảng chấm công và tự động tạo phiếu phạt cho các vi phạm
                            (Vắng mặt, đi muộn, về sớm) trong khoảng thời gian này.
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label value="Từ ngày" />
                                <TextInput
                                    type="date"
                                    value={autoGenData.startDate}
                                    onChange={(e) => setAutoGenData({ ...autoGenData, startDate: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <Label value="Đến ngày" />
                                <TextInput
                                    type="date"
                                    value={autoGenData.endDate}
                                    onChange={(e) => setAutoGenData({ ...autoGenData, endDate: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button type="submit" color="warning" disabled={loading}>
                            {loading ? 'Đang tạo...' : 'Bắt đầu tạo'}
                        </Button>
                        <Button color="gray" onClick={() => setAutoGenModalOpen(false)}>Hủy</Button>
                    </Modal.Footer>
                </form>
            </Modal>
        </>
    );
};

export default Penalty;
