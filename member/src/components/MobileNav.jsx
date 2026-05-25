import { NavLink } from 'react-router-dom';
import { navItems } from '../constants/navigation.jsx';

function MobileNav() {
  // Mobile order: Member, Promo, Home, Security, Download
  // The current navItems is configured for Desktop: Home, Member, Promo, Security, Download

  // We need to reorder them for mobile
  const mobileOrder = ['/member', '/promo', '/home', '/security', '/download'];

  const sortedNavItems = [...navItems].sort((a, b) => {
    return mobileOrder.indexOf(a.path) - mobileOrder.indexOf(b.path);
  });

  return (
    <nav className="mobile-nav" aria-label="Mobile">
      {sortedNavItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
        >
          <span className="nav-icon">{item.icon}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export default MobileNav;
