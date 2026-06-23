import { useState, useEffect, useMemo } from 'react';
import { Card, Button, Spinner, Modal, Label, Badge, TextInput, Textarea } from 'flowbite-react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { attendanceAPI, workScheduleAPI } from '../../api/attendance.api';
import { userAPI } from '../../api/user.api';
import { useAuth } from '../../auth/AuthContext';
import { isAdmin } from '../../auth/roles';
import { formatDate } from '../../utils/formatters';
import type { Attendance, WorkSchedule, User } from '../../types/api';

const Timesheet = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [attendances, setAttendances] = useState<Attendance[]>([]);
    const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
    const [employees, setEmployees] = useState<User[]>([]);
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [selectedCell, setSelectedCell] = useState<{ attendance: Attendance | undefined, employee: User, date: string, schedule: WorkSchedule | undefined } | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editForm, setEditForm] = useState({
        check_in_time: '',
        check_out_time: '',
        notes: '',
    });

    const isManager = isAdmin(user);

    const mondayDate = useMemo(() => {
        return selectedDate.subtract((selectedDate.day() + 6) % 7, 'days').startOf('day');
    }, [selectedDate]);

    const attendanceMap = useMemo(() => {
        const map: Record<string, Attendance> = {};
        attendances.forEach((a) => {
            map[`${a.user_id}_${a.date}`] = a;
        });
        return map;
    }, [attendances]);

    const scheduleMap = useMemo(() => {
        const map: Record<string, WorkSchedule> = {};
        schedules.forEach((s) => {
            map[`${s.user_id}_${s.work_date}`] = s;
        });
        return map;
    }, [schedules]);

    const fetchEmployees = async () => {
        try {
            const response = await userAPI.getUsers();
            setEmployees(response.data);
        } catch (_error) {
            toast.error('Không thể tải danh sách nhân viên');
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const start = mondayDate.format('YYYY-MM-DD');
            const end = mondayDate.add(6, 'days').format('YYYY-MM-DD');

            const [attRes, schedRes] = await Promise.all([
                attendanceAPI.getTimesheet({ start_date: start, end_date: end, page_size: 1000 }),
                workScheduleAPI.getAll({ start_date: start, end_date: end }),
            ]);
            setAttendances(attRes.data.items || []);
            setSchedules(schedRes.data || []);
        } catch (_error) {
            toast.error('Không thể tải dữ liệu chấm công');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let active = true;
        Promise.resolve().then(() => {
            if (active) fetchEmployees();
        });
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        let active = true;
        Promise.resolve().then(() => {
            if (active) fetchData();
        });
        return () => {
            active = false;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDate]);

    const weekDates = useMemo(
        () => Array.from({ length: 7 }, (_, i) => mondayDate.add(i, 'day')),
        [mondayDate]
    );

    const displayEmployees = useMemo(() => {
        return employees.filter((u) => {
            if (u.role?.requires_timekeeping === false) return false;

            const hasData = attendances.some(a => a.user_id === u.id) || schedules.some(s => s.user_id === u.id);
            if (hasData) return true;

            return u.is_active;
        });
    }, [employees, attendances, schedules]);


    const handleCellClick = (employee: User, date: dayjs.Dayjs) => {
        if (!isManager) return; // Only managers can edit attendances
        const dateStr = date.format('YYYY-MM-DD');
        const attendance = attendanceMap[`${employee.id}_${dateStr}`];
        const schedule = scheduleMap[`${employee.id}_${dateStr}`];

        setSelectedCell({ attendance, employee, date: dateStr, schedule });
        setEditForm({
            check_in_time: attendance?.check_in_time ? dayjs(attendance.check_in_time).format('HH:mm') : '',
            check_out_time: attendance?.check_out_time ? dayjs(attendance.check_out_time).format('HH:mm') : '',
            notes: attendance?.notes || '',
        });
        setModalOpen(true);
    };

    const buildDateTime = (dateStr: string, timeStr: string) => {
        if (!timeStr) return null;
        return `${dateStr}T${timeStr}:00`;
    };

    const handleSaveAttendance = async () => {
        if (!selectedCell) return;
        if (!editForm.check_in_time && !editForm.check_out_time) {
            toast.error('Vui lòng nhập giờ vào hoặc giờ ra');
            return;
        }
        if (!selectedCell.attendance && !editForm.check_in_time) {
            toast.error('Vui lòng nhập giờ vào khi tạo mới chấm công');
            return;
        }

        setSaving(true);
        try {
            if (selectedCell.attendance) {
                await attendanceAPI.updateAttendance(selectedCell.attendance.id, {
                    check_in_time: buildDateTime(selectedCell.date, editForm.check_in_time) ?? undefined,
                    check_out_time: buildDateTime(selectedCell.date, editForm.check_out_time) ?? undefined,
                    notes: editForm.notes?.trim() || undefined,
                });
                toast.success('Cập nhật chấm công thành công');
            } else {
                await attendanceAPI.createManualAttendance({
                    user_id: selectedCell.employee.id,
                    date: selectedCell.date,
                    check_in_time: buildDateTime(selectedCell.date, editForm.check_in_time)!,
                    check_out_time: buildDateTime(selectedCell.date, editForm.check_out_time) ?? undefined,
                    notes: editForm.notes?.trim() || undefined,
                });
                toast.success('Tạo chấm công thành công');
            }
            setModalOpen(false);
            fetchData();
        } catch (error) {
            const detail = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
            toast.error(detail || 'Cập nhật chấm công thất bại');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="pt-0 px-6 pb-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-[16px] font-semibold uppercase text-[#37393E] dark:text-white flex items-center gap-2">
                        BẢNG CHẤM CÔNG
                    </h1>
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
                    </div>
                </div>
            </div>

            <Card className="overflow-hidden rounded-lg shadow-sm p-0">
                <div className="overflow-x-auto">
                    <table className="w-[820px] md:w-full table-fixed text-xs md:text-sm text-center border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-700 h-[44px] md:h-[56px]">
                                <th className="p-2 md:p-4 text-left font-bold text-gray-900 dark:text-white sticky left-0 bg-gray-50 dark:bg-gray-700 z-10 w-32 md:w-48">Nhân viên</th>
                                {weekDates.map((d, i) => (
                                    <th key={i} className="p-2 md:p-4">
                                        <p className="text-[10px] md:text-xs uppercase text-gray-500 mb-1">{i === 6 ? 'CN' : `Thứ ${i + 2}`}</p>
                                        <span className={`font-bold px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[10px] md:text-sm ${d.isSame(dayjs(), 'day') ? 'bg-primary text-white' : 'text-gray-900'}`}>
                                            {d.format('DD/MM')}
                                        </span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="p-10 text-center"><Spinner /></td>
                                </tr>
                            ) : displayEmployees.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-10 text-center text-gray-500">Chưa có dữ liệu nhân viên</td>
                                </tr>
                            ) : (
                                displayEmployees.map((emp) => (
                                    <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 h-[44px] md:h-[56px]">
                                        <td className="p-2 md:p-4 text-left font-medium sticky left-0 bg-white dark:bg-gray-800 z-10 border-r">
                                            <p className="font-bold leading-tight text-[11px] md:text-sm">{emp.full_name}</p>
                                        </td>
                                        {weekDates.map((date, i) => {
                                            const dateStr = date.format('YYYY-MM-DD');
                                            const attendance = attendanceMap[`${emp.id}_${dateStr}`];
                                            const schedule = scheduleMap[`${emp.id}_${dateStr}`];
                                            return (
                                                <td
                                                    key={i}
                                                    className={`p-2 md:p-4 transition-colors cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700 ${attendance ? 'bg-white' : schedule ? 'bg-white' : 'bg-gray-50/50'}`}
                                                    onClick={() => handleCellClick(emp, date)}
                                                >
                                                    {attendance ? (
                                                        (() => {
                                                            const checkIn = dayjs(attendance.check_in_time).startOf('minute');
                                                            const checkOut = attendance.check_out_time ? dayjs(attendance.check_out_time) : null;
                                                            let checkInClass = "text-gray-900 dark:text-gray-100";
                                                            let checkOutClass = "text-gray-900 dark:text-gray-100";

                                                            if (schedule) {
                                                                const scheduleStart = dayjs(`${dateStr} ${schedule.start_time}`);
                                                                let scheduleEnd = dayjs(`${dateStr} ${schedule.end_time}`);
                                                                if (scheduleEnd.isBefore(scheduleStart)) {
                                                                    scheduleEnd = scheduleEnd.add(1, 'day');
                                                                }

                                                                const allowedLate = schedule.allowed_late_minutes || 0;

                                                                if (checkIn.isAfter(scheduleStart.add(allowedLate, 'minute'))) {
                                                                    checkInClass = "text-red-600 font-bold";
                                                                }

                                                                if (checkOut && checkOut.isBefore(scheduleEnd)) {
                                                                    checkOutClass = "text-red-600 font-bold";
                                                                }
                                                            }

                                                            return (
                                                                <p className="font-bold whitespace-nowrap">
                                                                    <span className={checkInClass}>{checkIn.format('HH:mm')}</span>
                                                                    <span className="text-gray-400 mx-1">-</span>
                                                                    <span className={checkOutClass}>{checkOut ? checkOut.format('HH:mm') : '--:--'}</span>
                                                                </p>
                                                            );
                                                        })()
                                                    ) : schedule ? (
                                                        !schedule.is_active ? (
                                                            <p className="font-bold text-[#030033]">OFF</p>
                                                        ) : (
                                                            <p className="text-gray-300">-</p>
                                                        )
                                                    ) : (
                                                        <p className="text-gray-200">✗</p>
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
            </div>

            <Modal show={modalOpen} onClose={() => setModalOpen(false)}>
                <Modal.Header>Chi tiết chấm công</Modal.Header>
                <Modal.Body className="space-y-4">
                    {selectedCell && (
                        <div className="space-y-4">
                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                <p className="text-sm text-gray-500">Nhân viên:</p>
                                <p className="font-bold text-lg">{selectedCell.employee.full_name}</p>
                                <p className="text-sm text-gray-500 mt-2">Ngày:</p>
                                <p className="font-bold">{formatDate(selectedCell.date)}</p>
                            </div>

                            {selectedCell.attendance ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="border p-4 rounded-lg text-center">
                                        <p className="text-xs uppercase text-gray-500 mb-1">Giờ vào</p>
                                        <p className="text-xl font-bold text-blue-600">
                                            {dayjs(selectedCell.attendance.check_in_time).format('HH:mm:ss')}
                                        </p>
                                    </div>
                                    <div className="border p-4 rounded-lg text-center">
                                        <p className="text-xs uppercase text-gray-500 mb-1">Giờ ra</p>
                                        <p className="text-xl font-bold text-red-600">
                                            {selectedCell.attendance.check_out_time ? dayjs(selectedCell.attendance.check_out_time).format('HH:mm:ss') : '--:--:--'}
                                        </p>
                                    </div>
                                    <div className="col-span-2">
                                        <Label value="Trạng thái" />
                                        <div className="mt-1">
                                            <Badge color={selectedCell.attendance.status === 'present' ? 'success' : 'warning'} className="w-fit">
                                                {selectedCell.attendance.status === 'present' ? 'Đúng giờ' : selectedCell.attendance.status === 'late' ? 'Đi trễ' : 'Về sớm'}
                                            </Badge>
                                        </div>
                                    </div>
                                    {selectedCell.attendance.notes && (
                                        <div className="col-span-2">
                                            <Label value="Ghi chú" />
                                            <p className="text-sm border p-2 rounded mt-1 bg-gray-50">{selectedCell.attendance.notes}</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-10 border-2 border-dashed rounded-lg">
                                    <p className="text-gray-500">Chưa có dữ liệu chấm công cho ngày này.</p>
                                    {selectedCell.schedule && <p className="text-blue-600 text-sm mt-1 font-medium">Lịch làm việc: Đã đăng ký</p>}
                                </div>
                            )}

                            {isManager && (
                                <div className="border-t pt-4 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="manual_check_in" value="Giờ vào" />
                                            <TextInput
                                                id="manual_check_in"
                                                type="time"
                                                value={editForm.check_in_time}
                                                onChange={(e) => setEditForm({ ...editForm, check_in_time: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="manual_check_out" value="Giờ ra" />
                                            <TextInput
                                                id="manual_check_out"
                                                type="time"
                                                value={editForm.check_out_time}
                                                onChange={(e) => setEditForm({ ...editForm, check_out_time: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="manual_notes" value="Ghi chú" />
                                        <Textarea
                                            id="manual_notes"
                                            rows={3}
                                            value={editForm.notes}
                                            onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                            placeholder="Lý do chỉnh sửa (tùy chọn)"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    {isManager && (
                        <Button color="blue" onClick={handleSaveAttendance} isProcessing={saving} disabled={saving}>
                            {selectedCell?.attendance ? 'Cập nhật' : 'Tạo chấm công'}
                        </Button>
                    )}
                    <Button color="gray" onClick={() => setModalOpen(false)}>Đóng</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default Timesheet;
