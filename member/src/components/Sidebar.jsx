import { NavLink } from 'react-router-dom';
import { navItems } from '../constants/navigation.jsx';

import logo from '../assets/azpoolarena-logo.png';

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <img src={logo} alt="AzPoolArena" className="brand-logo" />
      </div>

      <nav className="nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <>
                    {item.path !== '/home' && <span className="notch-top"></span>}
                    <span className="notch-bottom"></span>
                  </>
                )}
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
