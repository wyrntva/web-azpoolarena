import { useState, useEffect } from "react";
import { Sidebar } from "flowbite-react";
import SidebarContent from "./Sidebaritems";
import NavItems from "./NavItems";
import SimpleBar from "simplebar-react";
import React from "react";
import FullLogo from "../shared/logo/FullLogo";
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
    if (!user || (user as any).role_id === 1) return group; // Admin sees all

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
    filteredSidebarContent.forEach((group) => {
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
    setOpenItem((prev) => (prev === name ? null : name));
  };

  return (
    <>
      <div>
        <Sidebar
          className="fixed menu-sidebar pt-0 bg-white dark:bg-darkgray transition-all shadow-none w-full"
          aria-label="Sidebar with multi-level dropdown example"
        >
          <div className="px-5 py-4 pb-7 flex items-center sidebarlogo">
            <FullLogo />
          </div>
          <SimpleBar className="h-[calc(100vh_-_100px)]">
            <Sidebar.Items className="px-5 mt-2">
              <Sidebar.ItemGroup className="sidebar-nav hide-menu">
                {filteredSidebarContent &&
                  filteredSidebarContent.map((item, index) => (
                    <div className="caption" key={item.heading}>
                      <React.Fragment key={index}>
                        <h5 className="text-link dark:text-white/70 caption font-semibold leading-6 tracking-widest text-xs pb-2 uppercase text-wrap">
                          {item.heading}
                        </h5>
                        {item.children?.map((child, index) => (
                          <React.Fragment key={child.id && index}>
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
                      </React.Fragment>
                    </div>
                  ))}
              </Sidebar.ItemGroup>
            </Sidebar.Items>
          </SimpleBar>

        </Sidebar>
      </div>
    </>
  );
};

export default MobileSidebar;
