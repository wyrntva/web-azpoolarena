import { FC } from 'react';
import { Outlet } from "react-router";
import ScrollToTop from 'src/components/shared/ScrollToTop';
import Sidebar from './sidebar/Sidebar';
import Header from './header/Header';

const FullLayout: FC = () => {
  return (
    <>
      <div className="flex w-full h-screen overflow-hidden" style={{ backgroundColor: '#ffffff' }}>
        <div className="page-wrapper flex w-full h-full overflow-hidden">
          {/* Header/sidebar */}
          <Sidebar />
          <div className="page-wrapper-sub relative w-full h-full overflow-hidden" style={{ backgroundColor: '#F0F2F4' }}>
            {/* Static Grey Card Background */}
            <div
              className="absolute inset-x-0 bottom-0"
              style={{ backgroundColor: '#F0F2F4', zIndex: 1, top: '50px' }}
            />

            {/* Scrollable Content Container */}
            <div
              id="main-content-scroll"
              className="absolute inset-0 overflow-y-auto w-full h-full"
              style={{ zIndex: 2 }}
            >
              {/* Content padding to align with the grey card, plus top padding for Header */}
              <div className="pr-[6px] pt-[50px] min-h-full">
                <ScrollToTop>
                  <div className="w-full max-w-none py-30 pl-[6px] pr-0">
                    <Outlet />
                  </div>
                </ScrollToTop>
              </div>
            </div>

            {/* Top Header */}
            <Header />
          </div>
        </div>
      </div>
    </>
  );
};

export default FullLayout;
