import { useState, useEffect, useMemo } from "react";
import {
  Button,
  message,
  Spin,
  DatePicker,
  InputNumber,
} from "antd";
import dayjs from "dayjs";
import { attendanceAPI, workScheduleAPI } from "../../../api/attendance.api";
import { userAPI } from "../../../api/user.api";
import { payrollAPI } from "../../../api/payroll.api";
import { debtAPI } from "../../../api/debt.api";
import { useAuth } from "../../../auth/AuthContext";
import { isAdmin } from "../../../auth/roles";
import "dayjs/locale/vi";

dayjs.locale("vi");

export default function SalaryTable() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [attendances, setAttendances] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [payrollSummary, setPayrollSummary] = useState({});
  const [debts, setDebts] = useState([]);
  const [salaryCoefficients, setSalaryCoefficients] = useState(() => {
    // Load from localStorage on initial render
    const saved = localStorage.getItem('salaryCoefficients');
    return saved ? JSON.parse(saved) : {};
  });

  const isUserAdmin = isAdmin(user);

  // Tối ưu lookup O(1)
  const attendanceMap = useMemo(() => {
    const map = {};
    attendances.forEach((a) => {
      map[`${a.user_id}_${a.date}`] = a;
    });
    return map;
  }, [attendances]);

  const scheduleMap = useMemo(() => {
    const map = {};
    schedules.forEach((s) => {
      map[`${s.user_id}_${s.work_date}`] = s;
    });
    return map;
  }, [schedules]);

  useEffect(() => {
    if (isUserAdmin) {
      fetchEmployees();
    }
    fetchData();
    fetchDebts();
  }, [selectedDate, isUserAdmin]);

  // Save salary coefficients to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('salaryCoefficients', JSON.stringify(salaryCoefficients));
  }, [salaryCoefficients]);

  const fetchEmployees = async () => {
    try {
      const response = await userAPI.getAll();
      const staffUsers = (response.data || [])
        .filter((u) => u.role?.name === "staff" && u.is_active === true)
        .reduce((acc, curr) => {
          if (!acc.find((item) => item.id === curr.id)) acc.push(curr);
          return acc;
        }, []);
      setEmployees(staffUsers);
    } catch (error) {
      console.error("Error fetching employees:", error);
      message.error("Không thể tải danh sách nhân viên");
    }
  };

  const fetchDebts = async () => {
    try {
      const response = await debtAPI.getDebts({ is_paid: false });
      setDebts(response.data || []);
    } catch (error) {
      console.error("Error fetching debts:", error);
    }
  };

  // Tính Thứ Hai của tháng
  const getMonthDates = (date) => {
    const startOfMonth = date.startOf("month");
    const endOfMonth = date.endOf("month");
    const daysInMonth = endOfMonth.date();
    return Array.from({ length: daysInMonth }, (_, i) => startOfMonth.add(i, "day"));
  };

  // Tự động tạo phiếu phạt cho nhân viên vắng mặt và về sớm
  const createAutoPenalties = async (schedules, attendances, employees) => {
    if (!isUserAdmin) return;

    try {
      const penaltyCases = [];

      schedules.forEach(schedule => {
        const attendance = attendances.find(
          a => a.user_id === schedule.user_id && a.date === schedule.work_date
        );

        const employee = employees.find(e => e.id === schedule.user_id);
        if (!employee) return;

        // Trường hợp 1: Có lịch nhưng không có attendance hoặc không check-in (Vắng mặt)
        if (!attendance || !attendance.check_in_time) {
          penaltyCases.push({
            user_id: schedule.user_id,
            employee_name: employee.full_name,
            date: schedule.work_date,
            amount: 100000,
            reason: `Vắng mặt không phép ngày ${dayjs(schedule.work_date).format("DD/MM/YYYY")}`,
          });
        }
        // Trường hợp 2: Có check-in nhưng về sớm (có check-out trước giờ quy định)
        else if (attendance.check_out_time) {
          const checkOutTime = dayjs(attendance.check_out_time);
          const scheduledEnd = dayjs(`${attendance.date} ${schedule.end_time}`);
          const earlyMinutes = scheduledEnd.diff(checkOutTime, "minute");

          if (earlyMinutes > 0) {
            penaltyCases.push({
              user_id: schedule.user_id,
              employee_name: employee.full_name,
              date: schedule.work_date,
              amount: 50000,
              reason: `Về sớm ${earlyMinutes} phút ngày ${dayjs(schedule.work_date).format("DD/MM/YYYY")}`,
            });
          }
        }
      });

      // Tạo phiếu phạt cho các trường hợp
      let successCount = 0;
      for (const penalty of penaltyCases) {
        try {
          await payrollAPI.createPenalty({
            user_id: penalty.user_id,
            amount: penalty.amount,
            reason: penalty.reason,
            penalty_date: penalty.date,
          });
          successCount++;
        } catch (error) {
          // Bỏ qua lỗi nếu phiếu phạt đã tồn tại
          if (error.response?.status !== 400) {
            console.error(`Error creating penalty for ${penalty.employee_name}:`, error);
          }
        }
      }

      if (successCount > 0) {
        message.success(`Đã tạo ${successCount} phiếu phạt tự động`);
      }
    } catch (error) {
      console.error("Error creating auto penalties:", error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const startDate = selectedDate.startOf("month").format("YYYY-MM-DD");
      const endDate = selectedDate.endOf("month").format("YYYY-MM-DD");
      const monthStr = selectedDate.format("YYYY-MM");

      const [attendanceRes, scheduleRes, summaryRes] = await Promise.all([
        attendanceAPI.getTimesheet({
          start_date: startDate,
          end_date: endDate,
          page: 1,
          page_size: 10000,
        }),
        workScheduleAPI.getAll(),
        payrollAPI.getPayrollSummary(monthStr),
      ]);

      const attendanceItems = attendanceRes.data.items || [];
      setAttendances(attendanceItems);

      // Lọc lịch làm việc trong tháng
      const allSchedules = scheduleRes.data || [];
      const monthSchedules = allSchedules.filter((s) => {
        return s.work_date >= startDate && s.work_date <= endDate;
      });

      setSchedules(monthSchedules);

      // Map payroll summary by user_id
      const summaryMap = {};
      (summaryRes.data || []).forEach(item => {
        summaryMap[item.user_id] = item;
      });
      setPayrollSummary(summaryMap);

      // Tự động tạo phiếu phạt cho nhân viên vắng và về sớm (chỉ nếu có employees data)
      if (employees.length > 0) {
        await createAutoPenalties(monthSchedules, attendanceItems, employees);
      }
    } catch (error) {
      message.error("Không thể tải dữ liệu bảng lương");
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceForCell = (employeeId, dateStr) => {
    return attendanceMap[`${employeeId}_${dateStr}`];
  };

  const getScheduleForCell = (employeeId, dateStr) => {
    return scheduleMap[`${employeeId}_${dateStr}`];
  };

  // Tính số phút đi muộn
  const calculateLateMinutes = (attendance, schedule) => {
    if (!attendance || !schedule || !attendance.check_in_time || !schedule.start_time) {
      return 0;
    }
    const checkInTime = dayjs(attendance.check_in_time);
    const scheduledStart = dayjs(`${attendance.date} ${schedule.start_time}`);
    const lateMinutes = checkInTime.diff(scheduledStart, "minute");
    return Math.max(0, lateMinutes);
  };

  // Tính phạt giờ làm dựa trên thời gian đi muộn
  const calculateLatePenalty = (lateMinutes, scheduledHours) => {
    if (lateMinutes < 10) {
      return 0; // Dưới 10p: không phạt
    } else if (lateMinutes < 20) {
      return 0.5; // 10-20p: phạt 0.5h
    } else if (lateMinutes < 40) {
      return 1; // 20-40p: phạt 1h
    } else {
      return scheduledHours * 0.5; // Từ 40p: phạt 50% giờ theo lịch làm việc
    }
  };

  // Tính số phút về sớm
  const calculateEarlyMinutes = (attendance, schedule) => {
    if (!attendance || !schedule || !attendance.check_out_time || !schedule.end_time) {
      return 0;
    }
    const checkOutTime = dayjs(attendance.check_out_time);
    const scheduledEnd = dayjs(`${attendance.date} ${schedule.end_time}`);
    const earlyMinutes = scheduledEnd.diff(checkOutTime, "minute");
    return Math.max(0, earlyMinutes);
  };

  // Tính số giờ làm việc theo lịch
  const calculateScheduledHours = (schedule) => {
    if (!schedule || !schedule.start_time || !schedule.end_time) {
      return 0;
    }
    const start = dayjs(`2000-01-01 ${schedule.start_time}`);
    const end = dayjs(`2000-01-01 ${schedule.end_time}`);
    return end.diff(start, "hour", true);
  };

  // Tính số giờ làm việc (theo lịch, đã trừ phạt)
  const calculateWorkHours = (attendance, schedule) => {
    // Không có lịch làm việc
    if (!schedule) {
      return 0;
    }

    // Không có attendance hoặc không check-in
    if (!attendance || !attendance.check_in_time) {
      return 0;
    }

    // Lấy số giờ theo lịch làm việc
    const scheduledHours = calculateScheduledHours(schedule);

    // Tính phạt nếu đi muộn
    const lateMinutes = calculateLateMinutes(attendance, schedule);
    const penalty = calculateLatePenalty(lateMinutes, scheduledHours);

    // Giờ tính lương = Giờ theo lịch - Phạt
    return Math.max(0, scheduledHours - penalty);
  };

  // Tính tổng giờ làm việc trong tháng (đã trừ phạt)
  const calculateTotalHours = (employeeId, dates) => {
    let total = 0;
    dates.forEach((date) => {
      const dateStr = date.format("YYYY-MM-DD");
      const attendance = getAttendanceForCell(employeeId, dateStr);
      const schedule = getScheduleForCell(employeeId, dateStr);
      total += calculateWorkHours(attendance, schedule);
    });
    return total.toFixed(1);
  };

  // Tính số ngày công
  const calculateWorkDays = (employeeId, dates) => {
    let count = 0;
    dates.forEach((date) => {
      const dateStr = date.format("YYYY-MM-DD");
      const attendance = getAttendanceForCell(employeeId, dateStr);
      if (attendance && attendance.check_in_time && attendance.check_out_time) {
        count++;
      }
    });
    return count;
  };

  // Tính tổng nợ của nhân viên
  const calculateEmployeeDebt = (employeeName) => {
    const employeeDebts = debts.filter(debt => debt.debtor_name === employeeName);
    return employeeDebts.reduce((total, debt) => total + debt.amount, 0);
  };

  // Format giờ hiển thị trong cell
  const formatHoursDisplay = (hours) => {
    if (hours === 0) return "x";
    // Kiểm tra nếu là số nguyên thì hiển thị không có phần thập phân
    if (hours % 1 === 0) return hours.toString();
    // Nếu có phần thập phân thì hiển thị 1 chữ số thập phân
    return hours.toFixed(1);
  };

  // Lấy màu background dựa vào status và giờ làm
  const getCellStyle = (attendance, schedule) => {
    if (!schedule) return { backgroundColor: "#f5f5f5", color: "#999" };
    if (!attendance || !attendance.check_in_time) {
      return { backgroundColor: "#e6f4ff", color: "#999" };
    }

    const hours = calculateWorkHours(attendance, schedule);

    // Vắng
    if (attendance.status === "absent") {
      return { backgroundColor: "#fff1f0", color: "#ff4d4f" };
    }

    // Muộn
    if (attendance.status === "late") {
      return { backgroundColor: "#fff7e6", color: "#d46b08" };
    }

    // Ra sớm
    if (attendance.status === "early_checkout") {
      return { backgroundColor: "#fff7e6", color: "#d46b08" };
    }

    // Giờ làm đầy đủ (>= 8 giờ)
    if (hours >= 8) {
      return { backgroundColor: "#d4edda", color: "#000" };
    }

    // Giờ làm không đủ (< 8 giờ)
    if (hours < 8 && hours > 0) {
      return { backgroundColor: "#fff7e6", color: "#d46b08" };
    }

    return { backgroundColor: "#d4edda", color: "#000" };
  };

  const previousMonth = () => setSelectedDate(selectedDate.subtract(1, "month"));
  const nextMonth = () => setSelectedDate(selectedDate.add(1, "month"));
  const goToToday = () => setSelectedDate(dayjs());

  const monthDates = getMonthDates(selectedDate);

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Button onClick={previousMonth}>←</Button>
          <DatePicker
            value={selectedDate}
            onChange={(date) => setSelectedDate(date || dayjs())}
            format="MM/YYYY"
            allowClear={false}
            picker="month"
          />
          <Button onClick={nextMonth}>→</Button>
          <Button type="primary" onClick={goToToday}>
            Tháng này
          </Button>
        </div>
        <div style={{ fontSize: 16, fontWeight: 500 }}>
          Cập nhật lúc: {dayjs().format("HH:mm, DD/MM/YYYY")}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <Spin size="large" />
        </div>
      ) : (
        <div className="payroll-grid">
          <table className="payroll-table">
            <thead>
              <tr>
                <th rowSpan="2" className="sticky-col sticky-header stt-col">STT</th>
                <th rowSpan="2" className="sticky-col sticky-header employee-name-col">Tên NV</th>
                {monthDates.map((date, index) => (
                  <th key={date.format("YYYY-MM-DD")} className="date-header">
                    {index + 1}
                  </th>
                ))}
                <th rowSpan="2" className="summary-col">Tổng giờ<br/>làm việc</th>
                <th rowSpan="2" className="summary-col">Hệ số<br/>lương</th>
                <th rowSpan="2" className="summary-col">Tổng lương</th>
                <th rowSpan="2" className="summary-col">Thưởng</th>
                <th rowSpan="2" className="summary-col">Tiền ứng</th>
                <th rowSpan="2" className="summary-col">Chi nợ</th>
                <th rowSpan="2" className="summary-col">Phạt</th>
                <th rowSpan="2" className="summary-col">Thực nhận</th>
              </tr>
              <tr>
                {monthDates.map((date) => {
                  const dayOfWeek = date.day();
                  const dayName = dayOfWeek === 0 ? "CN" : `T${dayOfWeek + 1}`;
                  return (
                    <th key={date.format("YYYY-MM-DD")} className="day-name">
                      {dayName}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {(isUserAdmin ? employees : [user]).map((employee, index) => {
                const totalHours = calculateTotalHours(employee.id, monthDates);
                const summary = payrollSummary[employee.id] || {
                  total_bonuses: 0,
                  total_advances: 0,
                  total_penalties: 0,
                  net_adjustment: 0,
                };

                // Calculate salary based on salary_type
                let totalSalary = 0;
                const isFixedSalary = employee.salary_type === 'fixed';
                const coefficientDisplay = salaryCoefficients[employee.id] || 50;

                if (isFixedSalary) {
                  // Lương cứng: sử dụng fixed_salary
                  totalSalary = employee.fixed_salary || 0;
                } else {
                  // Lương theo giờ: Tổng giờ × Hệ số lương
                  const coefficientActual = coefficientDisplay * 1000;
                  totalSalary = parseFloat(totalHours) * coefficientActual;
                }

                // Calculate employee debt
                const employeeDebt = calculateEmployeeDebt(employee.full_name);

                // Calculate: Thực nhận = Tổng lương + Thưởng - Tiền Ứng - Ghi nợ - Phạt
                const netSalary = totalSalary + summary.total_bonuses - summary.total_advances - employeeDebt - summary.total_penalties;

                return (
                  <tr key={employee.id}>
                    <td className="sticky-col stt-col">{index + 1}</td>
                    <td className="sticky-col employee-name-col">
                      {employee.full_name}
                    </td>
                    {monthDates.map((date) => {
                      const dateStr = date.format("YYYY-MM-DD");
                      const attendance = getAttendanceForCell(employee.id, dateStr);
                      const schedule = getScheduleForCell(employee.id, dateStr);
                      const hours = calculateWorkHours(attendance, schedule);
                      const cellStyle = getCellStyle(attendance, schedule);

                      return (
                        <td
                          key={dateStr}
                          className="work-hours-cell"
                          style={cellStyle}
                        >
                          {formatHoursDisplay(hours)}
                        </td>
                      );
                    })}
                    <td className="summary-col total-hours">{totalHours}</td>
                    <td className="summary-col">
                      {isFixedSalary ? (
                        <span style={{ color: '#999', fontStyle: 'italic' }}>Lương cứng</span>
                      ) : (
                        <InputNumber
                          min={0}
                          value={coefficientDisplay}
                          onChange={(value) => {
                            setSalaryCoefficients(prev => ({
                              ...prev,
                              [employee.id]: value || 50
                            }));
                          }}
                          style={{ width: 70 }}
                          disabled={!isUserAdmin}
                        />
                      )}
                    </td>
                    <td className="summary-col total-salary">
                      {totalSalary.toLocaleString()} đ
                    </td>
                    <td className="summary-col" style={{ color: '#52c41a' }}>
                      {summary.total_bonuses > 0 ? `${summary.total_bonuses.toLocaleString()} đ` : '0 đ'}
                    </td>
                    <td className="summary-col" style={{ color: '#ff4d4f' }}>
                      {summary.total_advances > 0 ? `${summary.total_advances.toLocaleString()} đ` : '0 đ'}
                    </td>
                    <td className="summary-col" style={{ color: '#ff4d4f' }}>
                      {employeeDebt > 0 ? `${employeeDebt.toLocaleString()} đ` : '0 đ'}
                    </td>
                    <td className="summary-col" style={{ color: '#ff4d4f' }}>
                      {summary.total_penalties > 0 ? `${summary.total_penalties.toLocaleString()} đ` : '0 đ'}
                    </td>
                    <td className="summary-col total-salary" style={{ fontWeight: 'bold', backgroundColor: '#e6f7ff' }}>
                      {netSalary.toLocaleString()} đ
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
