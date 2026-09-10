import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, Table, TextInput, Button, Label } from 'flowbite-react';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import BaseDialog from '../../components/shared/BaseDialog';
import { receiptAPI } from '../../api/receipt.api';
import { revenueAPI } from '../../api/revenue.api';
import { safeAPI } from '../../api/safe.api';
import { debtAPI } from '../../api/debt.api';
import { exchangeAPI } from '../../api/exchange.api';
import { tempReportAPI } from '../../api/tempReport.api';
import { attendanceAPI, workScheduleAPI } from '../../api/attendance.api';
import { userAPI } from '../../api/user.api';
import { payrollAPI } from '../../api/payroll.api';
import type { Attendance, WorkSchedule, User, PayrollSummary, Receipt, Revenue, Safe, Debt, Exchange } from '../../types/api';
import { formatCurrency } from '../../utils/formatters';

interface DailyReportRow {
    stt: number;
    date: string; // YYYY-MM-DD
    displayDate: string; // DD/MM/YYYY
    // Tiền mặt
    cashBalance: number; // Dư két
    cashIncome: number; // Tổng thu TM
    cashExpense: number; // Tổng chi TM
    // Tiền tài khoản
    bankExchange: number; // Đổi tiền mặt
    bankIncome: number; // Thu TK
    bankExpense: number; // Chi TK
    bankRealRevenue: number; // Tổng TK = bankIncome - bankExpense + bankExchange
    // Công nợ đã thanh toán
    debtPaidCash: number; // Công nợ đã thanh toán TM
    debtPaidBank: number; // Công nợ đã thanh toán TK
    // Khách nợ
    debtNew: number; // Khách nợ
    // Tổng hợp
    totalRealIncome: number; // Tổng thực thu
    systemRevenue: number; // Tổng doanh thu trên hệ thống
    difference: number; // Chênh lệch
    note: string; // Ghi chú
}

export const TempReport = () => {
    const [selectedMonth, setSelectedMonth] = useState<string>(dayjs().format('YYYY-MM'));
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Top Summary Box
    const [prevMonthCashBalance, setPrevMonthCashBalance] = useState<number>(0);
    const [currentCashInSafe, setCurrentCashInSafe] = useState<number>(0);
    const [unpaidDebt, setUnpaidDebt] = useState<number>(0);

    // Raw API data
    const [receipts, setReceipts] = useState<Receipt[]>([]);
    const [revenues, setRevenues] = useState<Revenue[]>([]);
    const [safes, setSafes] = useState<Safe[]>([]);
    const [debts, setDebts] = useState<Debt[]>([]);
    const [exchanges, setExchanges] = useState<Exchange[]>([]);
    const [autoPayrollSalary, setAutoPayrollSalary] = useState<number>(0);

    // Custom notes/overrides & Add Modal
    const [dailyNotes, setDailyNotes] = useState<Record<string, string>>({});
    const [manualReports, setManualReports] = useState<
        Record<
            string,
            {
                cashIncome: number;
                cashExpense: number;
                bankExchange: number;
                bankIncome: number;
                bankExpense: number;
                systemRevenue: number;
                note: string;
            }
        >
    >({});
    const [monthlyExpensesByMonth, setMonthlyExpensesByMonth] = useState<
        Record<string, { salary: number; fixedCost: number; premises: number; yard: number; cloth: number }>
    >({});
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditMonthlyModal, setShowEditMonthlyModal] = useState(false);
    const [editMonthlyFormData, setEditMonthlyFormData] = useState({
        prevMonthCashBalance: '',
        salary: '',
        fixedCost: '',
        premises: '',
        yard: '',
        cloth: '',
    });

    const getDefaultFormData = () => ({
        date: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
        cashIncome: '',
        cashExpense: '',
        bankExchange: '',
        bankIncome: '',
        bankExpense: '',
        systemRevenue: '',
        note: '',
    });

    const [addFormData, setAddFormData] = useState(getDefaultFormData());

    const calculatePayrollTotal = (
        selectedMonthDate: dayjs.Dayjs,
        users: User[],
        attendancesList: Attendance[],
        schedulesList: WorkSchedule[],
        summary: Record<number, PayrollSummary>,
        debtsList: Debt[]
    ) => {
        const start = selectedMonthDate.startOf('month');
        const days = selectedMonthDate.daysInMonth();
        const monthDates = Array.from({ length: days }, (_, i) => start.add(i, 'day'));
        const isPastMonth = selectedMonthDate.isBefore(dayjs(), 'month');

        const attendanceMap: Record<string, Attendance> = {};
        attendancesList.forEach((a) => {
            if (!a || !a.date) return;
            const dStr = dayjs(a.date).format('YYYY-MM-DD');
            attendanceMap[`${a.user_id}_${dStr}`] = a;
        });

        const scheduleMap: Record<string, WorkSchedule> = {};
        schedulesList.forEach((s) => {
            if (!s || !s.work_date) return;
            const dStr = dayjs(s.work_date).format('YYYY-MM-DD');
            scheduleMap[`${s.user_id}_${dStr}`] = s;
        });

        const calculateHours = (empId: number, dateStr: string) => {
            const att = attendanceMap[`${empId}_${dateStr}`];
            const sched = scheduleMap[`${empId}_${dateStr}`];
            if (!sched || !att || !att.check_in_time || !att.check_out_time) return 0;
            const sTime = dayjs(`2000-01-01 ${sched.start_time}`);
            let eTime = dayjs(`2000-01-01 ${sched.end_time}`);
            if (eTime.isBefore(sTime)) eTime = eTime.add(1, 'day');
            return eTime.diff(sTime, 'hour', true);
        };

        const calculateEmployeeDebt = (name: string) => {
            if (!name || !Array.isArray(debtsList)) return 0;
            const normalized = name.toLowerCase().trim().replace(/\s+/g, ' ');
            return debtsList
                .filter((d) => d && d.debtor_name?.toLowerCase().trim().replace(/\s+/g, ' ') === normalized)
                .reduce((sum, d) => sum + (d.amount || 0), 0);
        };

        const displayEmployees = Array.isArray(users)
            ? users.filter((emp) => {
                if (!emp || emp.role?.requires_timekeeping === false) return false;
                const hasData =
                    attendancesList.some((a) => a && a.user_id === emp.id) ||
                    schedulesList.some((s) => s && s.user_id === emp.id) ||
                    (summary[emp.id] &&
                        (summary[emp.id].total_bonuses > 0 ||
                            summary[emp.id].total_advances > 0 ||
                            summary[emp.id].total_penalties > 0));
                if (hasData) return true;
                const startDate = (emp as any).first_schedule_date || emp.created_at;
                if (startDate && dayjs(startDate).isAfter(selectedMonthDate.endOf('month'))) return false;
                if (isPastMonth) return false;
                return emp.is_active;
            })
            : [];

        let totalNet = 0;
        displayEmployees.forEach((emp) => {
            const totalHours = monthDates.reduce((sum, d) => sum + calculateHours(emp.id, d.format('YYYY-MM-DD')), 0);
            const sumEmp = summary[emp.id] || {
                total_bonuses: 0,
                total_advances: 0,
                total_penalties: 0,
                total_hours: 0,
                net_adjustment: 0,
                user_id: emp.id,
                user_name: emp.full_name,
                month: selectedMonthDate.format('YYYY-MM'),
            };
            const empDebt = calculateEmployeeDebt(emp.full_name);
            const baseSalary =
                emp.salary_type === 'fixed' ? emp.fixed_salary || 0 : totalHours * (emp.hourly_rate || 20000);
            const totalReductions = sumEmp.total_advances + sumEmp.total_penalties + empDebt;
            const netSalary = baseSalary + sumEmp.total_bonuses - totalReductions;
            totalNet += netSalary;
        });

        return totalNet;
    };

    // Fetch finance data
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const startDate = dayjs(selectedMonth).startOf('month').format('YYYY-MM-DD');
            const endDate = dayjs(selectedMonth).endOf('month').format('YYYY-MM-DD');
            const m = dayjs(selectedMonth).month() + 1;
            const y = dayjs(selectedMonth).year();

            const prevMonthDate = dayjs(selectedMonth).subtract(1, 'month');
            const prevM = prevMonthDate.month() + 1;
            const prevY = prevMonthDate.year();

            const [
                receiptsRes,
                revenuesRes,
                safesRes,
                debtsRes,
                exchangesRes,
                safeBalRes,
                unpaidDebtRes,
                prevSafeBalRes,
                dailyManualRes,
                monthlySummaryRes,
                attRes,
                schedRes,
                pSummaryRes,
                usersRes,
                payrollDebtsRes,
            ] = await Promise.allSettled([
                receiptAPI.getAll({ start_date: startDate, end_date: endDate, page_size: 1000 }),
                revenueAPI.getRevenues({ start_date: startDate, end_date: endDate, limit: 1000 }),
                safeAPI.getAll({ month: m, year: y, limit: 1000 }),
                debtAPI.getDebts({ start_date: startDate, end_date: endDate }),
                exchangeAPI.getAll({ start_date: startDate, end_date: endDate, limit: 1000 }),
                safeAPI.getBalance({ month: m, year: y }),
                debtAPI.getDebts({ is_paid: false }),
                safeAPI.getBalance({ month: prevM, year: prevY }),
                tempReportAPI.getDailyManualReports({ start_date: startDate, end_date: endDate }),
                tempReportAPI.getMonthlySummary(selectedMonth),
                attendanceAPI.getTimesheet({ start_date: startDate, end_date: endDate, page_size: 10000 }),
                workScheduleAPI.getAll({ start_date: startDate, end_date: endDate }),
                payrollAPI.getPayrollSummary({ month: selectedMonth }),
                userAPI.getUsers(),
                debtAPI.getDebts({ is_paid: false, start_date: startDate, end_date: endDate }),
            ]);

            if (receiptsRes.status === 'fulfilled' && receiptsRes.value.data) {
                const data = receiptsRes.value.data as any;
                setReceipts(data.data || data.items || data || []);
            }
            if (revenuesRes.status === 'fulfilled' && revenuesRes.value.data) {
                const data = revenuesRes.value.data as any;
                setRevenues(data.data || data.items || data || []);
            }
            if (safesRes.status === 'fulfilled' && safesRes.value.data) {
                const data = safesRes.value.data as any;
                setSafes(data.data || data.items || data || []);
            }
            if (debtsRes.status === 'fulfilled' && debtsRes.value.data) {
                const data = debtsRes.value.data as any;
                setDebts(data.data || data.items || data || []);
            }
            if (exchangesRes.status === 'fulfilled' && exchangesRes.value.data) {
                const data = exchangesRes.value.data as any;
                setExchanges(data.data || data.items || data || []);
            }

            if (safeBalRes.status === 'fulfilled' && safeBalRes.value.data) {
                const bal = safeBalRes.value.data.balance || 0;
                if (bal > 0) setCurrentCashInSafe(bal);
            }
            if (prevSafeBalRes.status === 'fulfilled' && prevSafeBalRes.value.data) {
                const prevBal = prevSafeBalRes.value.data.balance || 0;
                if (prevBal > 0) setPrevMonthCashBalance(prevBal);
            }
            if (unpaidDebtRes.status === 'fulfilled' && unpaidDebtRes.value.data) {
                const dData = unpaidDebtRes.value.data as any;
                const list = dData.data || dData.items || dData || [];
                if (Array.isArray(list)) {
                    const totalUnpaid = list.reduce((sum: number, d: Debt) => sum + (d.amount || 0), 0);
                    if (totalUnpaid > 0) setUnpaidDebt(totalUnpaid);
                }
            }

            // Calculate auto payroll from /payroll data
            const atts: Attendance[] =
                attRes.status === 'fulfilled'
                    ? (attRes.value.data as any)?.items || (attRes.value.data as any) || []
                    : [];
            const scheds: WorkSchedule[] =
                schedRes.status === 'fulfilled'
                    ? (schedRes.value.data as any)?.data || (schedRes.value.data as any) || []
                    : [];
            const pSummaryRaw =
                pSummaryRes.status === 'fulfilled'
                    ? (pSummaryRes.value.data as any)?.data || (pSummaryRes.value.data as any) || []
                    : [];
            const pSummaryList: PayrollSummary[] = Array.isArray(pSummaryRaw) ? pSummaryRaw : [];
            const usersRaw =
                usersRes.status === 'fulfilled'
                    ? (usersRes.value.data as any)?.data || (usersRes.value.data as any) || []
                    : [];
            const usersList: User[] = Array.isArray(usersRaw) ? usersRaw : [];
            const debtsRaw =
                payrollDebtsRes.status === 'fulfilled'
                    ? (payrollDebtsRes.value.data as any)?.data || (payrollDebtsRes.value.data as any) || []
                    : [];
            const allDebtsList: Debt[] = Array.isArray(debtsRaw) ? debtsRaw : [];

            const pSummaryMap: Record<number, PayrollSummary> = {};
            pSummaryList.forEach((item: PayrollSummary) => {
                if (item && item.user_id) {
                    pSummaryMap[item.user_id] = item;
                }
            });

            const computedSalary = calculatePayrollTotal(
                dayjs(selectedMonth),
                usersList,
                atts,
                scheds,
                pSummaryMap,
                allDebtsList
            );
            setAutoPayrollSalary(computedSalary);

            // Load manual daily reports from Database
            if (dailyManualRes.status === 'fulfilled' && dailyManualRes.value.data) {
                const rawManual = dailyManualRes.value.data as any;
                const manualList = Array.isArray(rawManual) ? rawManual : (rawManual.data || []);
                const mapping: Record<string, any> = {};
                if (Array.isArray(manualList)) {
                    manualList.forEach((item) => {
                        if (!item) return;
                        const d = dayjs(item.report_date).format('YYYY-MM-DD');
                        mapping[d] = {
                            cashIncome: item.cash_income || 0,
                            cashExpense: item.cash_expense || 0,
                            bankExchange: item.bank_exchange || 0,
                            bankIncome: item.bank_income || 0,
                            bankExpense: item.bank_expense || 0,
                            systemRevenue: item.system_revenue || 0,
                            note: item.note || '',
                        };
                    });
                }
                setManualReports(mapping);
            }

            // Load monthly financial expenses & previous cash balance from Database
            if (monthlySummaryRes.status === 'fulfilled' && monthlySummaryRes.value.data) {
                const mData = monthlySummaryRes.value.data as any;
                if (mData && typeof mData === 'object') {
                    setMonthlyExpensesByMonth((prev) => ({
                        ...prev,
                        [selectedMonth]: {
                            salary: mData.salary || 0,
                            fixedCost: mData.fixed_cost || 24500000,
                            premises: mData.premises || 75000000,
                            yard: mData.yard || 0,
                            cloth: mData.cloth || 0,
                        },
                    }));
                    if (mData.prev_month_cash_balance !== undefined && mData.prev_month_cash_balance > 0) {
                        setPrevMonthCashBalance(mData.prev_month_cash_balance);
                    }
                }
            }
        } catch (_err) {
            console.error('Fetch report data error:', _err);
            toast.error('Lỗi khi tải dữ liệu báo cáo');
        } finally {
            setLoading(false);
        }
    }, [selectedMonth]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Build rows
    const allRows = useMemo<DailyReportRow[]>(() => {
        const start = dayjs(selectedMonth).startOf('month');
        const end = dayjs(selectedMonth).endOf('month');
        const daysInMonth = end.date();

        const receiptsByDate: Record<string, { cashIncome: number; cashExpense: number; bankIncome: number; bankExpense: number }> = {};
        receipts.forEach((r) => {
            const d = dayjs(r.receipt_date).format('YYYY-MM-DD');
            if (!receiptsByDate[d]) receiptsByDate[d] = { cashIncome: 0, cashExpense: 0, bankIncome: 0, bankExpense: 0 };
            if (r.is_income) {
                if (r.payment_method === 'cash') receiptsByDate[d].cashIncome += r.amount || 0;
                else receiptsByDate[d].bankIncome += r.amount || 0;
            } else {
                if (r.payment_method === 'cash') receiptsByDate[d].cashExpense += r.amount || 0;
                else receiptsByDate[d].bankExpense += r.amount || 0;
            }
        });

        const revByDate: Record<string, number> = {};
        revenues.forEach((rev) => {
            const d = dayjs(rev.date || (rev as any).revenue_date).format('YYYY-MM-DD');
            revByDate[d] = (revByDate[d] || 0) + (rev.amount || 0);
        });

        const exchangeByDate: Record<string, number> = {};
        exchanges.forEach((ex) => {
            const d = dayjs(ex.exchange_date).format('YYYY-MM-DD');
            exchangeByDate[d] = (exchangeByDate[d] || 0) + (ex.amount || 0);
        });

        const debtsByDate: Record<string, { newDebt: number; paidCash: number; paidBank: number }> = {};
        debts.forEach((debt) => {
            const d = dayjs(debt.debt_date || debt.created_at).format('YYYY-MM-DD');
            if (!debtsByDate[d]) debtsByDate[d] = { newDebt: 0, paidCash: 0, paidBank: 0 };
            if (debt.is_paid) {
                if (debt.payment_method === 'cash') debtsByDate[d].paidCash += debt.amount || 0;
                else debtsByDate[d].paidBank += debt.amount || 0;
            } else {
                debtsByDate[d].newDebt += debt.amount || 0;
            }
        });

        const safeByDate: Record<string, number> = {};
        safes.forEach((s) => {
            const d = dayjs(s.safe_date).format('YYYY-MM-DD');
            safeByDate[d] = s.amount || 0;
        });

        const rows: DailyReportRow[] = [];
        let currentDayStartingBalance = prevMonthCashBalance;

        for (let i = 1; i <= daysInMonth; i++) {
            const curDate = start.date(i);
            const dateStr = curDate.format('YYYY-MM-DD');
            const displayDate = curDate.format('DD/MM/YYYY');

            const manual = manualReports[dateStr];

            const rec = receiptsByDate[dateStr] || { cashIncome: 0, cashExpense: 0, bankIncome: 0, bankExpense: 0 };
            const dInfo = debtsByDate[dateStr] || { newDebt: 0, paidCash: 0, paidBank: 0 };
            const exAmount = exchangeByDate[dateStr] || 0;
            const apiSysRev = revByDate[dateStr] || 0;

            const cashIncome = (manual?.cashIncome ?? 0) + rec.cashIncome;
            const cashExpense = (manual?.cashExpense ?? 0) + rec.cashExpense;
            const bankExchange = (manual?.bankExchange ?? 0) + exAmount;
            const bankIncome = (manual?.bankIncome ?? 0) + rec.bankIncome;
            const bankExpense = (manual?.bankExpense ?? 0) + rec.bankExpense;
            const bankRealRevenue = bankIncome - bankExpense + bankExchange;

            const debtPaidCash = dInfo.paidCash;
            const debtPaidBank = dInfo.paidBank;
            const debtNew = dInfo.newDebt;

            // Dư két đầu ngày (ngày đầu tiên = Tiền mặt tồn tháng trước, ngày tiếp theo = Dư két cuối ngày của ngày trước đó)
            let dayCashBalance = currentDayStartingBalance;
            if (safeByDate[dateStr] !== undefined && safeByDate[dateStr] > 0) {
                dayCashBalance = safeByDate[dateStr];
            }

            // Tính số dư cuối ngày để chuyển sang Dư két của ngày tiếp theo
            const dayEndingBalance = dayCashBalance + cashIncome - cashExpense - bankExchange;
            currentDayStartingBalance = dayEndingBalance;

            const totalRealIncome = cashIncome + bankIncome;
            const sysRev = (manual?.systemRevenue ?? 0) + apiSysRev;
            const difference = totalRealIncome - sysRev;
            const note = manual?.note || dailyNotes[dateStr] || '';

            const hasActivity =
                cashIncome !== 0 ||
                cashExpense !== 0 ||
                bankIncome !== 0 ||
                bankExpense !== 0 ||
                bankExchange !== 0 ||
                sysRev !== 0 ||
                debtPaidCash !== 0 ||
                debtPaidBank !== 0 ||
                (safeByDate[dateStr] !== undefined && safeByDate[dateStr] > 0) ||
                dailyNotes[dateStr] !== undefined ||
                Boolean(manual);

            if (hasActivity) {
                rows.push({
                    stt: rows.length + 1,
                    date: dateStr,
                    displayDate,
                    cashBalance: dayCashBalance,
                    cashIncome,
                    cashExpense,
                    bankExchange,
                    bankIncome,
                    bankExpense,
                    bankRealRevenue,
                    debtPaidCash,
                    debtPaidBank,
                    debtNew,
                    totalRealIncome,
                    systemRevenue: sysRev,
                    difference,
                    note,
                });
            }
        }

        return rows;
    }, [selectedMonth, receipts, revenues, safes, debts, exchanges, prevMonthCashBalance, dailyNotes, manualReports]);

    // Filter by search
    const filteredRows = useMemo(() => {
        if (!searchTerm.trim()) return allRows;
        const term = searchTerm.toLowerCase();
        return allRows.filter(
            (r) => r.displayDate.includes(term) || r.note.toLowerCase().includes(term)
        );
    }, [allRows, searchTerm]);

    // Totals
    const totals = useMemo(() => {
        return allRows.reduce(
            (acc, r) => {
                acc.cashIncome += r.cashIncome;
                acc.cashExpense += r.cashExpense;
                acc.bankExchange += r.bankExchange;
                acc.bankIncome += r.bankIncome;
                acc.bankExpense += r.bankExpense;
                acc.bankRealRevenue += r.bankRealRevenue;
                acc.debtPaidCash += r.debtPaidCash;
                acc.debtPaidBank += r.debtPaidBank;
                acc.debtNew += r.debtNew;
                acc.totalRealIncome += r.totalRealIncome;
                acc.systemRevenue += r.systemRevenue;
                acc.difference += r.difference;
                return acc;
            },
            {
                cashIncome: 0,
                cashExpense: 0,
                bankExchange: 0,
                bankIncome: 0,
                bankExpense: 0,
                bankRealRevenue: 0,
                debtPaidCash: 0,
                debtPaidBank: 0,
                debtNew: 0,
                totalRealIncome: 0,
                systemRevenue: 0,
                difference: 0,
            }
        );
    }, [allRows]);

    // Dư két ở hàng tổng cộng: Dư két ngày mới nhất + Thu TM - Chi TM - Đổi TM
    const latestRowEndingCash = useMemo(() => {
        if (allRows.length === 0) return prevMonthCashBalance;
        const latestRow = allRows[allRows.length - 1];
        return latestRow.cashBalance + latestRow.cashIncome - latestRow.cashExpense - latestRow.bankExchange;
    }, [allRows, prevMonthCashBalance]);

    const currentMonthlyExpenses = monthlyExpensesByMonth[selectedMonth] || {
        salary: 0,
        fixedCost: 24500000,
        premises: 75000000,
        yard: 0,
        cloth: 0,
    };

    const effectiveSalary =
        currentMonthlyExpenses.salary !== undefined && currentMonthlyExpenses.salary !== 0
            ? currentMonthlyExpenses.salary
            : autoPayrollSalary;

    const effectiveFixedCost =
        currentMonthlyExpenses.fixedCost !== undefined && currentMonthlyExpenses.fixedCost !== 0
            ? currentMonthlyExpenses.fixedCost
            : 24500000;

    const effectivePremises =
        currentMonthlyExpenses.premises !== undefined && currentMonthlyExpenses.premises !== 0
            ? currentMonthlyExpenses.premises
            : 75000000;

    const effectiveYard = currentMonthlyExpenses.yard || 0;
    const effectiveCloth = currentMonthlyExpenses.cloth || 0;

    const netProfit =
        totals.totalRealIncome -
        (totals.cashExpense + totals.bankExpense) -
        effectiveSalary -
        effectiveFixedCost -
        effectivePremises -
        effectiveYard -
        effectiveCloth;

    const fmt = (val: number) => {
        if (val === 0) return '0 đ';
        const formatted = new Intl.NumberFormat('vi-VN').format(Math.abs(val));
        return val < 0 ? `-${formatted} đ` : `${formatted} đ`;
    };

    const updateMonthlySummaryField = async (
        field: 'salary' | 'fixedCost' | 'premises' | 'yard' | 'cloth' | 'prevMonthCashBalance',
        value: number
    ) => {
        try {
            const payload = {
                month: selectedMonth,
                salary: field === 'salary' ? value : currentMonthlyExpenses.salary,
                fixed_cost: field === 'fixedCost' ? value : currentMonthlyExpenses.fixedCost,
                premises: field === 'premises' ? value : currentMonthlyExpenses.premises,
                yard: field === 'yard' ? value : currentMonthlyExpenses.yard,
                cloth: field === 'cloth' ? value : currentMonthlyExpenses.cloth,
                prev_month_cash_balance: field === 'prevMonthCashBalance' ? value : prevMonthCashBalance,
            };
            await tempReportAPI.saveMonthlySummary(payload);
            if (field === 'prevMonthCashBalance') {
                setPrevMonthCashBalance(value);
            } else {
                setMonthlyExpensesByMonth((prev) => ({
                    ...prev,
                    [selectedMonth]: {
                        salary: payload.salary,
                        fixedCost: payload.fixed_cost,
                        premises: payload.premises,
                        yard: payload.yard,
                        cloth: payload.cloth,
                    },
                }));
            }
            toast.success('Đã lưu dữ liệu vào Database');
        } catch (_err) {
            toast.error('Lỗi khi lưu dữ liệu vào Database');
        }
    };

    const handleOpenEditMonthlyModal = () => {
        setEditMonthlyFormData({
            prevMonthCashBalance: prevMonthCashBalance.toString(),
            salary: (currentMonthlyExpenses.salary || 0).toString(),
            fixedCost: effectiveFixedCost.toString(),
            premises: effectivePremises.toString(),
            yard: effectiveYard.toString(),
            cloth: effectiveCloth.toString(),
        });
        setShowEditMonthlyModal(true);
    };

    const handleSaveMonthlyModal = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                month: selectedMonth,
                salary: Number(editMonthlyFormData.salary) || 0,
                fixed_cost: Number(editMonthlyFormData.fixedCost) || 0,
                premises: Number(editMonthlyFormData.premises) || 0,
                yard: Number(editMonthlyFormData.yard) || 0,
                cloth: Number(editMonthlyFormData.cloth) || 0,
                prev_month_cash_balance: Number(editMonthlyFormData.prevMonthCashBalance) || 0,
            };
            await tempReportAPI.saveMonthlySummary(payload);
            setPrevMonthCashBalance(payload.prev_month_cash_balance);
            setMonthlyExpensesByMonth((prev) => ({
                ...prev,
                [selectedMonth]: {
                    salary: payload.salary,
                    fixedCost: payload.fixed_cost,
                    premises: payload.premises,
                    yard: payload.yard,
                    cloth: payload.cloth,
                },
            }));
            setShowEditMonthlyModal(false);
            toast.success('Đã lưu cài đặt chi phí tháng vào Database');
        } catch (_err) {
            toast.error('Lỗi khi lưu dữ liệu vào Database');
        }
    };

    const handleOpenAddModal = () => {
        setAddFormData(getDefaultFormData());
        setShowAddModal(true);
    };

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                report_date: addFormData.date,
                cash_income: Number(addFormData.cashIncome) || 0,
                cash_expense: Number(addFormData.cashExpense) || 0,
                bank_exchange: Number(addFormData.bankExchange) || 0,
                bank_income: Number(addFormData.bankIncome) || 0,
                bank_expense: Number(addFormData.bankExpense) || 0,
                system_revenue: Number(addFormData.systemRevenue) || 0,
                note: addFormData.note || '',
            };

            await tempReportAPI.saveDailyManualReport(payload);

            setManualReports((prev) => ({
                ...prev,
                [addFormData.date]: {
                    cashIncome: payload.cash_income,
                    cashExpense: payload.cash_expense,
                    bankExchange: payload.bank_exchange,
                    bankIncome: payload.bank_income,
                    bankExpense: payload.bank_expense,
                    systemRevenue: payload.system_revenue,
                    note: payload.note,
                },
            }));
            setShowAddModal(false);
            toast.success(`Đã lưu báo cáo ngày ${dayjs(addFormData.date).format('DD/MM/YYYY')} vào Database`);
        } catch (_err) {
            toast.error('Lỗi khi lưu báo cáo vào Database');
        }
    };

    return (
        <div className="pt-0 px-6 pb-6 space-y-6">
            {/* Header matching Tournaments page */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-[16px] font-semibold uppercase text-[#37393E] dark:text-white flex items-center gap-2">
                        BÁO CÁO TẠM & THEO DÕI CHI PHÍ
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleOpenAddModal}
                        className="bg-[#C6010B] hover:bg-[#C6010B]/90 text-white font-medium px-4 py-2.5 rounded-[24px] flex items-center justify-center transition-colors cursor-pointer text-sm"
                    >
                        <div className="flex items-center gap-2">
                            <Icon icon="solar:add-circle-outline" className="text-xl" />
                            Thêm báo cáo
                        </div>
                    </button>
                </div>
            </div>

            {/* Top Summary 3 KPI Boxes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                    onClick={handleOpenEditMonthlyModal}
                    className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-blue-400 transition-colors"
                    title="Nhấp để sửa tiền mặt tồn tháng trước & chi phí tháng"
                >
                    <p className="text-sm md:text-[15px] font-medium text-gray-600 dark:text-gray-300">
                        Tiền mặt tồn tháng trước
                    </p>
                    <p className="text-xl md:text-2xl font-bold text-red-600 dark:text-red-500 mt-1.5">
                        {formatCurrency(prevMonthCashBalance)}
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <p className="text-sm md:text-[15px] font-medium text-gray-600 dark:text-gray-300">
                        Tiền mặt còn trong két
                    </p>
                    <p className="text-xl md:text-2xl font-bold text-red-600 dark:text-red-500 mt-1.5">
                        {formatCurrency(latestRowEndingCash)}
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <p className="text-sm md:text-[15px] font-medium text-gray-600 dark:text-gray-300">
                        Tổng tiền trong tài khoản
                    </p>
                    <p className="text-xl md:text-2xl font-bold text-red-600 dark:text-red-500 mt-1.5">
                        {formatCurrency(totals.bankRealRevenue)}
                    </p>
                </div>
            </div>

            {/* Main Card with Tournament styling */}
            <Card className="overflow-hidden rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-0">
                {/* Filters & Search Toolbar matching Tournaments */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-4 border-b dark:border-gray-700">
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                                Tháng:
                            </span>
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="text-sm font-semibold text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <TextInput
                            id="search"
                            type="text"
                            placeholder="Tìm kiếm..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            icon={() => <Icon icon="solar:magnifer-outline" />}
                            className="w-full md:w-64"
                        />
                    </div>
                </div>

                {/* Main Table */}
                <div className="overflow-x-auto">
                    <Table hoverable className="w-full text-xs">
                        <Table.Head className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold uppercase text-center border-b dark:border-gray-600">
                            <Table.HeadCell className="text-center py-3">NGÀY</Table.HeadCell>
                            <Table.HeadCell className="text-center py-3">DƯ KÉT</Table.HeadCell>
                            <Table.HeadCell className="text-center py-3">THU TIỀN MẶT</Table.HeadCell>
                            <Table.HeadCell className="text-center py-3">CHI TIỀN MẶT</Table.HeadCell>
                            <Table.HeadCell className="text-center py-3">ĐỔI TIỀN MẶT</Table.HeadCell>
                            <Table.HeadCell className="text-center py-3">THU TÀI KHOẢN</Table.HeadCell>
                            <Table.HeadCell className="text-center py-3">CHI TÀI KHOẢN</Table.HeadCell>
                            <Table.HeadCell className="text-center py-3">TỔNG TÀI KHOẢN</Table.HeadCell>
                            <Table.HeadCell className="text-center py-3">TỔNG THU</Table.HeadCell>
                            <Table.HeadCell className="text-center py-3">DOANH THU HỆ THỐNG</Table.HeadCell>
                            <Table.HeadCell className="text-center py-3">CHÊNH LỆCH</Table.HeadCell>
                        </Table.Head>

                        <Table.Body className="divide-y divide-gray-200 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
                            {filteredRows.length === 0 ? (
                                <Table.Row>
                                    <Table.Cell colSpan={11} className="text-center py-12 text-gray-400">
                                        Không có dữ liệu báo cáo trong tháng {dayjs(selectedMonth).format('MM/YYYY')}
                                    </Table.Cell>
                                </Table.Row>
                            ) : (
                                filteredRows.map((row) => {
                                    const isDiff = Math.abs(row.difference) > 0;
                                    return (
                                        <Table.Row
                                            key={row.date}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                        >
                                            <Table.Cell className="text-center font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                                                {row.displayDate}
                                            </Table.Cell>

                                            <Table.Cell className="text-center font-medium text-red-600 dark:text-red-400 whitespace-nowrap">
                                                {fmt(row.cashBalance)}
                                            </Table.Cell>

                                            <Table.Cell className="text-center whitespace-nowrap">
                                                {row.cashIncome > 0 ? fmt(row.cashIncome) : ''}
                                            </Table.Cell>

                                            <Table.Cell className="text-center whitespace-nowrap">
                                                {row.cashExpense > 0 ? fmt(row.cashExpense) : ''}
                                            </Table.Cell>

                                            <Table.Cell className="text-center whitespace-nowrap">
                                                {fmt(row.bankExchange)}
                                            </Table.Cell>

                                            <Table.Cell className="text-center whitespace-nowrap">
                                                {row.bankIncome > 0 ? fmt(row.bankIncome) : ''}
                                            </Table.Cell>

                                            <Table.Cell className="text-center whitespace-nowrap">
                                                {row.bankExpense > 0 ? fmt(row.bankExpense) : ''}
                                            </Table.Cell>

                                            <Table.Cell className="text-center font-medium text-red-600 dark:text-red-400 whitespace-nowrap">
                                                {fmt(row.bankRealRevenue)}
                                            </Table.Cell>

                                            <Table.Cell className="text-center font-bold text-red-600 dark:text-red-400 whitespace-nowrap">
                                                {fmt(row.totalRealIncome)}
                                            </Table.Cell>

                                            <Table.Cell className="text-center font-semibold whitespace-nowrap">
                                                {row.systemRevenue > 0 ? fmt(row.systemRevenue) : ''}
                                            </Table.Cell>

                                            <Table.Cell
                                                className={`text-center font-bold whitespace-nowrap ${
                                                    isDiff ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
                                                }`}
                                            >
                                                {fmt(row.difference)}
                                            </Table.Cell>
                                        </Table.Row>
                                    );
                                })
                            )}
                        </Table.Body>

                        {/* Summary Footer */}
                        <tfoot>
                            <tr className="bg-gray-50 dark:bg-gray-750 font-bold text-gray-900 dark:text-white border-t-2 border-gray-300 dark:border-gray-600">
                                <td className="px-4 py-3 text-center uppercase font-bold text-gray-900 dark:text-white">
                                    TỔNG CỘNG ({allRows.length} NGÀY)
                                </td>
                                <td className="px-3 py-3 text-center font-bold text-gray-900 dark:text-white">{fmt(latestRowEndingCash)}</td>
                                <td className="px-3 py-3 text-center font-bold text-gray-900 dark:text-white">{fmt(totals.cashIncome)}</td>
                                <td className="px-3 py-3 text-center font-bold text-gray-900 dark:text-white">{fmt(totals.cashExpense)}</td>
                                <td className="px-3 py-3 text-center font-bold text-gray-900 dark:text-white">{fmt(totals.bankExchange)}</td>
                                <td className="px-3 py-3 text-center font-bold text-gray-900 dark:text-white">{fmt(totals.bankIncome)}</td>
                                <td className="px-3 py-3 text-center font-bold text-gray-900 dark:text-white">{fmt(totals.bankExpense)}</td>
                                <td className="px-3 py-3 text-center font-bold text-gray-900 dark:text-white">{fmt(totals.bankRealRevenue)}</td>
                                <td className="px-3 py-3 text-center font-bold text-gray-900 dark:text-white">{fmt(totals.totalRealIncome)}</td>
                                <td className="px-3 py-3 text-center font-bold text-gray-900 dark:text-white">{fmt(totals.systemRevenue)}</td>
                                <td className="px-3 py-3 text-center font-bold text-gray-900 dark:text-white">{fmt(totals.difference)}</td>
                            </tr>
                        </tfoot>
                    </Table>
                </div>
            </Card>

            {/* Monthly Profit Summary Table */}
            <Card className="overflow-hidden rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-0">
                <div className="p-4 border-b dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/70 flex flex-col md:flex-row justify-between items-center gap-2">
                    <div className="flex items-center gap-2">
                        <Icon icon="solar:chart-2-outline" className="text-xl text-red-600" />
                        <h2 className="text-[15px] font-bold uppercase text-gray-800 dark:text-white">
                            BÁO CÁO LỢI NHUẬN TỔNG THÁNG {dayjs(selectedMonth).format('MM/YYYY')}
                        </h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium hidden md:inline">
                            (Nhấp vào ô để chỉnh sửa Lương NV, Thuế phí, Mặt bằng)
                        </span>
                        <button
                            type="button"
                            onClick={handleOpenEditMonthlyModal}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs transition-colors cursor-pointer"
                        >
                            <Icon icon="solar:pen-2-outline" className="text-sm" />
                            Sửa chi phí tháng
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table hoverable className="w-full text-xs">
                        <Table.Head className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold uppercase text-center border-b dark:border-gray-600">
                            <Table.HeadCell className="text-center py-3">TỔNG THU</Table.HeadCell>
                            <Table.HeadCell className="text-center py-3">TỔNG CHI</Table.HeadCell>
                            <Table.HeadCell className="text-center py-3">DOANH THU HỆ THỐNG</Table.HeadCell>
                            <Table.HeadCell className="text-center py-3">CHÊNH LỆCH</Table.HeadCell>
                            <Table.HeadCell className="text-center py-3">LƯƠNG NHÂN VIÊN</Table.HeadCell>
                            <Table.HeadCell className="text-center py-3">THUẾ PHÍ</Table.HeadCell>
                            <Table.HeadCell className="text-center py-3">MẶT BẰNG</Table.HeadCell>
                            <Table.HeadCell className="text-center py-3">SÂN BÃI</Table.HeadCell>
                            <Table.HeadCell className="text-center py-3">THAY NỈ</Table.HeadCell>
                            <Table.HeadCell className="text-center py-3">LỢI NHUẬN THUẦN</Table.HeadCell>
                        </Table.Head>

                        <Table.Body className="divide-y divide-gray-200 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
                            <Table.Row className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <Table.Cell className="text-center font-bold text-gray-900 dark:text-white whitespace-nowrap">
                                    {fmt(totals.totalRealIncome)}
                                </Table.Cell>
                                <Table.Cell className="text-center font-bold text-gray-900 dark:text-white whitespace-nowrap">
                                    {fmt(totals.cashExpense + totals.bankExpense)}
                                </Table.Cell>
                                <Table.Cell className="text-center font-bold text-gray-900 dark:text-white whitespace-nowrap">
                                    {fmt(totals.systemRevenue)}
                                </Table.Cell>
                                <Table.Cell className="text-center font-bold text-gray-900 dark:text-white whitespace-nowrap">
                                    {fmt(totals.difference)}
                                </Table.Cell>
                                <Table.Cell className="text-center font-bold text-gray-900 dark:text-white whitespace-nowrap">
                                    {fmt(effectiveSalary)}
                                </Table.Cell>
                                <Table.Cell className="text-center font-bold text-gray-900 dark:text-white whitespace-nowrap">
                                    {fmt(effectiveFixedCost)}
                                </Table.Cell>
                                <Table.Cell className="text-center font-bold text-gray-900 dark:text-white whitespace-nowrap">
                                    {fmt(effectivePremises)}
                                </Table.Cell>
                                <Table.Cell className="text-center font-bold text-gray-900 dark:text-white whitespace-nowrap">
                                    {fmt(effectiveYard)}
                                </Table.Cell>
                                <Table.Cell className="text-center font-bold text-gray-900 dark:text-white whitespace-nowrap">
                                    {fmt(effectiveCloth)}
                                </Table.Cell>
                                <Table.Cell className="text-center font-extrabold text-blue-600 dark:text-blue-400 whitespace-nowrap text-sm">
                                    {fmt(netProfit)}
                                </Table.Cell>
                            </Table.Row>
                        </Table.Body>
                    </Table>
                </div>
            </Card>

            {/* Modal Add Daily Entry */}
            <BaseDialog
                open={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="Thêm báo cáo ngày"
                size="xl"
                showFooter={true}
                footer={
                    <>
                        <Button type="button" color="gray" onClick={() => setShowAddModal(false)}>
                            Hủy
                        </Button>
                        <Button type="submit" form="add-report-form" color="blue">
                            Lưu báo cáo
                        </Button>
                    </>
                }
            >
                <form id="add-report-form" onSubmit={handleAddSubmit} className="space-y-4 text-sm">
                    <div>
                        <Label value="Ngày báo cáo:" className="mb-1 block font-medium text-gray-700 dark:text-gray-300" />
                        <TextInput
                            type="date"
                            required
                            value={addFormData.date}
                            onChange={(e) => setAddFormData({ ...addFormData, date: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label value="Thu tiền mặt (VNĐ):" className="mb-1 block font-medium text-gray-700 dark:text-gray-300" />
                            <TextInput
                                type="number"
                                placeholder="0"
                                value={addFormData.cashIncome}
                                onChange={(e) => setAddFormData({ ...addFormData, cashIncome: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label value="Chi tiền mặt (VNĐ):" className="mb-1 block font-medium text-gray-700 dark:text-gray-300" />
                            <TextInput
                                type="number"
                                placeholder="0"
                                value={addFormData.cashExpense}
                                onChange={(e) => setAddFormData({ ...addFormData, cashExpense: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label value="Đổi tiền mặt (VNĐ):" className="mb-1 block font-medium text-gray-700 dark:text-gray-300" />
                            <TextInput
                                type="number"
                                placeholder="0"
                                value={addFormData.bankExchange}
                                onChange={(e) => setAddFormData({ ...addFormData, bankExchange: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label value="Thu tài khoản (VNĐ):" className="mb-1 block font-medium text-gray-700 dark:text-gray-300" />
                            <TextInput
                                type="number"
                                placeholder="0"
                                value={addFormData.bankIncome}
                                onChange={(e) => setAddFormData({ ...addFormData, bankIncome: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label value="Chi tài khoản (VNĐ):" className="mb-1 block font-medium text-gray-700 dark:text-gray-300" />
                            <TextInput
                                type="number"
                                placeholder="0"
                                value={addFormData.bankExpense}
                                onChange={(e) => setAddFormData({ ...addFormData, bankExpense: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label value="Doanh thu hệ thống (VNĐ):" className="mb-1 block font-medium text-gray-700 dark:text-gray-300" />
                            <TextInput
                                type="number"
                                placeholder="0"
                                value={addFormData.systemRevenue}
                                onChange={(e) => setAddFormData({ ...addFormData, systemRevenue: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <Label value="Ghi chú / Diễn giải:" className="mb-1 block font-medium text-gray-700 dark:text-gray-300" />
                        <TextInput
                            value={addFormData.note}
                            onChange={(e) => setAddFormData({ ...addFormData, note: e.target.value })}
                            placeholder="Nhập ghi chú hoặc lý do phát sinh..."
                        />
                    </div>
                </form>
            </BaseDialog>

            {/* Modal Edit Monthly Financial Expenses */}
            <BaseDialog
                open={showEditMonthlyModal}
                onClose={() => setShowEditMonthlyModal(false)}
                title={`Chỉnh sửa chi phí tháng ${dayjs(selectedMonth).format('MM/YYYY')}`}
                size="lg"
                showFooter={true}
                footer={
                    <>
                        <Button type="button" color="gray" onClick={() => setShowEditMonthlyModal(false)}>
                            Hủy
                        </Button>
                        <Button type="submit" form="edit-monthly-form" color="blue">
                            Lưu thay đổi
                        </Button>
                    </>
                }
            >
                <form id="edit-monthly-form" onSubmit={handleSaveMonthlyModal} className="space-y-4 text-sm">
                    <div>
                        <Label value="Tiền mặt tồn tháng trước (VNĐ):" className="mb-1 block font-medium text-gray-700 dark:text-gray-300" />
                        <TextInput
                            type="number"
                            placeholder="0"
                            value={editMonthlyFormData.prevMonthCashBalance}
                            onChange={(e) => setEditMonthlyFormData({ ...editMonthlyFormData, prevMonthCashBalance: e.target.value })}
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <Label value="Lương nhân viên (VNĐ):" className="font-medium text-gray-700 dark:text-gray-300" />
                            <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                                (Tự động từ /payroll: {fmt(autoPayrollSalary)})
                            </span>
                        </div>
                        <TextInput
                            type="number"
                            placeholder="Nhập 0 để tự động lấy từ /payroll"
                            value={editMonthlyFormData.salary}
                            onChange={(e) => setEditMonthlyFormData({ ...editMonthlyFormData, salary: e.target.value })}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Để 0 nếu muốn hệ thống tự động đồng bộ theo tổng tiền lương thực nhận từ trang Quản lý lương (/payroll).
                        </p>
                    </div>

                    <div>
                        <Label value="Thuế phí (VNĐ):" className="mb-1 block font-medium text-gray-700 dark:text-gray-300" />
                        <TextInput
                            type="number"
                            placeholder="24500000"
                            value={editMonthlyFormData.fixedCost}
                            onChange={(e) => setEditMonthlyFormData({ ...editMonthlyFormData, fixedCost: e.target.value })}
                        />
                        <p className="text-xs text-gray-500 mt-1">Mặc định: 24.500.000 đ</p>
                    </div>

                    <div>
                        <Label value="Tiền mặt bằng (VNĐ):" className="mb-1 block font-medium text-gray-700 dark:text-gray-300" />
                        <TextInput
                            type="number"
                            placeholder="75000000"
                            value={editMonthlyFormData.premises}
                            onChange={(e) => setEditMonthlyFormData({ ...editMonthlyFormData, premises: e.target.value })}
                        />
                        <p className="text-xs text-gray-500 mt-1">Mặc định: 75.000.000 đ</p>
                    </div>

                    <div>
                        <Label value="Tiền sân bãi (VNĐ):" className="mb-1 block font-medium text-gray-700 dark:text-gray-300" />
                        <TextInput
                            type="number"
                            placeholder="0"
                            value={editMonthlyFormData.yard}
                            onChange={(e) => setEditMonthlyFormData({ ...editMonthlyFormData, yard: e.target.value })}
                        />
                        <p className="text-xs text-gray-500 mt-1">Chi phí sân bãi trong tháng (VNĐ)</p>
                    </div>

                    <div>
                        <Label value="Tiền thay nỉ (VNĐ):" className="mb-1 block font-medium text-gray-700 dark:text-gray-300" />
                        <TextInput
                            type="number"
                            placeholder="0"
                            value={editMonthlyFormData.cloth}
                            onChange={(e) => setEditMonthlyFormData({ ...editMonthlyFormData, cloth: e.target.value })}
                        />
                        <p className="text-xs text-gray-500 mt-1">Chi phí thay nỉ bàn bi-a trong tháng (VNĐ)</p>
                    </div>
                </form>
            </BaseDialog>
        </div>
    );
};

export default TempReport;
