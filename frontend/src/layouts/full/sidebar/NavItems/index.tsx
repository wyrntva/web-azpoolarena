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
          ? "text-white bg-primary rounded-xl  hover:text-white hover:bg-primary dark:hover:text-white shadow-btnshdw active"
          : "text-link bg-transparent group/link "
          } ${isChild ? "ml-5 mb-0.5" : ""} `}
      >
        <div className={`flex items-center ${centered ? 'justify-center' : 'justify-between'}`}>
          <span className="flex gap-3 align-center items-center">
            {!isChild && (
              item.icon ? (
                <Icon icon={item.icon} height={18} />
              ) : (
                <span
                  className={`${item.url == pathname
                    ? "bg-white rounded-full mx-1.5 h-[6px] w-[6px]"
                    : "h-[6px] w-[6px] bg-black/40 dark:bg-white rounded-full mx-1.5 group-hover/link:bg-primary"
                    } `}
                ></span>
              )
            )}
            <span
              className={`${isChild ? "text-[14px]" : ""}`}
            >
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
