import { Divider, Space } from "antd";
import { Link } from "react-router-dom";
import { CiGlobe } from "react-icons/ci";
import { IoCallOutline } from "react-icons/io5";

export default function Footer() {
  return (
    <footer className="bg-[#172339] text-white py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8">
          {/* Logo Section */}
          <div className="flex items-center justify-start mb-4 -mt-[20px]">
            <div className="relative w-full max-w-[240px] h-16">
              <img
                src="/images/logo.png"
                alt="Pool Arena Logo"
                className="w-full h-full object-contain object-left"
              />
            </div>
          </div>

          {/* Website Section */}
          <div>
            <div className="text-white font-semibold text-base mb-4">Poolarena.vn</div>
            <Space direction="vertical" size="small">
              <Link to="/about" className="!text-gray-300 !hover:text-white block">
                Về chúng tôi
              </Link>
              <Link to="/introduction" className="!text-gray-300 !hover:text-white block">
                Poolarena là gì?
              </Link>
            </Space>
          </div>

          {/* Cooperation Section */}
          <div>
            <div className="text-white font-semibold text-base mb-4">Hợp tác</div>
            <Space direction="vertical" size="small">
              <Link to="/contact-cooperation" className="!text-gray-300 !hover:text-white block">
                Liên hệ hợp tác
              </Link>
              <Link to="/for-clubs" className="!text-gray-300 !hover:text-white block">
                Dành cho câu lạc bộ
              </Link>
              <Link to="/for-organizers" className="!text-gray-300 !hover:text-white block">
                Dành cho đơn vị tổ chức giải
              </Link>
            </Space>
          </div>

          <div>
            <div className="text-white font-semibold text-base mb-4">
              Điều khoản pháp lý
            </div>
            <Space direction="vertical" size="small">
              <Link to="/terms" className="!text-gray-300 !hover:text-white block">
                Điều khoản & Điều kiện
              </Link>
              <Link to="/privacy" className="!text-gray-300 !hover:text-white block">
                Chính sách bảo mật
              </Link>
              <Link to="/cookies" className="!text-gray-300 !hover:text-white block">
                Chính sách cookie
              </Link>
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
                <span>0364756638</span>
              </div>
              <div className="flex items-center space-x-2">
                <CiGlobe className="text-white text-base" />
                <span>poolarena.vn@gmail.com</span>
              </div>
              <div className="text-white text-base">
                Ô 102, Tháp Tây, Chung cư Học viện Quốc Phòng, Đ. Võ Chí Công, Xuân La, Tây Hồ, Hà Nội, Vietnam
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
