
import { useState, useEffect } from "react";
import { ChildItem } from "../Sidebaritems";
import NavItems from "../NavItems";
import { useLocation } from "react-router";
import { CustomCollapse } from "../CustomCollapse";
import React from "react";

interface NavCollapseProps {
  item: ChildItem;
  isOpen?: boolean;
  onToggle?: () => void;
  isChild?: boolean;
}

const NavCollapse: React.FC<NavCollapseProps> = ({ item, isOpen: controlledOpen, onToggle, isChild }: any) => {
  const location = useLocation();
  const pathname = location.pathname;

  // Determine if any child matches the current path
  const activeDD = item.children.find((t: { url: string }) => t.url === pathname);

  // For nested (isChild) items that are not controlled by Sidebar.tsx
  const [internalOpen, setInternalOpen] = useState<boolean>(!!activeDD);

  // If onToggle is provided, we use the controlled state. Otherwise, we use internal state.
  const isOpen = onToggle ? !!controlledOpen : internalOpen;

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggle) {
      onToggle();
    } else {
      setInternalOpen((prev) => !prev);
    }
  };

  // Auto open internal state when a child becomes active (for nested items)
  useEffect(() => {
    if (activeDD && !onToggle) {
      setInternalOpen(true);
    }
  }, [activeDD, onToggle]);

  return (
    <CustomCollapse
      label={`${item.name}`}
      open={isOpen}
      onClick={(e: any) => handleToggle(e)}
      icon={item.icon}
      isPro={item.isPro}
      isChild={isChild}
      className={
        activeDD || isOpen
          ? "text-primary bg-transparent shadow-none"
          : "dark:text-white/80 hover:text-primary px-4"
      }
    >
      {/* Render child items */}
      {item.children && (
        <div className="sidebar-dropdown">
          {item.children.map((child: any) => (
            <React.Fragment key={child.id}>
              {child.children ? (
                <NavCollapse item={child} isChild={true} /> // Nested collapses don't get onToggle, so they use internal state
              ) : (
                <NavItems item={child} isChild={true} />
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </CustomCollapse>
  );
};

export default NavCollapse;
