import { Button, Dropdown } from "flowbite-react";
import { Icon } from "@iconify/react";
import user1 from "/src/assets/images/profile/user-1.jpg";
import { Link } from "react-router";
import { useAuth } from "../../../auth/AuthContext";

const Profile = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="relative group/menu">
      <Dropdown
        label=""
        className="rounded-sm w-44"
        dismissOnClick={false}
        renderTrigger={() => (
          <span className="h-10 w-10 hover:text-primary hover:bg-lightprimary rounded-full flex justify-center items-center cursor-pointer group-hover/menu:bg-lightprimary group-hover/menu:text-primary">
            <img
              src={user1}
              alt="profile"
              height="35"
              width="35"
              className="rounded-full"
            />
          </span>
        )}
      >
        {/* User Info */}
        <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {user?.full_name || 'User'}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {user?.role?.name || 'Role'}
          </p>
        </div>

        <Dropdown.Item
          as={Link}
          to="/change-password"
          className="px-3 py-3 flex items-center bg-hover group/link w-full gap-3 text-dark"
        >
          <Icon icon="solar:lock-password-outline" height={20} />
          Đổi mật khẩu
        </Dropdown.Item>

        <div className="p-3 pt-0">
          <Button
            size="sm"
            onClick={handleLogout}
            className="mt-2 w-full border border-red-500 text-red-500 bg-transparent hover:bg-red-50 dark:hover:bg-red-900/20 outline-none focus:outline-none"
          >
            <Icon icon="solar:logout-2-outline" height={18} className="mr-2" />
            Đăng xuất
          </Button>
        </div>
      </Dropdown>
    </div>
  );
};

export default Profile;
