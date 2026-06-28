import { useState } from "react";
import Profile from "./Profile";
import Notification from "./notification";
import MobileSidebar from "../sidebar/MobileSidebar";
import FullLogo from "../shared/logo/FullLogo";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const handleClose = () => setIsOpen(false);
  return (
    <>
      <header
        className="absolute top-0 left-0 right-[6px] z-[20] h-[50px] flex flex-col justify-start bg-white dark:bg-dark shadow-md dark:shadow-dark-md"
      >
        <div className="h-[4px] w-full bg-[#172339] shrink-0" />
        <div className="h-[46px] py-0 px-4 flex items-center w-full">
          <span
            onClick={() => setIsOpen(true)}
            className="h-10 w-10 flex xl:hidden justify-center items-center cursor-pointer shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect y="1.85718" width="20" height="2" rx="1" fill="#37393E"/>
              <rect y="16" width="12" height="2" rx="1" fill="#C6010B"/>
              <rect y="9" width="20" height="2" rx="1" fill="#37393E"/>
            </svg>
          </span>

          {/* Logo giữa topbar — chỉ hiện trên mobile */}
          <div className="xl:hidden absolute left-1/2 -translate-x-1/2 [&_img]:max-h-[20px]">
            <FullLogo theme="dark" />
          </div>

          <div className="flex gap-4 items-center ml-auto">
            <Notification />
            <Profile />
          </div>
        </div>
      </header>

      {/* Mobile Sidebar — starts below topbar */}
      <div className="xl:hidden">
        {/* Backdrop */}
        {isOpen && (
          <div
            className="fixed inset-0 top-[50px] bg-black/40 z-[15]"
            onClick={handleClose}
          />
        )}

        {/* Slide-in panel */}
        <div
          className={`fixed top-[50px] left-0 bottom-0 w-64 bg-white z-[25] shadow-xl transition-transform duration-300 ease-in-out overflow-hidden ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <MobileSidebar />
        </div>
      </div>
    </>
  );
};

export default Header;
