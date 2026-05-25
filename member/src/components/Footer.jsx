import { Divider, Space } from "antd";
import { Link } from "react-router-dom";
import LogoSection from "./LogoSection";
import { FaFacebookF } from "react-icons/fa6";
import { CiGlobe, CiMail } from "react-icons/ci";
import { IoCallOutline } from "react-icons/io5";

export default function Footer() {
  return (
    <footer className="bg-[#172339] text-white py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo Section */}
          <LogoSection />

          {/* Website Section */}
          <div>
            <div className="text-white font-semibold text-base mb-4">Website</div>
            <Space direction="vertical" size="small">
              <Link to="/tournaments" className="!text-gray-300 !hover:text-white block">
                Giải đấu
              </Link>
              <Link to="/ranking" className="!text-gray-300 !hover:text-white block">
                Thành viên
              </Link>
              <Link to="/software" className="!text-gray-300 !hover:text-white block">
                Phần mềm quản lý
              </Link>
            </Space>
          </div>

          <div>
            <div className="text-white font-semibold text-base mb-4">
              Social
            </div>
            <Space direction="vertical" size="small">
              <div className="flex items-center space-x-2">
                <FaFacebookF className="text-white text-xl" />
                <span>linkfacebook</span>
              </div>
              <div className="flex items-center space-x-2">
                <CiGlobe className="text-white text-xl" />
                <span>azstudio.com.vn</span>
              </div>
            </Space>
          </div>

          {/* Contact Section */}
          <div>
            <div className="text-white font-semibold text-base mb-4">
              Liên hệ
            </div>
            <Space direction="vertical" size="small">
              <div className="flex items-center space-x-2">
                <IoCallOutline className="text-white text-base" />
                <span>Liên hệ: 0912 222 555</span>
              </div>
              <div className="flex items-center space-x-2">
                <CiGlobe className="text-white text-base" />
                <span>Mail: cskh@poolarena.com.vn</span>
              </div>
              <div className="text-white text-base">
                Chung cư Học viện Quốc Phòng, Đ. Võ Chí Công, Xuân La, Tây Hồ, Hà Nội, Vietnam
              </div>
            </Space>
          </div>
        </div>


        <div className="text-center">
          <div className="text-gray-400 text-sm">
            © 2025 poolarena.platform. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
