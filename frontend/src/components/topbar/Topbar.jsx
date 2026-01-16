import { Layout, Dropdown, Avatar, Space, Tag } from "antd";
import { UserOutlined, LogoutOutlined, UserSwitchOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { translateRoleName } from "../../utils/roleTranslations";
import { useAuth } from "../../auth/AuthContext";

const { Header } = Layout;

const ROLE_COLORS = {
  'Quản lý': '#ff4d4f',
  'Thu ngân': '#1890ff',
  'Nhân viên': '#52c41a',
  'Phục vụ': '#722ed1', // Màu tím cho phục vụ
  'admin': '#ff4d4f',
  'accountant': '#1890ff',
  'staff': '#52c41a',
};

export default function Topbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleMenuClick = ({ key }) => {
    if (key === "logout") {
      logout();
      navigate("/login");
    } else if (key === "profile") {
      navigate("/settings");
    }
  };

  const menu = {
    items: [
      {
        key: "profile",
        label: "Tài khoản",
        icon: <UserSwitchOutlined />,
      },
      {
        key: "logout",
        label: "Đăng xuất",
        icon: <LogoutOutlined />,
        danger: true,
      },
    ],
    onClick: handleMenuClick,
  };

  return (
    <Header
      style={{
        position: "sticky",       // giữ sticky như bạn muốn topbar dính đầu trang
        top: 0,
        zIndex: 1000,             // giữ giá trị cao nhất bạn đã đặt (1000)
        display: "flex",
        height: 50,
        padding: "12px 48px",     // giữ padding ban đầu bạn viết
        justifyContent: "space-between",
        alignItems: "center",
        background: "#fff",

        /* QUAN TRỌNG - đã gộp và loại bỏ duplicate */
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
        // position và zIndex đã được gộp ở trên, không để lại duplicate
      }}
    >
      {/* LEFT */}
      <div style={{ fontSize: 18, fontWeight: 600 }}>
        AZ POOLARENA
      </div>

      {/* RIGHT */}
      <Space size="middle">
        {user && (
          <>
            <span style={{ fontSize: 14 }}>{user.full_name}</span>
            <Tag color={ROLE_COLORS[user.role?.name] || 'default'}>
              {translateRoleName(user.role?.name)}
            </Tag>
          </>
        )}
        <Dropdown menu={menu} placement="bottomRight">
          <Avatar icon={<UserOutlined />} style={{ cursor: "pointer", backgroundColor: "#172339" }} />
        </Dropdown>
      </Space>
    </Header>
  );
}