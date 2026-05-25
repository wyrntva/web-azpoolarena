import { useState, useEffect, useMemo, useCallback } from 'react';
import { Spinner, Card } from 'flowbite-react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { attendanceAPI, workScheduleAPI } from '../../../api/attendance.api';
import { userAPI } from '../../../api/user.api';
import { payrollAPI } from '../../../api/payroll.api';
import { debtAPI } from '../../../api/debt.api';
import { useAuth } from '../../../auth/AuthContext';
import { isAdmin } from '../../../auth/roles';
import { formatCurrency } from '../../../utils/formatters';
import type { Attendance, WorkSchedule, User, PayrollSummary, Debt } from '../../../types/api';

const SalaryTable = ({ selectedDate }: { selectedDate: dayjs.Dayjs }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [attendances, setAttendances] = useState<Attendance[]>([]);
    const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
    const [employees, setEmployees] = useState<User[]>([]);

    const [payrollSummary, setPayrollSummary] = useState<Record<number, PayrollSummary>>({});
    const [debts, setDebts] = useState<Debt[]>([]);

    const isManager = isAdmin(user);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDate]);

    const fetchEmployees = async () => {
        try {
            const response = await userAPI.getUsers();
            setEmployees(response.data);
        } catch (_error) {
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
        } catch { /* ignore */ }
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

            const summary: Record<number, PayrollSummary> = {};
            (summaryRes.data || []).forEach((item: PayrollSummary) => {
                summary[item.user_id] = item;
            });
            setPayrollSummary(summary);
        } catch (_error) {
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

    const calculateHours = useCallback((empId: number, dateStr: string) => {
        const att = attendanceMap[`${empId}_${dateStr}`];
        const sched = scheduleMap[`${empId}_${dateStr}`];

        if (!sched || !att || !att.check_in_time || !att.check_out_time) return 0;

        const start = dayjs(`2000-01-01 ${sched.start_time}`);
        let end = dayjs(`2000-01-01 ${sched.end_time}`);
        if (end.isBefore(start)) end = end.add(1, 'day');

        return end.diff(start, 'hour', true);
    }, [attendanceMap, scheduleMap]);

    const calculateEmployeeDebt = useCallback((name: string) => {
        if (!name) return 0;
        const normalized = name.toLowerCase().trim().replace(/\s+/g, ' ');
        return debts
            .filter(d => d.debtor_name?.toLowerCase().trim().replace(/\s+/g, ' ') === normalized)
            .reduce((sum, d) => sum + (d.amount || 0), 0);
    }, [debts]);

    const displayEmployees = useMemo(() => {
        const isPastMonth = selectedDate.isBefore(dayjs(), 'month');
        
        return employees.filter(emp => {
            if (!isManager && emp.id !== user?.id) return false;
            if (emp.role?.requires_timekeeping === false) return false;
            
            if (emp.created_at && dayjs(emp.created_at).isAfter(selectedDate.endOf('month'))) return false;

            const hasData = attendances.some(a => a.user_id === emp.id) || 
                            schedules.some(s => s.user_id === emp.id) ||
                            (payrollSummary[emp.id] && (
                                payrollSummary[emp.id].total_bonuses > 0 || 
                                payrollSummary[emp.id].total_advances > 0 || 
                                payrollSummary[emp.id].total_penalties > 0
                            ));
            
            if (hasData) return true;
            if (isPastMonth) return false;

            return emp.is_active;
        });
    }, [employees, attendances, schedules, payrollSummary, selectedDate, isManager, user]);

    const employeeStats = useMemo(() => {
        return displayEmployees.map(emp => {
            const totalHours = monthDates.reduce((sum, d) => sum + calculateHours(emp.id, d.format('YYYY-MM-DD')), 0);
            const summary = payrollSummary[emp.id] || { total_bonuses: 0, total_advances: 0, total_penalties: 0 };
            const empDebt = calculateEmployeeDebt(emp.full_name);
            const baseSalary = emp.salary_type === 'fixed'
                ? (emp.fixed_salary || 0)
                : (totalHours * (emp.hourly_rate || 20000));
            const totalReductions = summary.total_advances + summary.total_penalties + empDebt;
            const netSalary = baseSalary + summary.total_bonuses - totalReductions;
            return { emp, totalHours, summary, empDebt, baseSalary, totalReductions, netSalary };
        });
    }, [displayEmployees, monthDates, payrollSummary, calculateHours, calculateEmployeeDebt]);

    const totals = useMemo(() => employeeStats.reduce((acc, s) => ({
        hours: acc.hours + s.totalHours,
        baseSalary: acc.baseSalary + s.baseSalary,
        bonuses: acc.bonuses + s.summary.total_bonuses,
        advances: acc.advances + s.summary.total_advances,
        debt: acc.debt + s.empDebt,
        penalties: acc.penalties + s.summary.total_penalties,
        net: acc.net + s.netSalary,
    }), { hours: 0, baseSalary: 0, bonuses: 0, advances: 0, debt: 0, penalties: 0, net: 0 }),
    [employeeStats]);

    return (
        <div className="space-y-4">
            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto border rounded-xl shadow-sm">
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
                        ) : employeeStats.map(({ emp, totalHours, summary, empDebt, baseSalary, netSalary }, idx) => (
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
                                <td className="p-2 border font-medium text-center">
                                    {emp.salary_type === 'fixed'
                                        ? <span className="text-gray-500 text-[10px]">Cố định</span>
                                        : formatCurrency(emp.hourly_rate || 20000)}
                                </td>
                                <td className="p-2 border font-medium">{formatCurrency(baseSalary)}</td>
                                <td className="p-2 border text-green-600 font-medium">{formatCurrency(summary.total_bonuses)}</td>
                                <td className="p-2 border text-orange-600">-{formatCurrency(summary.total_advances)}</td>
                                <td className="p-2 border text-yellow-600">-{formatCurrency(empDebt)}</td>
                                <td className="p-2 border text-red-600">-{formatCurrency(summary.total_penalties)}</td>
                                <td className="p-2 border font-black text-indigo-700 bg-indigo-50">{formatCurrency(netSalary)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="bg-gray-100 dark:bg-gray-700 font-bold">
                            <td className="p-2 border sticky left-0 bg-gray-100 dark:bg-gray-700 z-10"></td>
                            <td className="p-2 border sticky left-[30px] bg-gray-100 dark:bg-gray-700 z-10 text-left">TỔNG</td>
                            {monthDates.map((_, i) => (
                                <td key={i} className="p-1 border"></td>
                            ))}
                            <td className="p-2 border text-blue-700 bg-blue-50">{totals.hours.toFixed(1)}</td>
                            <td className="p-2 border"></td>
                            <td className="p-2 border bg-blue-50">{formatCurrency(totals.baseSalary)}</td>
                            <td className="p-2 border text-green-600 bg-green-50">{formatCurrency(totals.bonuses)}</td>
                            <td className="p-2 border text-orange-600 bg-orange-50">-{formatCurrency(totals.advances)}</td>
                            <td className="p-2 border text-yellow-600 bg-yellow-50">-{formatCurrency(totals.debt)}</td>
                            <td className="p-2 border text-red-600 bg-red-50">-{formatCurrency(totals.penalties)}</td>
                            <td className="p-2 border text-indigo-700 bg-indigo-100 font-black text-lg">{formatCurrency(totals.net)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden space-y-4 pb-4">
                {loading ? (
                    <div className="flex justify-center p-10"><Spinner /></div>
                ) : employeeStats.map(({ emp, totalHours, summary, empDebt, baseSalary, netSalary }, idx) => (
                        <Card key={emp.id} className="p-0 overflow-hidden shadow-sm border-gray-200">
                            <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b flex justify-between items-center">
                                <div className="font-bold text-[15px] uppercase text-gray-900 dark:text-white truncate pr-2">
                                    {idx + 1}. {emp.full_name}
                                </div>
                                <div className="text-xs font-medium px-2 py-1 bg-indigo-100 text-indigo-800 rounded whitespace-nowrap">
                                    {emp.salary_type === 'fixed' ? 'Cố định' : formatCurrency(emp.hourly_rate || 20000) + '/h'}
                                </div>
                            </div>
                            <div className="p-4 space-y-3 text-sm">
                                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                    <span className="text-gray-500">Tổng giờ làm</span>
                                    <span className="font-bold text-blue-600">{totalHours.toFixed(1)} giờ</span>
                                </div>
                                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                    <span className="text-gray-500">Lương cơ bản</span>
                                    <span className="font-medium text-gray-900">{formatCurrency(baseSalary)}</span>
                                </div>
                                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                    <span className="text-gray-500">Thưởng</span>
                                    <span className="font-medium text-green-600">+{formatCurrency(summary.total_bonuses)}</span>
                                </div>
                                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                    <span className="text-gray-500">Ứng lương</span>
                                    <span className="font-medium text-orange-600">-{formatCurrency(summary.total_advances)}</span>
                                </div>
                                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                    <span className="text-gray-500">Ghi nợ</span>
                                    <span className="font-medium text-yellow-600">-{formatCurrency(empDebt)}</span>
                                </div>
                                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                    <span className="text-gray-500">Phạt</span>
                                    <span className="font-medium text-red-600">-{formatCurrency(summary.total_penalties)}</span>
                                </div>
                                <div className="flex justify-between items-center pt-1">
                                    <span className="text-gray-900 font-bold uppercase text-[13px]">Thực nhận</span>
                                    <span className="text-[18px] font-black text-indigo-700">{formatCurrency(netSalary)}</span>
                                </div>
                            </div>
                        </Card>
                ))}
            </div>

        </div>
    );
};

export default SalaryTable;
