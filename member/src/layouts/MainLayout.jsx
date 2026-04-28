import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import Topbar from '../components/Topbar.jsx';
import MobileNav from '../components/MobileNav.jsx';

function MainLayout() {
  return (
    <div className="app">
      <div className="main">
        <Topbar />
        <div className="content-area">
          <Outlet />
        </div>
      </div>
      <MobileNav />
    </div>
  );
}

export default MainLayout;
