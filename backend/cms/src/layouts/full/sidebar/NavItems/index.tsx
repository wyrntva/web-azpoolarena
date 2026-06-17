import React from "react";
import { ChildItem } from "../Sidebaritems";
import { Sidebar } from "flowbite-react";
import { Icon } from "@iconify/react";
import { Link, useLocation } from "react-router";



interface NavItemsProps {
  item: ChildItem;
  isChild?: boolean;
  centered?: boolean;
}
const NavItems: React.FC<NavItemsProps> = ({ item, isChild, centered }) => {
  const location = useLocation();
  const pathname = location.pathname;

  return (
    <>
      <Sidebar.Item
        to={item.url}
        target={item?.isPro ? "blank" : "_self"}
        as={Link}
        className={`${item.url == pathname
          ? "text-white bg-primary rounded-xl  hover:text-white hover:bg-primary dark:hover:text-white shadow-btnshdw active !pl-5"
          : "text-link bg-transparent group/link "
          } ${isChild ? "mb-0.5" : ""} `}
        style={isChild ? { paddingLeft: '20px' } : undefined}
      >
        <div 
          className={`w-full flex items-center ${centered ? 'justify-center' : 'justify-between'} ${isChild ? 'pl-6 !pl-6' : ''}`}
          style={isChild ? { paddingLeft: '24px' } : undefined}
        >
          <span className="flex align-center items-center">
            {!isChild && (
              item.icon ? (
                <Icon icon={item.icon} height={20} className="mr-6 shrink-0 leading-icon" />
              ) : (
                <span
                  className={`${item.url == pathname
                    ? "bg-white rounded-full mx-1.5 h-[6px] w-[6px] mr-6 shrink-0"
                    : "h-[6px] w-[6px] bg-black/40 dark:bg-white rounded-full mx-1.5 group-hover/link:bg-primary mr-6 shrink-0"
                    } `}
                ></span>
              )
            )}
            <span className="text-[14px] font-medium">
              {item.name}
            </span>
          </span>
          {item.isPro ? <span className="py-0.5 px-2.5 text-[10px] bg-lightsecondary text-secondary rounded-sm">Pro</span> : null}
        </div>
      </Sidebar.Item>
    </>
  );
};

export default NavItems;
