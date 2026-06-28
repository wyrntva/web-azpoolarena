import { useState, useEffect } from "react";
import { Sidebar } from "flowbite-react";
import SidebarContent from "./Sidebaritems";
import NavItems from "./NavItems";
import React from "react";
import 'simplebar-react/dist/simplebar.min.css';
import { useLocation } from "react-router";
import { useAuth } from "../../../auth/AuthContext";
import NavCollapse from "./NavCollapse";


const MobileSidebar = () => {
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
    setOpenItem((prev) => (prev === name ? null : name));
  };

  return (
    <div className="menu-sidebar mobile-sidebar h-full overflow-x-hidden flex flex-col">
      <div className="mobile-menu-scroll flex-1 min-h-0 overflow-y-auto">
        <Sidebar className="!w-full bg-transparent [&>div]:bg-transparent [&>div]:p-0 [&>div]:w-full" aria-label="Mobile Sidebar">
          <Sidebar.Items className="px-3 mt-4 pb-4">
            <Sidebar.ItemGroup className="sidebar-nav hide-menu !border-t-0 !mt-0">
              {filteredSidebarContent &&
                filteredSidebarContent.map((item, index) => (
                  <div className="caption" key={item.heading || index}>
                    <h5 className="text-link dark:text-white/70 caption font-semibold leading-6 tracking-wide text-[12px] pb-2 uppercase whitespace-nowrap mt-4 first:mt-0">
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
      </div>

      {(!user || (user as unknown as { role_id?: number }).role_id === 1) && (
        <div className="shrink-0 border-t border-border">
          <Sidebar className="!w-full bg-transparent [&>div]:bg-transparent [&>div]:p-0 [&>div]:w-full" aria-label="Settings">
            <Sidebar.Items className="px-3 py-2">
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
  );
};

export default MobileSidebar;
