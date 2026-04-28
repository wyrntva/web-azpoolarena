import { useState, useEffect } from "react";
import { Sidebar } from "flowbite-react";
import SidebarContent from "./Sidebaritems";
import NavItems from "./NavItems";
import SimpleBar from "simplebar-react";
import React from "react";
import FullLogo from "../shared/logo/FullLogo";
import { useLocation } from "react-router";

import NavCollapse from "./NavCollapse";

const SidebarLayout = () => {
  const [openItem, setOpenItem] = useState<string | null>(null);
  const location = useLocation();
  const pathname = location.pathname;

  // Find and set the active item on load/path change
  useEffect(() => {
    SidebarContent.forEach((group) => {
      group.children?.forEach((child) => {
        if (child.children) {
          const isActive = child.children.some((subChild: any) => subChild.url === pathname);
          if (isActive) {
            setOpenItem(child.name || null);
          }
        }
      });
    });
  }, [pathname]);

  const handleToggle = (name: string) => {
    setOpenItem(openItem === name ? null : name);
  };


  return (
    <>
      <div className="xl:block hidden">
        <div className="fixed menu-sidebar bg-white dark:bg-darkgray rtl:pe-4 rtl:ps-0 top-0 z-[10] h-full min-h-screen flex flex-col">
          {/* Logo Area (Fixed at top) */}
          <div className="flex items-center justify-center h-[50px] sidebarlogo shrink-0">
            <FullLogo />
          </div>

          {/* Menu Area (Scrollable) */}
          <div className="flex-1 overflow-hidden">
            <SimpleBar className="h-full">
              <Sidebar aria-label="Sidebar Content" className="bg-transparent [&>div]:bg-transparent [&>div]:p-0">
                <Sidebar.Items className="px-5 mt-4 pb-4">
                  <Sidebar.ItemGroup className="sidebar-nav hide-menu !border-t-0 !mt-0">
                    {SidebarContent &&
                      SidebarContent.map((item, index) => (
                        <div className="caption" key={item.heading || index}>
                          <h5 className="text-link dark:text-white/70 caption font-semibold leading-6 tracking-widest text-xs pb-2 uppercase mt-4 first:mt-0">
                            {item.heading}
                          </h5>
                          {item.children?.map((child, cIndex) => (
                            <React.Fragment key={child.id || `${index}-${cIndex}`}>
                              {child.children ? (
                                <div className="collpase-items">
                                  <NavCollapse
                                    item={child}
                                    isOpen={openItem === child.name}
                                    onToggle={() => handleToggle(child.name || '')}
                                  />
                                </div>
                              ) : (
                                <NavItems item={child} />
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      ))}

                    {/* Settings */}
                    <div className="caption">
                      <div className="border-t border-border dark:border-darkborder my-4"></div>
                      <NavItems
                        item={{
                          name: "Thiết lập",
                          icon: "solar:settings-outline",
                          url: "/settings",
                        }}
                      />
                    </div>
                  </Sidebar.ItemGroup>
                </Sidebar.Items>
              </Sidebar>
            </SimpleBar>
          </div>
        </div>
      </div>
    </>
  );
};

export default SidebarLayout;
