import { FC } from 'react';
import { Outlet } from "react-router";
import ScrollToTop from 'src/components/shared/ScrollToTop';
import Sidebar from './sidebar/Sidebar';
import Header from './header/Header';

const FullLayout: FC = () => {
  return (
    <>
      <div className="flex w-full min-h-screen" style={{ backgroundColor: '#ffffff' }}>
        <div className="page-wrapper flex w-full">
          {/* Header/sidebar */}
          <Sidebar />
          <div className="page-wrapper-sub flex flex-col w-full" style={{ backgroundColor: '#ffffff' }}>
            {/* Top Header  */}
            <Header />

            <div
              className={`h-full rounded-bb`}
              style={{ backgroundColor: '#e8e8e8' }}
            >
              {/* Body Content  */}
              <div
                className={`w-full h-full`}
              >
                <ScrollToTop>
                  <div className="container py-30">
                    <Outlet />
                  </div>
                </ScrollToTop>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FullLayout;
