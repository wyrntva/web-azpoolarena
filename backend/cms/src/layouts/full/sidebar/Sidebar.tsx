import { useState, useEffect } from "react";
import { Sidebar } from "flowbite-react";
import SidebarContent from "./Sidebaritems";
import NavItems from "./NavItems";
import SimpleBar from "simplebar-react";
import React from "react";
import FullLogo from "../shared/logo/FullLogo";
import { useLocation } from "react-router";
import { useAuth } from "../../../auth/AuthContext";

import NavCollapse from "./NavCollapse";

const SidebarLayout = () => {
  const { user } = useAuth();
  const [openItem, setOpenItem] = useState<string | null>(null);
  const location = useLocation();
  const pathname = location.pathname;

  // Filter menu items based on roles
  const filteredSidebarContent = SidebarContent.map(group => {
    if (!user || (user as unknown as { role_id?: number }).role_id === 1) return group; // Admin sees all

    // Others (Shift Leader, Employee) only see specific routes
    const allowedUrls = ['/timesheet', '/work-schedule', '/payroll'];
    const newChildren = group.children?.map(child => {
      if (child.children) {
        const filteredSubChildren = child.children.filter(sub => allowedUrls.includes(sub.url));
        if (filteredSubChildren.length > 0) {
          return { ...child, children: filteredSubChildren };
        }
        return null;
      }
      return allowedUrls.includes(child.url) ? child : null;
    }).filter(Boolean);

    if (newChildren && newChildren.length > 0) {
      return { ...group, children: newChildren };
    }
    return null;
  }).filter(Boolean) as typeof SidebarContent;

  // Find and set the active item on load/path change
  useEffect(() => {
    let foundActive: string | null = null;
    filteredSidebarContent.forEach((group) => {
      group.children?.forEach((child) => {
        if (child.children) {
          const isActive = child.children.some((subChild) => subChild.url === pathname);
          if (isActive) {
            foundActive = child.name || null;
          }
        }
      });
    });
    setOpenItem(foundActive);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const handleToggle = (name: string) => {
    setOpenItem(openItem === name ? null : name);
  };


  return (
    <>
      <div className="xl:block hidden">
        <div className="fixed menu-sidebar bg-white rtl:pe-4 rtl:ps-0 top-0 z-[10] h-full min-h-screen flex flex-col">
          {/* Top border line to align with header */}
          <div className="h-[4px] w-full bg-[#172339] shrink-0" />
          {/* Logo Area (Fixed at top) */}
          <div className="flex items-center justify-center h-[46px] sidebarlogo shrink-0">
            <FullLogo theme="dark" />
          </div>

          {/* Menu Area (Scrollable) */}
          <div className="flex-1 overflow-hidden">
            <SimpleBar className="h-full">
              <Sidebar aria-label="Sidebar Content" className="bg-transparent [&>div]:bg-transparent [&>div]:p-0">
                <Sidebar.Items className="pl-5 pr-2.5 mt-4 pb-4">
                  <Sidebar.ItemGroup className="sidebar-nav hide-menu !border-t-0 !mt-0">
                    {filteredSidebarContent &&
                      filteredSidebarContent.map((item, index) => (
                        <div className="caption" key={item.heading || index}>
                          <h5 className="text-link dark:text-white/70 caption font-semibold leading-6 tracking-widest text-[14px] pb-2 uppercase mt-4 first:mt-0">
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


                  </Sidebar.ItemGroup>
                </Sidebar.Items>
              </Sidebar>
            </SimpleBar>
          </div>

          {/* Settings Area (Fixed at bottom) */}
          {(!user || (user as unknown as { role_id?: number }).role_id === 1) && (
            <div className="shrink-0 pl-5 pr-2.5 pb-0 h-[50px] flex flex-col justify-end">
              <div className="border-t border-border dark:border-darkborder mb-2"></div>
              <Sidebar aria-label="Settings Content" className="!w-full bg-transparent [&>div]:bg-transparent [&>div]:p-0 [&>div]:w-full">
                <Sidebar.Items>
                  <Sidebar.ItemGroup className="sidebar-nav hide-menu !border-t-0 !mt-0">
                    <NavItems
                      item={{
                        name: "Thiết lập",
                        icon: "solar:settings-outline",
                        url: "/settings",
                      }}
                    />
                  </Sidebar.ItemGroup>
                </Sidebar.Items>
              </Sidebar>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SidebarLayout;
