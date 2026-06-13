"use client";

import React from "react";
import NavBar from "@/components/NavBar";
import { Footer } from "@/components/Footer";

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col" style={{ fontFamily: 'Montserrat, sans-serif' }}>
      {/* Header */}
      <NavBar />

      {/* Hero Banner Section */}
      <div className="relative h-[200px] sm:h-[300px] md:h-[400px] w-full bg-[url('/images/info_banner.png')] bg-cover bg-center overflow-hidden" />
      <div className="h-[4px] w-full bg-[#172339]" />

      {/* Main Content Area (Overlapping the banner) */}
      <div className="flex-1 max-w-[1360px] mx-auto px-4 sm:px-6 md:px-8 w-full relative z-10 -mt-12 sm:-mt-20 md:-mt-[126px] pb-16">
        <div className="w-full flex flex-col gap-[12px]">
          
          {/* Card: COOKIE POLICY */}
          <div className="bg-white rounded-[16px] lg:rounded-3xl shadow-sm w-full relative pt-0 pb-8 pr-8 pl-4 md:pb-10 md:pr-10 md:pl-4 transition-all hover:shadow-[0_12px_30px_rgba(0,0,0,0.05)]">
            {/* Rounded-bottom Header Tab */}
            <div className="flex justify-center mb-8">
              <div className="bg-[#172339] text-white w-full max-w-[313px] xl:max-w-[648px] xl:w-[648px] h-[56px] flex items-center justify-center rounded-b-[24px] xl:rounded-t-none xl:rounded-b-[32px] shadow-md z-20">
                <h2 
                  className="text-base sm:text-xl xl:text-[24px] xl:leading-[32px] font-bold uppercase tracking-wide m-0"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  CHÍNH SÁCH COOKIE
                </h2>
              </div>
            </div>
            
            <div className="text-gray-600 text-[16px] leading-relaxed space-y-6">
              
              <p className="text-gray-700 font-medium">
                <strong>POOLARENA.VN</strong> sử dụng cookie để mang lại trải nghiệm mượt mà, tiện lợi nhất cho bạn khi đăng ký giải đấu và tra cứu thông tin trực tuyến.
              </p>

              <hr className="border-gray-200" />

              {/* Section 1 */}
              <div>
                <h3 className="text-lg font-bold text-[#172339] mb-3">1. Cookie là gì?</h3>
                <p>
                  Cookie là các tệp văn bản nhỏ được lưu trữ trên máy tính hoặc thiết bị di động của bạn khi bạn truy cập vào website. Nó giúp website ghi nhớ các thao tác và tùy chọn của bạn trong một khoảng thời gian.
                </p>
              </div>

              <hr className="border-gray-200" />

              {/* Section 2 */}
              <div>
                <h3 className="text-lg font-bold text-[#172339] mb-3">2. Các loại Cookie chúng tôi sử dụng</h3>
                <ul className="list-disc pl-5 space-y-3">
                  <li>
                    <strong className="text-gray-900 font-semibold">Cookie thiết yếu (Strictly Necessary Cookies):</strong> Cần thiết để vận hành website. Ví dụ: Cookie giúp duy trì trạng thái đăng nhập của bạn khi bạn đang điền form đăng ký giải đấu, đảm bảo bạn không bị mất dữ liệu giữa các bước.
                  </li>
                  <li>
                    <strong className="text-gray-900 font-semibold">Cookie hiệu suất (Performance Cookies):</strong> Giúp chúng tôi phân tích cách người dùng tương tác với website (ví dụ: trang nào được xem nhiều nhất, hệ thống đăng ký có bị nghẽn không). Từ đó, chúng tôi tối ưu hóa giao diện trực quan và tốc độ tải trang cho hệ thống giải đấu.
                  </li>
                  <li>
                    <strong className="text-gray-900 font-semibold">Cookie tùy chọn (Functionality Cookies):</strong> Ghi nhớ các lựa chọn của bạn (như ngôn ngữ hoặc tùy chọn hiển thị bảng đấu) để bạn không phải thiết lập lại ở những lần truy cập sau.
                  </li>
                </ul>
              </div>

              <hr className="border-gray-200" />

              {/* Section 3 */}
              <div>
                <h3 className="text-lg font-bold text-[#172339] mb-3">3. Cách quản lý Cookie</h3>
                <p className="mb-3">
                  Bạn có toàn quyền chấp nhận hoặc từ chối cookie. Hầu hết các trình duyệt web (Chrome, Safari, Edge...) đều tự động chấp nhận cookie, nhưng bạn có thể thay đổi cài đặt trình duyệt của mình để từ chối cookie nếu muốn.
                </p>
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
                  <p className="text-amber-800 font-semibold mb-1">Lưu ý:</p>
                  <p className="text-amber-700">
                    Nếu bạn tắt cookie, một số tính năng tự động điền form hoặc lưu lịch sử tra cứu nhánh đấu trên website của chúng tôi có thể không hoạt động ổn định.
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
