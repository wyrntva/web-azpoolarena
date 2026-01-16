import { Layout, Menu, ConfigProvider } from "antd";
import {
  HomeOutlined,
  ShoppingOutlined,
  UserOutlined,
  SettingOutlined,
  LineChartOutlined,
  ShoppingCartOutlined,
  ScheduleOutlined,
} from "@ant-design/icons";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Logo from "../../assets/logo-home.png";
import { useAuth } from "../../auth/AuthContext";
import { hasPermission } from "../../utils/permissions";
import { PERMISSIONS } from "../../constants/permissions";

const { Sider } = Layout;

export default function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();

  const [collapsed, setCollapsed] = useState(
    JSON.parse(localStorage.getItem("sidebarCollapsed")) || false
  );

  const [openKeys, setOpenKeys] = useState(
    JSON.parse(localStorage.getItem("sidebarOpenKeys")) || []
  );

  // Helper function để kiểm tra quyền xem trang
  const canView = (permission) => {
    return hasPermission(user, permission);
  };

  /* ===== SAVE STATE ===== */
  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", JSON.stringify(collapsed));
  }, [collapsed]);

  useEffect(() => {
    localStorage.setItem("sidebarOpenKeys", JSON.stringify(openKeys));
  }, [openKeys]);

  /* ===== RESPONSIVE AUTO COLLAPSE ===== */
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <Sider
      width={240}
      collapsedWidth={80}
      collapsible
      collapsed={collapsed}
      trigger={null}
      onCollapse={setCollapsed}
      style={{
        background: "#172339",
        height: "100vh",
        position: "sticky",
        top: 0,
        left: 0,
        overflow: "hidden",
      }}
    >
      {/* LOGO - lệch trái khi mở rộng */}
      <div
        style={{
          height: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          padding: collapsed ? 0 : "0 24px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <img
          src={Logo}
          alt="AZ Pool Arena"
          style={{
            height: 62,
            width: "auto",
            objectFit: "contain",
          }}
        />
      </div>

      {/* MENU WRAPPER */}
      <ConfigProvider
        theme={{
          components: {
            Menu: {
              iconSize: 20,
              itemColor: "#ffffff",
              itemHoverColor: "#ffffff",
              itemSelectedColor: "#ffffff",
              itemBg: "#172339",
              itemHoverBg: "rgba(255,255,255,0.08)",
              itemSelectedBg: "rgba(255,255,255,0.14)",
              itemBorderRadius: 0,
              activeBarBorderWidth: 0,
            },
          },
        }}
      >
        {/* Phần menu cuộn được + style thanh cuộn đẹp */}
        <div
          style={{
            height: "calc(100vh - 50px - 100px)", // điều chỉnh để phần dưới vừa khít
            overflowY: "auto",
            overflowX: "hidden",
            // Style thanh cuộn đẹp (chỉ hoạt động trên Webkit browsers: Chrome, Edge, Safari)
            scrollbarWidth: "thin", // Firefox
            scrollbarColor: "rgba(255,255,255,0.2) transparent", // Firefox
          }}
          className="custom-scrollbar" // để thêm style chi tiết hơn nếu cần
        >
          {/* CSS inline cho thanh cuộn Webkit */}
          <style jsx>{`
            .custom-scrollbar::-webkit-scrollbar {
              width: 6px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: transparent;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: rgba(255, 255, 255, 0.2);
              border-radius: 3px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: rgba(255, 255, 255, 0.4);
            }
          `}</style>

          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            openKeys={collapsed ? [] : openKeys}
            onOpenChange={setOpenKeys}
            style={{ background: "#172339", borderRight: "none" }}
          >
            {/* Dashboard - luôn hiển thị */}
            {canView(PERMISSIONS.DASHBOARD.VIEW) && (
              <Menu.Item key="/" icon={<HomeOutlined />}>
                <Link to="/">Tổng quan</Link>
              </Menu.Item>
            )}

            {/* Báo cáo */}
            {canView(PERMISSIONS.REPORTS.VIEW_PAGE) && (
              <Menu.SubMenu key="reports" icon={<LineChartOutlined />} title="Báo cáo">
                <Menu.Item key="/reports"><Link to="/reports">Báo cáo chi tiết</Link></Menu.Item>
                <Menu.Item key="/revenue-report"><Link to="/revenue-report">Báo cáo doanh thu</Link></Menu.Item>
                <Menu.Item key="/expense-report"><Link to="/expense-report">Báo cáo chi phí</Link></Menu.Item>
              </Menu.SubMenu>
            )}

            {/* Thu chi - hiển thị nếu có ít nhất 1 quyền xem */}
            {(canView(PERMISSIONS.RECEIPTS.VIEW_PAGE) ||
              canView(PERMISSIONS.FINANCE_TRADE.VIEW_PAGE) ||
              canView(PERMISSIONS.REVENUES.VIEW_PAGE) ||
              canView(PERMISSIONS.SAFE.VIEW_PAGE) ||
              canView(PERMISSIONS.DEBT.VIEW_PAGE) ||
              canView(PERMISSIONS.FINANCE_TYPES.VIEW_PAGE)) && (
                <Menu.SubMenu key="finance" icon={<ShoppingOutlined />} title="Thu chi">
                  {canView(PERMISSIONS.RECEIPTS.VIEW_PAGE) && (
                    <Menu.Item key="/finance"><Link to="/finance">Thu chi</Link></Menu.Item>
                  )}
                  {canView(PERMISSIONS.FINANCE_TRADE.VIEW_PAGE) && (
                    <Menu.Item key="/finance-trade"><Link to="/finance-trade">Đổi tiền</Link></Menu.Item>
                  )}
                  {canView(PERMISSIONS.REVENUES.VIEW_PAGE) && (
                    <Menu.Item key="/revenue"><Link to="/revenue">Doanh thu</Link></Menu.Item>
                  )}
                  {canView(PERMISSIONS.SAFE.VIEW_PAGE) && (
                    <Menu.Item key="/safe"><Link to="/safe">Tài chính</Link></Menu.Item>
                  )}
                  {canView(PERMISSIONS.DEBT.VIEW_PAGE) && (
                    <Menu.Item key="/debt"><Link to="/debt">Công nợ</Link></Menu.Item>
                  )}
                  {canView(PERMISSIONS.FINANCE_TYPES.VIEW_PAGE) && (
                    <Menu.Item key="/finance-types"><Link to="/finance-types">Danh mục chi</Link></Menu.Item>
                  )}
                </Menu.SubMenu>
              )}

            {/* Kho hàng */}
            {canView(PERMISSIONS.INVENTORY.VIEW_PAGE) && (
              <Menu.SubMenu key="inventory" icon={<ShoppingCartOutlined />} title="Kho hàng">
                <Menu.Item key="/inventory"><Link to="/inventory">Danh sách tồn kho</Link></Menu.Item>
                <Menu.Item key="/inventory-transaction"><Link to="/inventory-transaction">Xuất nhập kho</Link></Menu.Item>
                <Menu.Item key="/inventory-check"><Link to="/inventory-check">Kiểm kê kho</Link></Menu.Item>
                <Menu.Item key="/inventory-history"><Link to="/inventory-history">Lịch sử kho</Link></Menu.Item>
                <Menu.Item key="/warehouse-setup"><Link to="/warehouse-setup">Thiết lập kho</Link></Menu.Item>
              </Menu.SubMenu>
            )}

            {/* Nhân viên */}
            {(canView(PERMISSIONS.STAFF.VIEW_PAGE) || canView(PERMISSIONS.ROLES.VIEW_PAGE)) && (
              <Menu.SubMenu key="staff" icon={<UserOutlined />} title="Nhân viên">
                {canView(PERMISSIONS.STAFF.VIEW_PAGE) && (
                  <Menu.Item key="/staff"><Link to="/staff">Danh sách nhân viên</Link></Menu.Item>
                )}
                {canView(PERMISSIONS.ROLES.VIEW_PAGE) && (
                  <Menu.Item key="/staff-role"><Link to="/staff-role">Vai trò nhân viên</Link></Menu.Item>
                )}
              </Menu.SubMenu>
            )}

            {/* Chấm công */}
            {(canView(PERMISSIONS.ATTENDANCE.VIEW_PAGE) || canView(PERMISSIONS.WORK_SCHEDULE.VIEW_PAGE)) && (
              <Menu.SubMenu key="attendance" icon={<ScheduleOutlined />} title="Chấm công">
                {canView(PERMISSIONS.ATTENDANCE.VIEW_PAGE) && (
                  <Menu.Item key="/timesheet"><Link to="/timesheet">Bảng chấm công</Link></Menu.Item>
                )}
                {canView(PERMISSIONS.WORK_SCHEDULE.VIEW_PAGE) && (
                  <Menu.Item key="/work-schedule"><Link to="/work-schedule">Lịch làm việc</Link></Menu.Item>
                )}
                {canView(PERMISSIONS.WORK_SCHEDULE.VIEW_PAGE) && (
                  <Menu.Item key="/payroll"><Link to="/payroll">Bảng Lương</Link></Menu.Item>
                )}
                {canView(PERMISSIONS.SETTINGS.VIEW_PAGE) && (
                  <Menu.Item key="/attendance-settings"><Link to="/attendance-settings">Thiết lập chấm công</Link></Menu.Item>
                )}
              </Menu.SubMenu>
            )}
          </Menu>
        </div>

        {/* Phần fixed ở đáy - line giống hệt line trên */}
        <div>
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.08)",
              marginTop: 42,
              marginBottom: 4,
              marginLeft: 0,
              marginRight: 0,
            }}
          />
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            style={{ background: "#172339", borderRight: "none" }}
          >
            {canView(PERMISSIONS.SETTINGS.VIEW_PAGE) && (
              <Menu.Item key="/settings" icon={<SettingOutlined />}>
                <Link to="/settings">Thiết lập</Link>
              </Menu.Item>
            )}
          </Menu>
        </div>
      </ConfigProvider>
    </Sider>
  );
}