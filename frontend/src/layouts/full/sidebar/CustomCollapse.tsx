
import { twMerge } from "tailwind-merge";
import { HiOutlineChevronDown } from "react-icons/hi";
import { Icon } from "@iconify/react/dist/iconify.js";
import React from "react";

const CustomCollapse: React.FC<{
  label: string;
  open: boolean;
  children: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  icon: string;
  className?: string;
  isPro?: boolean;
  isChild?: boolean;
}> = ({ label, open, onClick, icon, children, className, isPro, isChild }) => {
  return (
    <div className={twMerge("transition-none", isChild ? "ml-5 mb-0.5" : "")}>
      <div
        className={twMerge(
          "flex cursor-pointer mb-1 items-center justify-between rounded-lg px-4 py-[11px] gap-3 text-[15px] leading-[normal] font-normal text-link nav-cover hover:text-primary dark:text-white dark:hover:text-primary transition-colors duration-200",
          className
        )}
        onClick={onClick}
      >
        <div className="flex items-center gap-3">
          {!isChild && icon && <Icon icon={icon} height={18} />}
          <span className={twMerge("nav-label", isChild ? "text-[14px]" : "")}>{label}</span>
        </div>
        <div className="flex items-center gap-0.5" >
          {isPro ? <span className="py-0.5 px-2.5 text-[10px] bg-lightsecondary text-secondary rounded-sm">Pro</span> : null}
          <HiOutlineChevronDown
            className={twMerge("transform transition-transform duration-300", open ? "rotate-180" : "rotate-0")}
          />
        </div>
      </div>

      {/* Container with Grid Height Transition */}
      <div
        className={twMerge(
          "grid transition-all duration-300 ease-in-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden min-h-0">
          {children}
        </div>
      </div>
    </div>
  );
};

export { CustomCollapse }