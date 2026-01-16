import { useState, useEffect, useMemo } from "react";
import {
  Card,
  Button,
  Modal,
  Form,
  TimePicker,
  Spin,
  Select,
  DatePicker,
  Checkbox,
  Tag,
  Space,
} from "antd";
import { message } from '../../utils/antdGlobal';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  CopyOutlined,
  HolderOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import dayjs from "dayjs";
import { workScheduleAPI } from "../../api/attendance.api";
import { userAPI } from "../../api/user.api";
import { useAuth } from "../../auth/AuthContext";
import PageHeader from "../../components/shared/PageHeader";
import { isAdmin } from "../../auth/roles";
import { formatVietnameseDate } from "../../utils/dateFormatter";
import "./WorkSchedule.css";
import "dayjs/locale/vi";

dayjs.locale("vi");

// Sortable Row Component
function SortableEmployeeRow({ employee, weekDates, today, getScheduleForCell, handleCellClick }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: employee.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr ref={setNodeRef} style={style}>
      <td className="employee-cell">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div {...attributes} {...listeners} style={{ cursor: "grab", display: "flex", alignItems: "center" }}>
            <HolderOutlined style={{ fontSize: 16, color: "#999" }} />
          </div>
          <div>
            <div className="employee-name">{employee.full_name}</div>
            <div className="employee-role">Nhân viên</div>
          </div>
        </div>
      </td>
      {weekDates.map((date) => {
        const dateStr = date.format("YYYY-MM-DD");
        const schedule = getScheduleForCell(employee.id, dateStr);
        const isToday = date.isSame(today, "day");

        return (
          <td
            key={dateStr}
            className={`schedule-cell ${isToday ? "today" : ""} ${schedule ? "has-schedule" : ""}`}
            onClick={() => handleCellClick(employee, date)}
          >
            <div className="schedule-content">
              {schedule ? (
                <div className="schedule-time">
                  {schedule.start_time} - {schedule.end_time}
                </div>
              ) : (
                <div className="dash">-</div>
              )}
            </div>
          </td>
        );
      })}
    </tr>
  );
}

export default function WorkSchedule() {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [copyForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [copyModalVisible, setCopyModalVisible] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [orderChanged, setOrderChanged] = useState(false);

  const isUserAdmin = isAdmin(user);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Tối ưu: chỉ gọi khi là admin và khi selectedDate thay đổi
  useEffect(() => {
    if (!isUserAdmin) return;

    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchEmployees(), fetchSchedules()]);
      } catch (err) {
        message.error("Không thể tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isUserAdmin, selectedDate]);

  const fetchEmployees = async () => {
    try {
      const response = await userAPI.getAll();
      const staffUsers = (response.data || [])
        .filter((u) => u.role?.name === "staff" && u.is_active === true);
      setEmployees(staffUsers);
    } catch (error) {
      console.error("Error fetching employees:", error);
      message.error("Không thể tải danh sách nhân viên");
    }
  };

  const fetchSchedules = async () => {
    try {
      const response = await workScheduleAPI.getAll();
      setSchedules(response.data || []);
    } catch (error) {
      console.error("Error fetching schedules:", error);
      message.error("Không thể tải lịch làm việc");
    }
  };

  // Tối ưu: chuyển schedules thành map để tra cứu O(1)
  const scheduleMap = useMemo(() => {
    const map = {};
    schedules.forEach((s) => {
      const key = `${s.user_id}_${s.work_date}`;
      map[key] = s;
    });
    return map;
  }, [schedules]);

  const getScheduleForCell = (employeeId, dateStr) => {
    return scheduleMap[`${employeeId}_${dateStr}`];
  };

  const getWeekDates = () => {
    const startOfWeek = selectedDate.startOf("week");
    return Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, "day"));
  };

  const weekDates = getWeekDates();
  const today = dayjs();

  const handleCellClick = (employee, date) => {
    const dateStr = date.format("YYYY-MM-DD");
    setSelectedCell({ employee, date, dateStr });
    const existing = getScheduleForCell(employee.id, dateStr);

    if (existing) {
      form.setFieldsValue({
        time_range: [
          dayjs(existing.start_time, "HH:mm"),
          dayjs(existing.end_time, "HH:mm"),
        ],
      });
    } else {
      form.resetFields();
    }
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const dateStr = selectedCell.date.format("YYYY-MM-DD");
      const existing = getScheduleForCell(selectedCell.employee.id, dateStr);

      const payload = {
        user_id: selectedCell.employee.id,
        work_date: dateStr,
        start_time: values.time_range[0].format("HH:mm"),
        end_time: values.time_range[1].format("HH:mm"),
        allowed_late_minutes: 0,
        is_active: true,
      };

      if (existing) {
        await workScheduleAPI.update(existing.id, payload);
        message.success("Đã cập nhật lịch làm việc");
      } else {
        await workScheduleAPI.create(payload);
        message.success("Đã tạo lịch làm việc");
      }

      setModalVisible(false);
      form.resetFields();
      fetchSchedules(); // reload chỉ schedules
    } catch (error) {
      message.error(
        error.response?.data?.detail || "Không thể lưu lịch làm việc"
      );
    }
  };

  const handleDeleteSchedule = async () => {
    const dateStr = selectedCell.date.format("YYYY-MM-DD");
    const existing = getScheduleForCell(selectedCell.employee.id, dateStr);
    if (existing) {
      try {
        await workScheduleAPI.delete(existing.id);
        message.success("Đã xóa lịch làm việc");
        setModalVisible(false);
        fetchSchedules();
      } catch (error) {
        message.error("Không thể xóa lịch làm việc");
      }
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setEmployees((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        setOrderChanged(true);
        return newOrder;
      });
    }
  };

  const handleSaveOrder = async () => {
    try {
      const userOrders = employees.map((emp, index) => ({
        user_id: emp.id,
        display_order: index + 1,
      }));

      await userAPI.updateDisplayOrder(userOrders);
      message.success("Đã lưu thứ tự nhân viên");
      setOrderChanged(false);
    } catch (error) {
      message.error("Không thể lưu thứ tự nhân viên");
    }
  };

  const handleCopySchedule = async () => {
    try {
      const values = await copyForm.validateFields();
      const { copyType, sourceEmployee, sourceDate, sourceDateForWeek, targetDates } = values;

      if (copyType === "employee") {
        // Copy lịch của một nhân viên sang ngày khác
        // targetDates is already an array of date strings from Checkbox.Group
        await workScheduleAPI.copySchedule({
          user_id: sourceEmployee,
          from_date: sourceDate.format("YYYY-MM-DD"),
          to_dates: targetDates, // Already in YYYY-MM-DD format
        });
        message.success(`Đã copy lịch làm việc cho ${targetDates.length} ngày`);
      } else if (copyType === "week") {
        // Copy cả tuần
        const getMondayOfWeek = (date) => {
          const dayOfWeek = date.day();
          const diff = (dayOfWeek + 6) % 7;
          return date.subtract(diff, "day");
        };

        const fromWeekStart = getMondayOfWeek(sourceDateForWeek);
        const toWeekStart = getMondayOfWeek(selectedDate);

        await workScheduleAPI.copyWeekSchedule({
          from_week_start: fromWeekStart.format("YYYY-MM-DD"),
          to_week_start: toWeekStart.format("YYYY-MM-DD"),
        });
        message.success("Đã copy lịch tuần thành công");
      }

      setCopyModalVisible(false);
      copyForm.resetFields();
      fetchSchedules();
    } catch (error) {
      if (error.errorFields) {
        // Validation error from form
        return;
      }
      message.error(error.response?.data?.detail || "Không thể copy lịch làm việc");
    }
  };

  const previousPeriod = () => setSelectedDate(selectedDate.subtract(7, "day"));
  const nextPeriod = () => setSelectedDate(selectedDate.add(7, "day"));
  const goToToday = () => setSelectedDate(dayjs());

  if (!isUserAdmin) {
    return (
      <div>
        <PageHeader
          title="Truy cập bị từ chối"
          subtitle="Chỉ quản trị viên mới có thể truy cập trang này"
        />
      </div>
    );
  }

  return (
    <div className="work-schedule-page">
      <PageHeader
        title="Lịch làm việc"
        subtitle="Quản lý lịch làm việc nhân viên"
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
            <Button
              icon={<CopyOutlined />}
              onClick={() => setCopyModalVisible(true)}
            >
              Copy lịch
            </Button>
            {orderChanged && (
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSaveOrder}
              >
                Lưu thứ tự
              </Button>
            )}
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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="schedule-grid">
              <table className="schedule-table">
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
                          <div className="date-number">
                            {date.format("DD/MM")}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  <SortableContext
                    items={employees.map((e) => e.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {employees.map((employee) => (
                      <SortableEmployeeRow
                        key={employee.id}
                        employee={employee}
                        weekDates={weekDates}
                        today={today}
                        getScheduleForCell={getScheduleForCell}
                        handleCellClick={handleCellClick}
                      />
                    ))}
                  </SortableContext>
                </tbody>
              </table>
            </div>
          </DndContext>
        )}
      </Card>

      <Modal
        title={
          selectedCell && (
            <div>
              <ClockCircleOutlined style={{ marginRight: 8 }} />
              Lịch làm việc - {selectedCell.employee.full_name}
              <div style={{ fontSize: 14, fontWeight: 400, color: "#666", marginTop: 4 }}>
                {formatVietnameseDate(selectedCell.date)}
              </div>
            </div>
          )
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={
          selectedCell && getScheduleForCell(selectedCell.employee.id, selectedCell.dateStr) ? (
            <>
              <Button danger onClick={handleDeleteSchedule}>
                Xóa lịch
              </Button>
              <Button onClick={() => setModalVisible(false)}>Hủy</Button>
              <Button type="primary" onClick={handleSubmit}>
                Lưu
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => setModalVisible(false)}>Hủy</Button>
              <Button type="primary" onClick={handleSubmit}>
                Lưu
              </Button>
            </>
          )
        }
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="time_range"
            label="Giờ làm việc"
            rules={[{ required: true, message: "Vui lòng chọn giờ làm việc" }]}
            tooltip="Hỗ trợ ca làm qua 0h (VD: 20:00 - 02:00)"
          >
            <TimePicker.RangePicker
              style={{ width: "100%" }}
              format="HH:mm"
              placeholder={["Giờ bắt đầu", "Giờ kết thúc"]}
              size="large"
              order={false}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          <div>
            <CopyOutlined style={{ marginRight: 8 }} />
            Copy lịch làm việc
          </div>
        }
        open={copyModalVisible}
        onCancel={() => {
          setCopyModalVisible(false);
          copyForm.resetFields();
        }}
        onOk={handleCopySchedule}
        okText="Copy"
        cancelText="Hủy"
        width={600}
      >
        <Form form={copyForm} layout="vertical">
          <Form.Item
            name="copyType"
            label="Loại copy"
            rules={[{ required: true, message: "Vui lòng chọn loại copy" }]}
            initialValue="employee"
          >
            <Select>
              <Select.Option value="employee">Copy lịch của một nhân viên sang ngày khác</Select.Option>
              <Select.Option value="week">Copy cả tuần sang tuần hiện tại</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.copyType !== curr.copyType}>
            {({ getFieldValue }) => {
              const copyType = getFieldValue("copyType");

              if (copyType === "employee") {
                return (
                  <>
                    <Form.Item
                      name="sourceEmployee"
                      label="Chọn nhân viên"
                      rules={[{ required: true, message: "Vui lòng chọn nhân viên" }]}
                    >
                      <Select
                        showSearch
                        placeholder="Chọn nhân viên"
                        optionFilterProp="children"
                        filterOption={(input, option) =>
                          option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                        }
                      >
                        {employees.map((emp) => (
                          <Select.Option key={emp.id} value={emp.id}>
                            {emp.full_name}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Form.Item
                      name="sourceDate"
                      label="Ngày nguồn (copy từ ngày này)"
                      rules={[{ required: true, message: "Vui lòng chọn ngày nguồn" }]}
                    >
                      <DatePicker
                        style={{ width: "100%" }}
                        format="DD/MM/YYYY"
                        placeholder="Chọn ngày nguồn"
                      />
                    </Form.Item>

                    <Form.Item
                      name="targetDates"
                      label="Ngày đích (copy sang các ngày này)"
                      rules={[{ required: true, message: "Vui lòng chọn ít nhất một ngày đích" }]}
                    >
                      <Checkbox.Group style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
                        {weekDates.map((date) => (
                          <Checkbox key={date.format("YYYY-MM-DD")} value={date.format("YYYY-MM-DD")}>
                            {formatVietnameseDate(date)}
                          </Checkbox>
                        ))}
                      </Checkbox.Group>
                    </Form.Item>
                  </>
                );
              } else if (copyType === "week") {
                return (
                  <Form.Item
                    name="sourceDateForWeek"
                    label="Chọn một ngày trong tuần nguồn"
                    rules={[{ required: true, message: "Vui lòng chọn ngày" }]}
                  >
                    <DatePicker
                      style={{ width: "100%" }}
                      format="DD/MM/YYYY"
                      placeholder="Chọn ngày bất kỳ trong tuần nguồn"
                      picker="week"
                    />
                  </Form.Item>
                );
              }
            }}
          </Form.Item>

          <div style={{ padding: 12, backgroundColor: "#e6f4ff", borderRadius: 8, marginTop: 16 }}>
            <div style={{ fontSize: 12, color: "#0958d9" }}>
              <strong>Lưu ý:</strong>
              <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                <li>Lịch trùng sẽ được bỏ qua, không ghi đè</li>
                <li>Copy tuần sẽ copy toàn bộ lịch của tất cả nhân viên</li>
              </ul>
            </div>
          </div>
        </Form>
      </Modal>
    </div>
  );
}