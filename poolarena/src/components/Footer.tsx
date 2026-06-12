import { Divider, Space } from "antd";
import Link from "next/link";
import React from "react";
import Image from "next/image";
import { CiMail } from "react-icons/ci";
import { IoCallOutline} from "react-icons/io5";

export const Footer = () => {
  return (
    <footer className="bg-[#172339] text-white w-full min-h-[340px]">
      <div className="max-w-[1360px] mx-auto pt-[48px] pb-[48px] px-4 2xl:px-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-[48px]">
          {/* Logo Section */}
          <div className="relative w-full max-w-[240px] h-16 -mt-[20px]">
            <Image
              src="/images/logo.png"
              alt="Pool Arena Logo"
              fill
              unoptimized
              sizes="240px"
              className="object-contain object-left"
              priority
            />
          </div>

          {/* Menu Section */}
          <div>
            <div className="text-white font-semibold text-base mb-4">Poolarena.vn</div>
            <Space direction="vertical" size="small">
              <Link href="/about" className="!text-gray-300 hover:!text-white">
                Về chúng tôi
              </Link>
              <Link
                href="/introduction"
                className="!text-gray-300 hover:!text-white"
              >
                Poolarena là gì?
              </Link>
            </Space>
          </div>

          {/* Cooperation Section */}
          <div>
            <div className="text-white font-semibold text-base mb-4">Hợp tác</div>
            <Space direction="vertical" size="small">
              <Link href="/contact-cooperation" className="!text-gray-300 hover:!text-white">
                Liên hệ hợp tác
              </Link>
              <Link href="/for-clubs" className="!text-gray-300 hover:!text-white">
                Dành cho câu lạc bộ
              </Link>
              <Link
                href="/for-organizers"
                className="!text-gray-300 hover:!text-white"
              >
                Dành cho đơn vị tổ chức giải
              </Link>
            </Space>
          </div>

          <div>
            <div className="text-white font-semibold text-base mb-4">
              Điều khoản pháp lý
            </div>
            <Space direction="vertical" size="small">
              <Link href="/terms" className="!text-gray-300 hover:!text-white">
                Điều khoản & Điều kiện
              </Link>
              <Link href="/privacy" className="!text-gray-300 hover:!text-white">
                Chính sách bảo mật
              </Link>
              <Link href="/cookies" className="!text-gray-300 hover:!text-white">
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
                <CiMail className="text-white text-base" />
                <span>poolarena.vn@gmail.com</span>
              </div>
              <div className="text-white text-base">
              Ô 102, Tháp Tây, Chung cư Học viện Quốc Phòng, Đ. Võ Chí Công, Xuân La, Tây Hồ, Hà Nội, Vietnam
              </div>
              
            </Space>
            
          </div>
        </div>

        <Divider className="border-gray-700 my-6" />

        <div className="text-center">
          <div className="text-gray-400 text-sm">
            © 2025 poolarena platform. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};
