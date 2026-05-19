import { useState, useEffect, useMemo } from 'react';
import { Card, Button, Modal, Label, Checkbox, TextInput } from 'flowbite-react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { workScheduleAPI } from '../../api/attendance.api';
import { userAPI } from '../../api/user.api';
import { useAuth } from '../../auth/AuthContext';
import { isShiftLeaderOrAdmin } from '../../auth/roles';
import { formatDate } from '../../utils/formatters';

const WorkSchedule = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [schedules, setSchedules] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedCell, setSelectedCell] = useState<any>(null);
    const [copying, setCopying] = useState(false);
    const [targetDates, setTargetDates] = useState<string[]>([]);

    const [formData, setFormData] = useState({
        off_day: false,
        start_time: '08:00',
        end_time: '17:00',
    });

    const canEdit = isShiftLeaderOrAdmin(user);

    const mondayDate = useMemo(() => {
        return selectedDate.subtract((selectedDate.day() + 6) % 7, 'days').startOf('day');
    }, [selectedDate]);

    const scheduleMap = useMemo(() => {
        const map: any = {};
        schedules.forEach((s) => {
            map[`${s.user_id}_${s.work_date}`] = s;
        });
        return map;
    }, [schedules]);

    useEffect(() => {
        fetchData();
    }, [selectedDate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const start = mondayDate.format('YYYY-MM-DD');
            const end = mondayDate.add(6, 'days').format('YYYY-MM-DD');

            const [empRes, schedRes] = await Promise.all([
                userAPI.getUsers(),
                workScheduleAPI.getAll({ start_date: start, end_date: end }),
            ]);
            const schedulesData = schedRes.data || [];
            setEmployees(empRes.data.filter((u: any) => {
                if (u.role?.requires_timekeeping === false) return false;
                const hasData = schedulesData.some((s: any) => s.user_id === u.id);
                if (hasData) return true;

                return u.is_active;
            }));
            setSchedules(schedulesData);
        } catch (error) {
            toast.error('Không thể tải dữ liệu lịch làm việc');
        } finally {
            setLoading(false);
        }
    };

    const getWeekDates = () => {
        return Array.from({ length: 7 }, (_, i) => mondayDate.add(i, 'day'));
    };

    const weekDates = getWeekDates();

    const handleCellClick = (employee: any, date: dayjs.Dayjs) => {
        if (!canEdit) return; // Prevent edit modal for readonly staff
        const dateStr = date.format('YYYY-MM-DD');
        const existing = scheduleMap[`${employee.id}_${dateStr}`];

        setSelectedCell({ employee, date, dateStr });

        if (existing) {
            setFormData({
                off_day: !existing.is_active,
                start_time: existing.start_time || '08:00',
                end_time: existing.end_time || '17:00',
            });
        } else {
            setFormData({
                off_day: false,
                start_time: '08:00',
                end_time: '17:00',
            });
        }
        setTargetDates([]);
        setModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCell) return;

        try {
            const dateStr = selectedCell.dateStr;
            const existing = scheduleMap[`${selectedCell.employee.id}_${dateStr}`];

            const payload = {
                user_id: selectedCell.employee.id,
                work_date: dateStr,
                start_time: formData.off_day ? '00:00' : formData.start_time,
                end_time: formData.off_day ? '00:00' : formData.end_time,
                is_active: !formData.off_day,
            };

            if (existing) {
                await workScheduleAPI.update(existing.id, payload);
            } else {
                await workScheduleAPI.create(payload);
            }

            // Copy to other dates if selected
            if (targetDates.length > 0) {
                await workScheduleAPI.copySchedule({
                    user_id: selectedCell.employee.id,
                    from_date: dateStr,
                    to_dates: targetDates
                });
            }

            toast.success(targetDates.length > 0 ? 'Đã lưu và sao chép lịch làm việc' : 'Đã cập nhật lịch làm việc');
            setModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error('Không thể lưu lịch làm việc');
        }
    };

    const handleDelete = async () => {
        if (!selectedCell) return;
        const existing = scheduleMap[`${selectedCell.employee.id}_${selectedCell.dateStr}`];
        if (existing && window.confirm('Bạn có chắc muốn xóa lịch này?')) {
            try {
                await workScheduleAPI.delete(existing.id);
                toast.success('Đã xóa lịch làm việc');
                setModalOpen(false);
                fetchData();
            } catch (error) {
                toast.error('Xóa lịch thất bại');
            }
        }
    };

    const handleCopyLastWeek = async () => {
        if (!window.confirm('Bạn có muốn sao chép toàn bộ lịch từ tuần trước sang tuần này không?')) {
            return;
        }

        setCopying(true);
        try {
            const fromStart = mondayDate.subtract(7, 'days').format('YYYY-MM-DD');
            const toStart = mondayDate.format('YYYY-MM-DD');

            await workScheduleAPI.copyWeekSchedule({
                from_week_start: fromStart,
                to_week_start: toStart
            });

            toast.success('Đã sao chép lịch làm việc từ tuần trước');
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Không thể sao chép lịch làm việc');
        } finally {
            setCopying(false);
        }
    };

    const handleCopyEmployeeLastWeek = async (empArg?: any) => {
        const emp = empArg || selectedCell?.employee;
        if (!emp) return;

        if (!window.confirm(`Bạn có muốn sao chép lịch của nhân viên ${emp.full_name} từ tuần trước sang tuần này không?`)) {
            return;
        }

        setCopying(true);
        try {
            const fromStart = mondayDate.subtract(7, 'days').format('YYYY-MM-DD');
            const toStart = mondayDate.format('YYYY-MM-DD');

            const res = await workScheduleAPI.copyWeekSchedule({
                from_week_start: fromStart,
                to_week_start: toStart,
                user_ids: [emp.id]
            });

            toast.success(`Đã sao chép lịch cho ${emp.full_name}: ${res.data.created} bản ghi được tạo.`);
            setModalOpen(false);
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Không thể sao chép lịch làm việc');
        } finally {
            setCopying(false);
        }
    };

    return (
        <div className="p-2 md:p-6 space-y-3 md:space-y-6 -mt-2 md:mt-0">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Lịch làm việc
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Đăng ký và quản lý ca làm cho nhân viên
                    </p>
                </div>
                <div className="flex flex-col md:flex-row items-center justify-center md:justify-end gap-3 w-full md:w-auto">
                    {/* Desktop Date Navigation */}
                    <div className="hidden md:flex items-center gap-2">
                        <Button color="gray" onClick={() => setSelectedDate(selectedDate.subtract(7, 'days'))}>← Tuần trước</Button>
                        <div className="bg-white dark:bg-gray-800 border rounded-lg px-4 py-2 font-bold">
                            Tuần {mondayDate.format('DD/MM')} - {mondayDate.add(6, 'days').format('DD/MM/YYYY')}
                        </div>
                        <Button color="gray" onClick={() => setSelectedDate(selectedDate.add(7, 'days'))}>Tuần sau →</Button>
                    </div>

                    {/* Actions Row (Desktop) */}
                    <div className="hidden md:flex items-center justify-center gap-2 w-full md:w-auto">
                        <Button color="blue" onClick={() => setSelectedDate(dayjs())}>Tuần này</Button>
                        
                        {canEdit && (
                            <Button color="success" onClick={handleCopyLastWeek} isProcessing={copying} disabled={copying}>
                                Sao chép từ tuần trước
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <Card className="overflow-hidden rounded-lg shadow-sm p-0">
                <div className="overflow-x-auto">
                    <table className="w-[820px] md:w-full table-fixed text-xs md:text-sm text-center border-collapse">
                        <thead>
                            <tr className="bg-white dark:bg-gray-700 h-[44px] md:h-[56px]">
                                <th className="p-2 md:p-4 text-left font-bold sticky left-0 bg-white dark:bg-gray-700 z-10 w-32 md:w-48">Nhân viên</th>
                                {weekDates.map((d, i) => (
                                    <th key={i} className="p-2 md:p-4">
                                        <p className="text-[10px] md:text-xs uppercase text-gray-500 mb-1">{i === 6 ? 'CN' : `Thứ ${i + 2}`}</p>
                                        <span className={`font-bold px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[10px] md:text-sm ${d.isSame(dayjs(), 'day') ? 'bg-[#635BFF] text-white' : 'text-gray-900'}`}>
                                            {d.format('DD/MM')}
                                        </span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="p-10 text-center flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></td>
                                </tr>
                            ) : (
                                employees.map((emp) => (
                                    <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 h-[44px] md:h-[56px]">
                                        <td className="p-2 md:p-4 text-left font-medium sticky left-0 bg-white dark:bg-gray-800 z-10 border-r">
                                            <p className="font-bold leading-tight text-[11px] md:text-sm">{emp.full_name}</p>
                                        </td>
                                        {weekDates.map((date, i) => {
                                            const dateStr = date.format('YYYY-MM-DD');
                                            const schedule = scheduleMap[`${emp.id}_${dateStr}`];
                                            return (
                                                <td
                                                    key={i}
                                                    className={`p-2 md:p-4 transition-colors ${canEdit ? 'cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700' : ''} ${schedule ? 'bg-white' : 'bg-gray-50/50'}`}
                                                    onClick={() => handleCellClick(emp, date)}
                                                >
                                                    {schedule ? (
                                                        !schedule.is_active ? (
                                                            <p className="font-bold text-red-600">OFF</p>
                                                        ) : (
                                                            <p className="font-bold text-gray-900 whitespace-nowrap">{schedule.start_time.substring(0, 5)} - {schedule.end_time.substring(0, 5)}</p>
                                                        )
                                                    ) : (
                                                        <p className="text-gray-300">-</p>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Mobile Date Navigation (Moved to bottom) */}
            <div className="flex md:hidden items-center justify-center gap-2 w-full pt-2">
                <button 
                    className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white active:bg-gray-100 dark:active:bg-gray-800 rounded-lg transition-colors"
                    onClick={() => setSelectedDate(selectedDate.subtract(7, 'days'))}
                >
                    <span className="text-xl">←</span>
                </button>
                <div className="px-3 py-1.5 font-bold text-sm text-center text-gray-900 dark:text-white">
                    Tuần {mondayDate.format('DD/MM')} - {mondayDate.add(6, 'days').format('DD/MM/YYYY')}
                </div>
                <button 
                    className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white active:bg-gray-100 dark:active:bg-gray-800 rounded-lg transition-colors"
                    onClick={() => setSelectedDate(selectedDate.add(7, 'days'))}
                >
                    <span className="text-xl">→</span>
                </button>
            </div>

            {/* Mobile Actions Row (Moved to bottom) */}
            <div className="flex md:hidden items-center justify-center gap-3 w-full pt-1 pb-4">
                <Button color="blue" size="sm" onClick={() => setSelectedDate(dayjs())}>Tuần này</Button>
                {canEdit && (
                    <Button color="success" size="sm" onClick={handleCopyLastWeek} isProcessing={copying} disabled={copying}>
                        Sao chép
                    </Button>
                )}
            </div>

            <Modal show={modalOpen} onClose={() => setModalOpen(false)}>
                <form onSubmit={handleSubmit}>
                    <Modal.Header>
                        {selectedCell && (
                            <div>
                                <p className="text-sm font-normal text-gray-500 uppercase tracking-wider">Lịch làm việc</p>
                                <p className="text-xl font-bold">{selectedCell.employee.full_name} - {formatDate(selectedCell.dateStr)}</p>
                            </div>
                        )}
                    </Modal.Header>
                    <Modal.Body className="space-y-4">
                        <div className="flex items-center gap-2 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                            <Checkbox
                                id="off_day"
                                checked={formData.off_day}
                                onChange={(e) => setFormData({ ...formData, off_day: e.target.checked })}
                            />
                            <Label htmlFor="off_day" className="font-bold text-yellow-800">OFF (Nghỉ ca này)</Label>
                        </div>

                        {!formData.off_day && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label value="Giờ bắt đầu" />
                                    <TextInput
                                        type="time"
                                        value={formData.start_time}
                                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label value="Giờ kết thúc" />
                                    <TextInput
                                        type="time"
                                        value={formData.end_time}
                                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        <div className="border-t pt-4 space-y-3">
                            <div className="flex justify-between items-center">
                                <Label value="Sao chép sang các ngày khác trong tuần" className="font-semibold text-blue-700" />
                                <Button size="xs" color="success" onClick={() => handleCopyEmployeeLastWeek()} pill>
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                                    </svg>
                                    Lấy từ tuần trước
                                </Button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {weekDates.map((d, i) => {
                                    const dStr = d.format('YYYY-MM-DD');
                                    if (dStr === selectedCell?.dateStr) return null;
                                    return (
                                        <div key={i} className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50">
                                            <Checkbox
                                                id={`copy-${dStr}`}
                                                checked={targetDates.includes(dStr)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setTargetDates([...targetDates, dStr]);
                                                    } else {
                                                        setTargetDates(targetDates.filter(t => t !== dStr));
                                                    }
                                                }}
                                            />
                                            <Label htmlFor={`copy-${dStr}`} className="cursor-pointer text-xs">
                                                {i === 6 ? 'CN' : `Thứ ${i + 2}`} ({d.format('DD/MM')})
                                            </Label>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <div className="flex justify-between w-full">
                            <div>
                                {selectedCell && scheduleMap[`${selectedCell.employee.id}_${selectedCell.dateStr}`] && (
                                    <Button color="failure" onClick={handleDelete}>Xóa lịch</Button>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit" color="blue">Lưu thay đổi</Button>
                                <Button color="gray" onClick={() => setModalOpen(false)}>Hủy</Button>
                            </div>
                        </div>
                    </Modal.Footer>
                </form>
            </Modal>
        </div>
    );
};

export default WorkSchedule;
