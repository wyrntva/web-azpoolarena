import { useState, useEffect, useMemo } from 'react';
import { Button, Spinner } from 'flowbite-react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { attendanceAPI, workScheduleAPI } from '../../../api/attendance.api';
import { userAPI } from '../../../api/user.api';
import { payrollAPI } from '../../../api/payroll.api';
import { debtAPI } from '../../../api/debt.api';
// import { useAuth } from '../../../auth/AuthContext';
import { formatCurrency } from '../../../utils/formatters';
import type { Attendance, WorkSchedule, User, PayrollSummary, Debt } from '../../../types/api';

const SalaryTable = () => {
    // const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [attendances, setAttendances] = useState<Attendance[]>([]);
    const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
    const [employees, setEmployees] = useState<User[]>([]);
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [payrollSummary, setPayrollSummary] = useState<Record<number, PayrollSummary>>({});
    const [debts, setDebts] = useState<Debt[]>([]);

    // const isAdmin = user?.role?.name === 'admin' || user?.role?.name === 'Quản lý';

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

    useEffect(() => {
        fetchEmployees();
        fetchData();
        fetchDebts();
    }, [selectedDate]);

    const fetchEmployees = async () => {
        try {
            const response = await userAPI.getUsers();
            // userAPI.getUsers returns User[] directly based on user.api.ts
            setEmployees(response.data.filter((u: User) => u.is_active && u.role?.requires_timekeeping !== false));
        } catch (error) {
            toast.error('Không thể tải danh sách nhân viên');
        }
    };

    const fetchDebts = async () => {
        try {
            const start = selectedDate.startOf('month').format('YYYY-MM-DD');
            const end = selectedDate.endOf('month').format('YYYY-MM-DD');
            const response = await debtAPI.getDebts({
                is_paid: false,
                start_date: start,
                end_date: end
            });
            setDebts(response.data.data || []);
        } catch (error) { }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const start = selectedDate.startOf('month').format('YYYY-MM-DD');
            const end = selectedDate.endOf('month').format('YYYY-MM-DD');
            const monthStr = selectedDate.format('YYYY-MM');

            const [attRes, schedRes, summaryRes] = await Promise.all([
                attendanceAPI.getTimesheet({ start_date: start, end_date: end, page_size: 10000 }),
                workScheduleAPI.getAll({ start_date: start, end_date: end }),
                payrollAPI.getPayrollSummary({ month: monthStr }),
            ]);

            setAttendances(attRes.data.items || []);
            setSchedules(schedRes.data || []);

            const summary: any = {};
            (summaryRes.data || []).forEach((item: any) => {
                summary[item.user_id] = item;
            });
            setPayrollSummary(summary);
        } catch (error) {
            toast.error('Lỗi tải dữ liệu bảng lương');
        } finally {
            setLoading(false);
        }
    };

    const monthDates = useMemo(() => {
        const start = selectedDate.startOf('month');
        const days = selectedDate.daysInMonth();
        return Array.from({ length: days }, (_, i) => start.add(i, 'day'));
    }, [selectedDate]);

    const calculateHours = (empId: number, dateStr: string) => {
        const att = attendanceMap[`${empId}_${dateStr}`];
        const sched = scheduleMap[`${empId}_${dateStr}`];

        if (!sched || !att || !att.check_in_time || !att.check_out_time) return 0;

        // Simplification: use scheduled hours if attended (matching legacy logic)
        const start = dayjs(`2000-01-01 ${sched.start_time}`);
        let end = dayjs(`2000-01-01 ${sched.end_time}`);
        if (end.isBefore(start)) end = end.add(1, 'day');

        return end.diff(start, 'hour', true);
    };

    const calculateEmployeeDebt = (name: string) => {
        if (!name) return 0;
        return debts
            .filter(d => d.debtor_name?.toLowerCase().trim() === name.toLowerCase().trim())
            .reduce((sum, d) => sum + (d.amount || 0), 0);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
                <div className="flex gap-2">
                    <Button size="sm" color="gray" onClick={() => setSelectedDate(selectedDate.subtract(1, 'month'))}>← Tháng trước</Button>
                    <div className="bg-white border px-4 py-1.5 rounded font-bold">{selectedDate.format('MM / YYYY')}</div>
                    <Button size="sm" color="gray" onClick={() => setSelectedDate(selectedDate.add(1, 'month'))}>Tháng sau →</Button>
                </div>
                <p className="text-xs text-gray-500 italic">Cập nhật: {dayjs().format('HH:mm DD/MM')}</p>
            </div>

            <div className="overflow-x-auto border rounded-xl shadow-sm">
                <table className="w-full text-[11px] text-center border-collapse">
                    <thead>
                        <tr className="bg-gray-100 dark:bg-gray-700">
                            <th className="p-2 border sticky left-0 bg-gray-100 min-w-[30px] z-20">#</th>
                            <th className="p-2 border sticky left-[30px] bg-gray-100 min-w-[120px] text-left z-20">Nhân viên</th>
                            {monthDates.map((d, i) => (
                                <th key={i} className={`p-1 border min-w-[25px] ${d.day() === 0 ? 'bg-red-50 text-red-600' : ''}`}>
                                    {i + 1}<br /><span className="text-[9px] uppercase">{d.format('dd')}</span>
                                </th>
                            ))}
                            <th className="p-2 border bg-blue-50 text-blue-800 min-w-[60px] font-bold">Giờ</th>
                            <th className="p-2 border bg-blue-50 text-blue-800 min-w-[80px] font-bold">Hệ số</th>
                            <th className="p-2 border bg-blue-50 text-blue-800 min-w-[80px] font-bold">Lương cơ bản</th>
                            <th className="p-2 border bg-green-50 text-green-800 min-w-[80px] font-bold">Thưởng</th>
                            <th className="p-2 border bg-orange-50 text-orange-800 min-w-[80px] font-bold">Ứng</th>
                            <th className="p-2 border bg-yellow-50 text-yellow-800 min-w-[80px] font-bold">Nợ</th>
                            <th className="p-2 border bg-red-50 text-red-800 min-w-[80px] font-bold">Phạt</th>
                            <th className="p-2 border bg-indigo-600 text-white min-w-[100px] font-bold">Thực nhận</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? (
                            <tr><td colSpan={monthDates.length + 9} className="p-10 text-center"><Spinner /></td></tr>
                        ) : employees.map((emp, idx) => {
                            const totalHours = monthDates.reduce((sum, d) => sum + calculateHours(emp.id, d.format('YYYY-MM-DD')), 0);
                            const summary = payrollSummary[emp.id] || { total_bonuses: 0, total_advances: 0, total_penalties: 0 };
                            const empDebt = calculateEmployeeDebt(emp.full_name);

                            const baseSalary = emp.salary_type === 'fixed'
                                ? (emp.fixed_salary || 0)
                                : (totalHours * (emp.hourly_rate || 20000));

                            const totalReductions = summary.total_advances + summary.total_penalties + empDebt;
                            const netSalary = baseSalary + summary.total_bonuses - totalReductions;

                            return (
                                <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                    <td className="p-2 border sticky left-0 bg-white dark:bg-gray-800 z-10">{idx + 1}</td>
                                    <td className="p-1 border sticky left-[30px] bg-white dark:bg-gray-800 z-10 text-left">
                                        <p className="font-bold truncate w-28 uppercase">{emp.full_name}</p>
                                    </td>
                                    {monthDates.map((d, i) => {
                                        const h = calculateHours(emp.id, d.format('YYYY-MM-DD'));
                                        return (
                                            <td key={i} className={`p-1 border ${h > 0 ? 'bg-green-50 text-green-700 font-bold' : 'text-gray-300'}`}>
                                                {h > 0 ? (h % 1 === 0 ? h : h.toFixed(1)) : '·'}
                                            </td>
                                        );
                                    })}
                                    <td className="p-2 border font-bold text-blue-700 bg-blue-50/30">{totalHours.toFixed(1)}</td>
                                    <td className="p-2 border font-medium text-center">{emp.hourly_rate ? formatCurrency(emp.hourly_rate) : '-'}</td>
                                    <td className="p-2 border font-medium">{formatCurrency(baseSalary)}</td>
                                    <td className="p-2 border text-green-600 font-medium">{formatCurrency(summary.total_bonuses)}</td>
                                    <td className="p-2 border text-orange-600">-{formatCurrency(summary.total_advances)}</td>
                                    <td className="p-2 border text-yellow-600">-{formatCurrency(empDebt)}</td>
                                    <td className="p-2 border text-red-600">-{formatCurrency(summary.total_penalties)}</td>
                                    <td className="p-2 border font-black text-indigo-700 bg-indigo-50">{formatCurrency(netSalary)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr className="bg-gray-100 dark:bg-gray-700 font-bold">
                            <td className="p-2 border sticky left-0 bg-gray-100 dark:bg-gray-700 z-10"></td>
                            <td className="p-2 border sticky left-[30px] bg-gray-100 dark:bg-gray-700 z-10 text-left">TỔNG</td>
                            {monthDates.map((_, i) => (
                                <td key={i} className="p-1 border"></td>
                            ))}
                            <td className="p-2 border text-blue-700 bg-blue-50">
                                {employees.reduce((sum, emp) => {
                                    const totalHours = monthDates.reduce((s, d) => s + calculateHours(emp.id, d.format('YYYY-MM-DD')), 0);
                                    return sum + totalHours;
                                }, 0).toFixed(1)}
                            </td>
                            <td className="p-2 border"></td>
                            <td className="p-2 border bg-blue-50">
                                {formatCurrency(employees.reduce((sum, emp) => {
                                    const totalHours = monthDates.reduce((s, d) => s + calculateHours(emp.id, d.format('YYYY-MM-DD')), 0);
                                    const baseSalary = emp.salary_type === 'fixed' ? (emp.fixed_salary || 0) : (totalHours * (emp.hourly_rate || 20000));
                                    return sum + baseSalary;
                                }, 0))}
                            </td>
                            <td className="p-2 border text-green-600 bg-green-50">
                                {formatCurrency(employees.reduce((sum, emp) => {
                                    const summary = payrollSummary[emp.id] || { total_bonuses: 0 };
                                    return sum + summary.total_bonuses;
                                }, 0))}
                            </td>
                            <td className="p-2 border text-orange-600 bg-orange-50">
                                -{formatCurrency(employees.reduce((sum, emp) => {
                                    const summary = payrollSummary[emp.id] || { total_advances: 0 };
                                    return sum + summary.total_advances;
                                }, 0))}
                            </td>
                            <td className="p-2 border text-yellow-600 bg-yellow-50">
                                -{formatCurrency(employees.reduce((sum, emp) => {
                                    const empDebt = calculateEmployeeDebt(emp.full_name);
                                    return sum + empDebt;
                                }, 0))}
                            </td>
                            <td className="p-2 border text-red-600 bg-red-50">
                                -{formatCurrency(employees.reduce((sum, emp) => {
                                    const summary = payrollSummary[emp.id] || { total_penalties: 0 };
                                    return sum + summary.total_penalties;
                                }, 0))}
                            </td>
                            <td className="p-2 border text-indigo-700 bg-indigo-100 font-black text-lg">
                                {formatCurrency(employees.reduce((sum, emp) => {
                                    const totalHours = monthDates.reduce((s, d) => s + calculateHours(emp.id, d.format('YYYY-MM-DD')), 0);
                                    const summary = payrollSummary[emp.id] || { total_bonuses: 0, total_advances: 0, total_penalties: 0 };
                                    const empDebt = calculateEmployeeDebt(emp.full_name);
                                    const baseSalary = emp.salary_type === 'fixed' ? (emp.fixed_salary || 0) : (totalHours * (emp.hourly_rate || 20000));
                                    const totalReductions = summary.total_advances + summary.total_penalties + empDebt;
                                    const netSalary = baseSalary + summary.total_bonuses - totalReductions;
                                    return sum + netSalary;
                                }, 0))}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>


        </div>
    );
};

export default SalaryTable;
