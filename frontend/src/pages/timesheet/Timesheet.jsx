import { useState, useEffect, useMemo } from "react";
import {
  Card,
  Button,
  Spin,
  Modal,
  Descriptions,
  DatePicker,
  TimePicker,
  Form,
  Typography,
  Tag,
  Space,
} from "antd";
import { message } from '../../utils/antdGlobal';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  EditOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { attendanceAPI, workScheduleAPI } from "../../api/attendance.api";
import { userAPI } from "../../api/user.api";
import { useAuth } from "../../auth/AuthContext";
import PageHeader from "../../components/shared/PageHeader";
import { isAdmin } from "../../auth/roles";
import { formatVietnameseDate } from "../../utils/dateFormatter";
import "./Timesheet.css";
import "dayjs/locale/vi";

dayjs.locale("vi");

export default function Timesheet() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [attendances, setAttendances] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [editForm] = Form.useForm();

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
  }, [selectedDate, isUserAdmin]);

  const fetchEmployees = async () => {
    try {
      const response = await userAPI.getAll();
      const staffUsers = (response.data || [])
        .filter((u) => u.role?.name === "staff" && u.is_active === true)
        .reduce((acc, curr) => {
          if (!acc.find((item) => item.id === curr.id)) acc.push(curr);
          return acc;
        }, []);
      // Danh sách đã được sắp xếp theo display_order từ API
      setEmployees(staffUsers);
    } catch (error) {
      console.error("Error fetching employees:", error);
      message.error("Không thể tải danh sách nhân viên");
    }
  };

  // Tính Thứ Hai của tuần một cách ổn định
  const getMondayOfWeek = (date) => {
    const dayOfWeek = date.day(); // 0 = CN, 1 = T2, ..., 6 = T7
    const diff = (dayOfWeek + 6) % 7;
    return date.subtract(diff, "day");
  };

  const getWeekDates = () => {
    const monday = getMondayOfWeek(selectedDate);
    return Array.from({ length: 7 }, (_, i) => monday.add(i, "day"));
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const monday = getMondayOfWeek(selectedDate);
      const startDate = monday.format("YYYY-MM-DD");
      const endDate = monday.add(6, "day").format("YYYY-MM-DD");

      const [attendanceRes, scheduleRes] = await Promise.all([
        attendanceAPI.getTimesheet({
          start_date: startDate,
          end_date: endDate,
          page: 1,
          page_size: 1000,
        }),
        workScheduleAPI.getAll(),
      ]);

      const attendanceItems = attendanceRes.data.items || [];
      setAttendances(attendanceItems);

      // Lọc lịch làm việc trong tuần bằng so sánh chuỗi (tránh lỗi dayjs method)
      const allSchedules = scheduleRes.data || [];
      const weekSchedules = allSchedules.filter((s) => {
        return s.work_date >= startDate && s.work_date <= endDate;
      });

      setSchedules(weekSchedules);
    } catch (error) {
      message.error("Không thể tải dữ liệu chấm công");
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

  const getCellClass = (attendance, schedule) => {
    if (!schedule) return "no-schedule";
    if (!attendance) return "not-checked"; // Chưa chấm gì cả → xanh dương nhạt

    // Nếu đã có cả check-in và check-out
    if (attendance.check_in_time && attendance.check_out_time) {
      // Kiểm tra status: nếu LATE hoặc EARLY_CHECKOUT → màu vàng cảnh báo
      if (attendance.status === 'late' || attendance.status === 'early_checkout') {
        return "checked-warning"; // Đã chấm đủ nhưng có vấn đề
      }
      return "checked-complete"; // Đã chấm đủ và đúng giờ
    }

    if (attendance.check_in_time && !attendance.check_out_time) return "incomplete"; // Chưa chấm ra → vàng nhạt
    return "not-checked";
  };

  const handleCellClick = (attendance, employee, dateStr, schedule) => {
    // Nếu không phải admin, chỉ cho xem chi tiết
    if (!isUserAdmin) {
      if (attendance) {
        setSelectedAttendance(attendance);
        setDetailModalVisible(true);
      }
      return;
    }

    // Nếu là admin, cho phép tạo mới hoặc xem chi tiết
    if (attendance) {
      setSelectedAttendance(attendance);
      setDetailModalVisible(true);
    } else if (schedule) {
      // Tạo attendance mới cho ô trống có lịch làm việc
      const newAttendance = {
        user_id: employee.id,
        user: employee,
        date: dateStr,
        check_in_time: null,
        check_out_time: null,
        isNew: true, // Flag để biết đây là record mới
      };
      setSelectedAttendance(newAttendance);
      editForm.resetFields();
      setEditModalVisible(true);
    }
  };

  // Kiểm tra vào ca muộn - dựa vào status từ backend
  const isLateCheckIn = (attendance) => {
    if (!attendance) return false;
    return attendance.status === 'late';
  };

  // Kiểm tra ra ca sớm - dựa vào status từ backend
  const isEarlyCheckOut = (attendance) => {
    if (!attendance) return false;
    return attendance.status === 'early_checkout';
  };

  const handleEditClick = (e, attendance) => {
    e.stopPropagation();
    setSelectedAttendance(attendance);
    editForm.setFieldsValue({
      check_in_time: attendance.check_in_time ? dayjs(attendance.check_in_time) : null,
      check_out_time: attendance.check_out_time ? dayjs(attendance.check_out_time) : null,
    });
    setEditModalVisible(true);
    setDetailModalVisible(false);
  };

  const handleSaveEdit = async () => {
    try {
      const values = editForm.getFieldsValue();

      // Combine date with time
      const combineDateTime = (timeValue) => {
        if (!timeValue) return null;
        const date = selectedAttendance.date;
        return dayjs(date)
          .hour(timeValue.hour())
          .minute(timeValue.minute())
          .second(timeValue.second())
          .format('YYYY-MM-DD HH:mm:ss');
      };

      // Kiểm tra ít nhất phải có một trong hai giờ
      if (!values.check_in_time && !values.check_out_time) {
        message.warning('Vui lòng chọn ít nhất giờ vào ca hoặc giờ tan ca');
        return;
      }

      const payload = {
        check_in_time: combineDateTime(values.check_in_time),
        check_out_time: combineDateTime(values.check_out_time),
      };

      // Nếu là tạo mới, gọi API tạo attendance
      if (selectedAttendance.isNew) {
        await attendanceAPI.createManualAttendance({
          user_id: selectedAttendance.user_id,
          date: selectedAttendance.date,
          ...payload,
        });
        message.success('Đã tạo dữ liệu chấm công thành công');
      } else {
        // Nếu là cập nhật, gọi API update
        await attendanceAPI.updateAttendance(selectedAttendance.id, payload);
        message.success('Cập nhật giờ chấm công thành công');
      }

      setEditModalVisible(false);
      fetchData(); // Reload data
    } catch (error) {
      console.error('Error saving attendance:', error);
      if (error.response?.data?.detail) {
        message.error(error.response.data.detail);
      } else {
        message.error('Không thể lưu giờ chấm công');
      }
    }
  };

  const handleDeleteCheckIn = async () => {
    try {
      // Gửi check_in_time = null để xóa giờ vào ca
      // Backend sẽ tự xóa record nếu cả 2 đều null
      await attendanceAPI.updateAttendance(selectedAttendance.id, {
        check_in_time: null,
        check_out_time: selectedAttendance.check_out_time,
      });
      message.success('Đã xóa giờ vào ca');
      setEditModalVisible(false);
      setDetailModalVisible(false);
      fetchData();
    } catch (error) {
      console.error('Error deleting check-in:', error);
      if (error.response?.data?.detail) {
        message.error(error.response.data.detail);
      } else {
        message.error('Không thể xóa giờ vào ca');
      }
    }
  };

  const handleDeleteCheckOut = async () => {
    try {
      await attendanceAPI.updateAttendance(selectedAttendance.id, {
        check_in_time: selectedAttendance.check_in_time,
        check_out_time: null,
      });
      message.success('Đã xóa giờ tan ca');
      setEditModalVisible(false);
      setDetailModalVisible(false);
      fetchData();
    } catch (error) {
      console.error('Error deleting check-out:', error);
      message.error('Không thể xóa giờ tan ca');
    }
  };

  const previousPeriod = () => setSelectedDate(selectedDate.subtract(7, "day"));
  const nextPeriod = () => setSelectedDate(selectedDate.add(7, "day"));
  const goToToday = () => setSelectedDate(dayjs());

  const weekDates = getWeekDates();
  const today = dayjs();

  return (
    <div className="timesheet-page">
      <PageHeader
        title="Bảng chấm công"
        subtitle={isUserAdmin ? "Xem bảng chấm công nhân viên" : "Xem bảng chấm công của bạn"}
        icon={<CalendarOutlined />}
      />

      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Button onClick={previousPeriod}>←</Button>
            <DatePicker
              value={selectedDate}
              onChange={(date) => setSelectedDate(date || dayjs())}
              format="DD/MM/YYYY"
              allowClear={false}
              picker="week"
            />
            <Button onClick={nextPeriod}>→</Button>
            <Button type="primary" onClick={goToToday}>
              Hôm nay
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
          <div className="timesheet-grid">
            <table className="timesheet-table">
              <thead>
                <tr>
                  <th className="employee-header">Nhân viên</th>
                  {weekDates.map((date, index) => {
                    const isToday = date.isSame(today, "day");
                    return (
                      <th
                        key={date.format("YYYY-MM-DD")}
                        className={`date-header ${isToday ? "today" : ""}`}
                      >
                        <div className="day-name">
                          {index === 6 ? "CN" : `T${index + 2}`}
                        </div>
                        <div className="date-number">{date.format("DD/MM")}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {(isUserAdmin ? employees : [user]).map((employee) => (
                  <tr key={employee.id}>
                    <td className="employee-cell">
                      <div className="employee-name">{employee.full_name}</div>
                      <div className="employee-role">Nhân viên</div>
                    </td>
                    {weekDates.map((date) => {
                      const dateStr = date.format("YYYY-MM-DD");
                      const attendance = getAttendanceForCell(employee.id, dateStr);
                      const schedule = getScheduleForCell(employee.id, dateStr);
                      const isToday = date.isSame(today, "day");
                      const cellClass = getCellClass(attendance, schedule);

                      return (
                        <td
                          key={dateStr}
                          className={`timesheet-cell ${isToday ? "today" : ""} ${cellClass}`}
                          onClick={() => handleCellClick(attendance, employee, dateStr, schedule)}
                        >
                          {schedule ? (
                            <div className="attendance-content" style={{ position: 'relative' }}>
                              {attendance && attendance.check_in_time ? (
                                <>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                                    <span style={{
                                      fontWeight: 500,
                                      fontSize: '13px',
                                      color: isLateCheckIn(attendance) ? '#ff4d4f' : '#000'
                                    }}>
                                      {dayjs(attendance.check_in_time).format("HH:mm")}
                                    </span>
                                    <span style={{ fontSize: '13px', color: '#999' }}>-</span>
                                    <span style={{
                                      fontWeight: 500,
                                      fontSize: '13px',
                                      color: isEarlyCheckOut(attendance) ? '#ff4d4f' : '#000'
                                    }}>
                                      {attendance.check_out_time ? dayjs(attendance.check_out_time).format("HH:mm") : "..."}
                                    </span>
                                  </div>
                                  {isUserAdmin && (
                                    <EditOutlined
                                      className="cell-edit-icon"
                                      onClick={(e) => handleEditClick(e, attendance)}
                                      style={{
                                        position: 'absolute',
                                        top: 4,
                                        right: 4,
                                        fontSize: 12,
                                        color: '#1890ff',
                                        cursor: 'pointer',
                                        opacity: 0.6,
                                        transition: 'opacity 0.2s',
                                      }}
                                      onMouseEnter={(e) => e.target.style.opacity = 1}
                                      onMouseLeave={(e) => e.target.style.opacity = 0.6}
                                    />
                                  )}
                                </>
                              ) : (
                                <div className="dash">-</div>
                              )}
                            </div>
                          ) : (
                            <div className="no-schedule">
                              <div className="dash">-</div>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Legend chính xác với màu */}
        <div style={{ marginTop: 16, display: "flex", gap: 16, fontSize: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 16, height: 16, backgroundColor: "#d4edda", border: "1px solid #c3e6cb" }}></div>
            <span>Chấm công hoàn hảo (đúng giờ)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 16, height: 16, backgroundColor: "#fff3cd", border: "1px solid #ffc107" }}></div>
            <span>Có cảnh báo (vào trễ/về sớm)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 16, height: 16, backgroundColor: "#fff7e6", border: "1px solid #ffd591" }}></div>
            <span>Chưa chấm ra (đã vào ca)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 16, height: 16, backgroundColor: "#e6f4ff", border: "1px solid #91caff" }}></div>
            <span>Chưa chấm vào ca</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 16, height: 16, backgroundColor: "#f5f5f5", border: "1px solid #d9d9d9" }}></div>
            <span>Không có lịch làm việc</span>
          </div>
        </div>
      </Card>

      <Modal
        title={
          selectedAttendance && (
            <div>
              <ClockCircleOutlined style={{ marginRight: 8 }} />
              Chi tiết chấm công - {selectedAttendance.user?.full_name}
              <div style={{ fontSize: 14, fontWeight: 400, color: "#666", marginTop: 4 }}>
                {formatVietnameseDate(dayjs(selectedAttendance.date))}
              </div>
            </div>
          )
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={
          isUserAdmin && selectedAttendance ? (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={(e) => handleEditClick(e, selectedAttendance)}
              >
                Chỉnh sửa giờ
              </Button>
              <Button onClick={() => setDetailModalVisible(false)}>Đóng</Button>
            </div>
          ) : (
            <Button onClick={() => setDetailModalVisible(false)}>Đóng</Button>
          )
        }
        width={600}
      >
        {selectedAttendance && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Nhân viên">{selectedAttendance.user?.full_name}</Descriptions.Item>
            <Descriptions.Item label="Ngày">
              {formatVietnameseDate(dayjs(selectedAttendance.date))}
            </Descriptions.Item>
            <Descriptions.Item label="Giờ vào ca">
              {selectedAttendance.check_in_time
                ? dayjs(selectedAttendance.check_in_time).format("HH:mm:ss")
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Giờ tan ca">
              {selectedAttendance.check_out_time
                ? dayjs(selectedAttendance.check_out_time).format("HH:mm:ss")
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              {selectedAttendance.status === "present" && (
                <span style={{ color: "#52c41a" }}>
                  <CheckCircleOutlined /> Đúng giờ
                </span>
              )}
              {selectedAttendance.status === "late" && (
                <span style={{ color: "#faad14" }}>
                  <WarningOutlined /> Trễ
                </span>
              )}
              {selectedAttendance.status === "early_checkout" && (
                <span style={{ color: "#ff7a45" }}>
                  <CloseCircleOutlined /> Ra sớm
                </span>
              )}
              {selectedAttendance.status === "absent" && (
                <span style={{ color: "#ff4d4f" }}>
                  <CloseCircleOutlined /> Vắng
                </span>
              )}
            </Descriptions.Item>
            {selectedAttendance.wifi_ssid && (
              <Descriptions.Item label="WiFi SSID">{selectedAttendance.wifi_ssid}</Descriptions.Item>
            )}
            {selectedAttendance.ip_address && (
              <Descriptions.Item label="Địa chỉ IP">{selectedAttendance.ip_address}</Descriptions.Item>
            )}
            {selectedAttendance.notes && (
              <Descriptions.Item label="Ghi chú">{selectedAttendance.notes}</Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      <Modal
        title={
          <div>
            <EditOutlined style={{ marginRight: 8 }} />
            {selectedAttendance?.isNew ? 'Tạo mới chấm công' : 'Chỉnh sửa giờ chấm công'}
          </div>
        }
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {!selectedAttendance?.isNew && selectedAttendance?.check_in_time && (
                <Button
                  danger
                  onClick={() => {
                    Modal.confirm({
                      title: 'Xác nhận xóa giờ vào ca',
                      content: 'Bạn có chắc chắn muốn xóa giờ vào ca không?',
                      okText: 'Xóa',
                      cancelText: 'Hủy',
                      onOk: handleDeleteCheckIn,
                    });
                  }}
                >
                  Xóa giờ vào
                </Button>
              )}
              {!selectedAttendance?.isNew && selectedAttendance?.check_out_time && (
                <Button
                  danger
                  onClick={() => {
                    Modal.confirm({
                      title: 'Xác nhận xóa giờ tan ca',
                      content: 'Bạn có chắc chắn muốn xóa giờ tan ca không?',
                      okText: 'Xóa',
                      cancelText: 'Hủy',
                      onOk: handleDeleteCheckOut,
                    });
                  }}
                >
                  Xóa giờ ra
                </Button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button onClick={() => setEditModalVisible(false)}>Hủy</Button>
              <Button type="primary" onClick={handleSaveEdit}>
                {selectedAttendance?.isNew ? 'Tạo mới' : 'Lưu'}
              </Button>
            </div>
          </div>
        }
        width={500}
      >
        {selectedAttendance && (
          <div>
            <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
              <div><strong>Nhân viên:</strong> {selectedAttendance.user?.full_name}</div>
              <div><strong>Ngày:</strong> {dayjs(selectedAttendance.date).format("DD/MM/YYYY")}</div>
            </div>

            <Form form={editForm} layout="vertical">
              <Form.Item
                label="Giờ vào ca"
                name="check_in_time"
              >
                <TimePicker
                  format="HH:mm:ss"
                  style={{ width: '100%' }}
                  placeholder="Chọn giờ vào ca"
                  showNow={false}
                />
              </Form.Item>

              <Form.Item
                label="Giờ tan ca"
                name="check_out_time"
              >
                <TimePicker
                  format="HH:mm:ss"
                  style={{ width: '100%' }}
                  placeholder="Chọn giờ tan ca (tùy chọn)"
                  showNow={false}
                />
              </Form.Item>
            </Form>

            <div style={{ marginTop: 16, padding: 12, backgroundColor: '#fff7e6', borderRadius: 8, border: '1px solid #ffd591' }}>
              <Typography.Text type="warning" style={{ fontSize: 12 }}>
                <WarningOutlined style={{ marginRight: 4 }} />
                Lưu ý: Chỉnh sửa giờ chấm công sẽ ảnh hưởng đến tính lương. Vui lòng kiểm tra kỹ trước khi lưu.
              </Typography.Text>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}