"use client";

import React from "react";
import NavBar from "@/components/NavBar";
import { Footer } from "@/components/Footer";

export default function PrivacyPolicyPage() {
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
          
          {/* Card: PRIVACY POLICY */}
          <div className="bg-white rounded-[16px] lg:rounded-3xl shadow-sm w-full relative pt-0 pb-8 pr-8 pl-4 md:pb-10 md:pr-10 md:pl-4 transition-all hover:shadow-[0_12px_30px_rgba(0,0,0,0.05)]">
            {/* Rounded-bottom Header Tab */}
            <div className="flex justify-center mb-8">
              <div className="bg-[#172339] text-white w-full max-w-[313px] xl:max-w-[648px] xl:w-[648px] h-[56px] flex items-center justify-center rounded-b-[24px] xl:rounded-t-none xl:rounded-b-[32px] shadow-md z-20">
                <h2 
                  className="text-base sm:text-xl xl:text-[24px] xl:leading-[32px] font-bold uppercase tracking-wide m-0"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  CHÍNH SÁCH BẢO MẬT
                </h2>
              </div>
            </div>
            
            <div className="text-gray-600 text-[16px] leading-relaxed space-y-6">
              
              <p className="text-gray-700 font-medium">
                <strong>POOLARENA.VN</strong> cam kết bảo vệ quyền riêng tư và thông tin cá nhân của bạn. Chính sách bảo mật này giải thích cách chúng tôi thu thập, sử dụng và bảo vệ thông tin khi bạn đăng ký tham gia giải đấu hoặc tương tác trên website của chúng tôi.
              </p>

              <hr className="border-gray-200" />

              {/* Section 1 */}
              <div>
                <h3 className="text-lg font-bold text-[#172339] mb-3">1. Thông tin chúng tôi thu thập</h3>
                <p className="mb-2">Khi bạn đăng ký giải đấu qua website, chúng tôi có thể thu thập các thông tin sau:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong className="text-gray-900 font-semibold">Thông tin cá nhân:</strong> Họ và tên, số điện thoại, địa chỉ email, ngày sinh (nếu giải đấu giới hạn độ tuổi).
                  </li>
                  <li>
                    <strong className="text-gray-900 font-semibold">Thông tin chuyên môn:</strong> Thứ hạng/Hạng cân thi đấu (nếu có), tên Câu lạc bộ/Đoàn thi đấu đại diện.
                  </li>
                  <li>
                    <strong className="text-gray-900 font-semibold">Thông tin thanh toán:</strong> Lịch sử giao dịch chuyển khoản lệ phí giải đấu (chúng tôi không lưu trữ thông tin số thẻ tín dụng hay mật khẩu ngân hàng của bạn).
                  </li>
                </ul>
              </div>

              <hr className="border-gray-200" />

              {/* Section 2 */}
              <div>
                <h3 className="text-lg font-bold text-[#172339] mb-3">2. Mục đích sử dụng thông tin</h3>
                <p className="mb-2">Chúng tôi sử dụng thông tin của bạn để:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong className="text-gray-900 font-semibold">Xử lý đơn đăng ký:</strong> Xử lý đơn đăng ký giải đấu, sắp xếp sơ đồ nhánh đấu và cập nhật lịch thi đấu.
                  </li>
                  <li>
                    <strong className="text-gray-900 font-semibold">Liên hệ gửi thông báo:</strong> Liên hệ gửi thông báo, cập nhật thông tin khẩn cấp liên quan đến giải đấu (qua SMS, Zalo hoặc Email).
                  </li>
                  <li>
                    <strong className="text-gray-900 font-semibold">Xác minh danh tính:</strong> Xác minh danh tính VĐV khi đến check-in trực tiếp tại CLB.
                  </li>
                  <li>
                    <strong className="text-gray-900 font-semibold">Phục vụ truyền thông:</strong> Phục vụ công tác truyền thông, vinh danh kết quả thi đấu trên website và các kênh mạng xã hội của CLB.
                  </li>
                </ul>
              </div>

              <hr className="border-gray-200" />

              {/* Section 3 */}
              <div>
                <h3 className="text-lg font-bold text-[#172339] mb-3">3. Chia sẻ và Bảo mật thông tin</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong className="text-gray-900 font-semibold">Bảo mật:</strong> Chúng tôi áp dụng các biện pháp an ninh mạng tiêu chuẩn để bảo vệ thông tin của bạn khỏi việc truy cập, thay đổi hoặc tiết lộ trái phép.
                  </li>
                  <li>
                    <strong className="text-gray-900 font-semibold">Chia sẻ thông tin:</strong> Chúng tôi tuyệt đối không bán, cho thuê hoặc chia sẻ thông tin cá nhân của bạn cho bên thứ ba vì mục đích thương mại. Thông tin chỉ được cung cấp cho Tổ trọng tài hoặc các đơn vị đồng tổ chức giải đấu nhằm mục đích vận hành giải.
                  </li>
                </ul>
              </div>

              <hr className="border-gray-200" />

              {/* Section 4 */}
              <div>
                <h3 className="text-lg font-bold text-[#172339] mb-3">4. Quyền của bạn</h3>
                <p>
                  Bạn có quyền yêu cầu chúng tôi kiểm tra, cập nhật, chỉnh sửa thông tin cá nhân hoặc yêu cầu xóa dữ liệu đăng ký (trước khi nhánh đấu được công bố) bằng cách liên hệ với bộ phận hỗ trợ của CLB qua Hotline hoặc Email được công bố trên website.
                </p>
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
