import { useState } from "react";
import { Navbar, Drawer } from "flowbite-react";
import { Icon } from "@iconify/react";
import Profile from "./Profile";
import Notification from "./notification";
import MobileSidebar from "../sidebar/MobileSidebar";

const Header = () => {
  // mobile-sidebar
  const [isOpen, setIsOpen] = useState(false);
  const handleClose = () => setIsOpen(false);
  return (
    <>
      <header
        className="absolute top-0 left-0 right-[6px] z-[10] h-[50px] flex flex-col justify-start bg-white dark:bg-dark"
      >
        <div className="h-[4px] w-full bg-[#172339] shrink-0" />
        <Navbar
          fluid
          className={`rounded-none bg-transparent dark:bg-transparent h-[46px] py-0 sm:px-30 px-4 flex items-center`}
        >
          {/* Mobile Toggle Icon */}

          <div className="flex gap-3 items-center justify-between w-full relative">
            <div className="flex gap-2 items-center">
              <span
                onClick={() => setIsOpen(true)}
                className="h-10 w-10 flex text-black dark:text-white text-opacity-65 xl:hidden hover:text-primary hover:bg-lightprimary rounded-full justify-center items-center cursor-pointer"
              >
                <Icon icon="solar:hamburger-menu-line-duotone" height={21} />
              </span>
              <Notification />
            </div>

            <div className="flex gap-4 items-center">
              <Profile />
            </div>
          </div>
        </Navbar>
      </header>

      {/* Mobile Sidebar */}
      <Drawer open={isOpen} onClose={handleClose} className="w-130">
        <Drawer.Items>
          <MobileSidebar />
        </Drawer.Items>
      </Drawer>
    </>
  );
};

export default Header;
