"use client";

import React from "react";
import NavBar from "@/components/NavBar";
import { Footer } from "@/components/Footer";

export default function TermsConditionsPage() {
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
          
          {/* Card: TERMS & CONDITIONS */}
          <div className="bg-white rounded-[16px] lg:rounded-3xl shadow-sm w-full relative pt-0 pb-8 pr-8 pl-4 md:pb-10 md:pr-10 md:pl-4 transition-all hover:shadow-[0_12px_30px_rgba(0,0,0,0.05)]">
            {/* Rounded-bottom Header Tab */}
            <div className="flex justify-center mb-8">
              <div className="bg-[#172339] text-white w-full max-w-[313px] xl:max-w-[648px] xl:w-[648px] h-[56px] flex items-center justify-center rounded-b-[24px] xl:rounded-t-none xl:rounded-b-[32px] shadow-md z-20">
                <h2 
                  className="text-base sm:text-xl xl:text-[24px] xl:leading-[32px] font-bold uppercase tracking-wide m-0"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  ĐIỀU KHOẢN & ĐIỀU KIỆN
                </h2>
              </div>
            </div>
            
            <div className="text-gray-600 text-[16px] leading-relaxed space-y-6">
              
              {/* Highlighted Warning Alert box */}
              <div className="bg-red-50 border-l-4 border-[#C6010B] p-4 rounded-r-lg">
                <p className="text-gray-900 font-semibold mb-1">LƯU Ý TRƯỚC KHI ĐĂNG KÝ:</p>
                <p className="text-gray-700">
                  Bằng việc truy cập website này, thực hiện thao tác đăng ký thi đấu trực tuyến hoặc mua vé tham dự, bạn mặc định đồng ý và chịu sự ràng buộc bởi các Điều khoản & Điều kiện dưới đây. Nếu bạn không đồng ý với bất kỳ điều khoản nào, vui lòng dừng việc đăng ký.
                </p>
              </div>

              {/* Section 1 */}
              <div>
                <h3 className="text-lg font-bold text-[#172339] mb-3">1. Quyền hạn của Ban Tổ Chức (BTC) Giải Đấu</h3>
                <p className="mb-2">BTC giải đấu thuộc CLB có toàn quyền:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong className="text-gray-900 font-semibold">Thay đổi lịch trình:</strong> Thực hiện các thay đổi cần thiết và hợp lý đối với thể thức thi đấu, sơ đồ nhánh đấu, thời gian khai mạc/thi đấu hoặc danh sách vận động viên (VĐV) để đảm bảo giải đấu diễn ra trôi chảy. Các thay đổi sẽ được cập nhật sớm nhất trên website/fanpage chính thức.
                  </li>
                  <li>
                    <strong className="text-gray-900 font-semibold">Hủy bỏ hoặc hoãn giải đấu:</strong> Có quyền hủy bỏ, tạm dừng hoặc dời lịch giải đấu do các nguyên nhân bất khả kháng (thiên tai, sự cố kỹ thuật, lệnh từ cơ quan chức năng...). Trong trường hợp giải đấu bị hủy hoàn toàn trước khi khởi tranh, BTC sẽ hoàn trả 100% lệ phí đăng ký giải (hoặc giá vé khán giả nếu có) qua hình thức chuyển khoản và không chịu thêm bất kỳ chi phí bồi thường nào khác.
                  </li>
                  <li>
                    <strong className="text-gray-900 font-semibold">Giới hạn số lượng:</strong> Giới hạn số lượng VĐV đăng ký tối đa thông qua hệ thống website và có quyền tự động đóng cổng đăng ký khi đã đủ số lượng, hoặc hủy các đơn đăng ký không hoàn tất đóng lệ phí đúng hạn.
                  </li>
                </ul>
              </div>

              <hr className="border-gray-200" />

              {/* Section 2 */}
              <div>
                <h3 className="text-lg font-bold text-[#172339] mb-3">2. Quy định và Quyền hạn tại Khu vực Thi đấu (Câu lạc bộ)</h3>
                <p className="mb-2">Quản lý CLB và BTC giải đấu có quyền:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong className="text-gray-900 font-semibold">Từ chối quyền tham gia/vào cửa:</strong> Từ chối cho vào cửa hoặc truất quyền thi đấu/mời ra khỏi CLB đối với bất kỳ cá nhân nào (VĐV hoặc khán giả) có hành vi không chuẩn mực, bao gồm: say xỉn, sử dụng chất kích thích, có hành vi/lời nói thô tục, xúc phạm VĐV khác hoặc trọng tài, cố tình phá hoại tài sản của CLB, hoặc từ chối tuân thủ kiểm tra an ninh của CLB. Trong các trường hợp này, BTC sẽ không hoàn trả lệ phí hay tiền vé.
                  </li>
                  <li>
                    <strong className="text-gray-900 font-semibold">Quy định trang phục thi đấu:</strong> Yêu cầu VĐV tuân thủ nghiêm ngặt quy định về trang phục (Ví dụ: áo có cổ, quần tây/quần jeans dài không rách, giày thể thao/giày tây; không mặc quần đùi, áo ba lỗ, đi dép lê). BTC có quyền không cho phép VĐV vào bàn thi đấu nếu trang phục không hợp lệ sau khi đã nhắc nhở.
                  </li>
                  <li>
                    <strong className="text-gray-900 font-semibold">Kiểm soát vật dụng mang vào:</strong> Nghiêm cấm mang đồ ăn, thức uống từ bên ngoài vào CLB (trừ trường hợp được BTC cho phép). Nghiêm cấm mang theo vũ khí, chất cháy nổ hoặc các vật dụng nguy hiểm vào khuôn viên CLB.
                  </li>
                </ul>
              </div>

              <hr className="border-gray-200" />

              {/* Section 3 */}
              <div>
                <h3 className="text-lg font-bold text-[#172339] mb-3">3. Lệ phí đăng ký, Vé vào cửa và Hoàn tiền</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong className="text-gray-900 font-semibold">Chính sách hoàn tiền:</strong> Lệ phí thi đấu (hoặc vé khán giả) được đăng ký qua website sẽ không được hoàn trả sau khi nhánh đấu đã được bốc thăm công bố hoặc giải đấu đã chính thức khởi tranh, trừ trường hợp giải đấu bị BTC hủy bỏ hoàn toàn.
                  </li>
                  <li>
                    <strong className="text-gray-900 font-semibold">Chuyển nhượng suất thi đấu:</strong> VĐV không được tự ý chuyển nhượng suất thi đấu của mình cho người khác sau khi cổng đăng ký trên website đã đóng hoặc sau khi đã bốc thăm chia nhánh, trừ khi có sự đồng ý bằng văn bản/email từ BTC trước thời hạn quy định.
                  </li>
                  <li>
                    <strong className="text-gray-900 font-semibold">Mất mát dữ liệu vé/thẻ:</strong> VĐV và khán giả có trách nhiệm tự bảo quản mã QR, mã đơn hàng hoặc thẻ VĐV được cấp qua website/email. BTC không chịu trách nhiệm nếu thông tin này bị lộ dẫn đến việc người khác sử dụng mất quyền lợi của bạn.
                  </li>
                </ul>
              </div>

              <hr className="border-gray-200" />

              {/* Section 4 */}
              <div>
                <h3 className="text-lg font-bold text-[#172339] mb-3">4. Quy định về Thi đấu và Giải quyết Khiếu nại</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong className="text-gray-900 font-semibold">Đúng giờ (Tác phong thi đấu):</strong> VĐV phải có mặt tại bàn thi đấu theo đúng khung giờ BTC đã thông báo trực tiếp hoặc cập nhật trên lịch thi đấu trực tuyến. Nếu quá thời gian quy định (ví dụ: trễ 5 phút xử thua 1 game; trễ 15 phút xử thua cả trận đấu), VĐV sẽ bị xử thua cuộc theo luật định.
                  </li>
                  <li>
                    <strong className="text-gray-900 font-semibold">Trọng tài và Luật thi đấu:</strong> Giải đấu được áp dụng theo luật Billiards hiện hành. Quyết định của Trọng tài tại bàn đấu là quyết định cuối cùng.
                  </li>
                  <li>
                    <strong className="text-gray-900 font-semibold">Khiếu nại:</strong> Nếu có bất kỳ khiếu nại nào về tình huống bóng, hành vi của đối thủ hoặc tình trạng bàn/bóng/cơ, VĐV phải thông báo ngay cho Trọng tài hoặc Giám sát trận đấu ngay tại thời điểm xảy ra sự việc. BTC sẽ không giải quyết bất kỳ khiếu nại nào sau khi trận đấu đã kết thúc và kết quả đã được ghi nhận vào hệ thống.
                  </li>
                </ul>
              </div>

              <hr className="border-gray-200" />

              {/* Section 5 */}
              <div>
                <h3 className="text-lg font-bold text-[#172339] mb-3">5. Bản quyền hình ảnh và Truyền thông</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong className="text-gray-900 font-semibold">Quay phim và Chụp ảnh:</strong> Bằng việc tham gia giải đấu (với tư cách VĐV hoặc khán giả), bạn đồng ý cho phép BTC, CLB và các đối tác truyền thông được quyền quay phim, chụp ảnh, phát sóng trực tiếp (livestream) hình ảnh của bạn trong khuôn viên giải đấu.
                  </li>
                  <li>
                    <strong className="text-gray-900 font-semibold">Sử dụng hình ảnh tư liệu:</strong> BTC có toàn quyền sử dụng các hình ảnh, video này cho mục đích lưu trữ, quảng bá giải đấu, truyền thông cho CLB và các nhà tài trợ trên các kênh mạng xã hội, website mà không phải trả bất kỳ chi phí bản quyền nào cho người xuất hiện trong ảnh/video.
                  </li>
                  <li>
                    <strong className="text-gray-900 font-semibold">Thiết bị ghi hình cá nhân:</strong> Khán giả và VĐV được phép quay phim bằng điện thoại cá nhân nhưng không được bật đèn flash, không được làm ảnh hưởng đến góc nhìn của VĐV đang thi đấu hoặc cản trở luồng livestream chính thức của BTC.
                  </li>
                </ul>
              </div>

              <hr className="border-gray-200" />

              {/* Section 6 */}
              <div>
                <h3 className="text-lg font-bold text-[#172339] mb-3">6. Trách nhiệm pháp lý và An toàn</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong className="text-gray-900 font-semibold">Bảo quản tài sản cá nhân:</strong> CLB và BTC không chịu trách nhiệm về việc mất mát, thất lạc hoặc hư hỏng đối với tài sản cá nhân của VĐV và khán giả (bao gồm bao cơ, gậy cơ cá nhân, điện thoại, ví tiền...) trong suốt thời gian diễn ra giải đấu.
                  </li>
                  <li>
                    <strong className="text-gray-900 font-semibold">An toàn sức khỏe:</strong> Tham gia giải đấu trên tinh thần tự nguyện. BTC không chịu trách nhiệm đối với các chấn thương cá nhân hoặc vấn đề sức khỏe phát sinh đột xuất của người tham gia trong quá trình diễn ra giải đấu tại CLB.
                  </li>
                  <li>
                    <strong className="text-gray-900 font-semibold">Ý thức bảo vệ tài sản:</strong> VĐV hoặc khán giả nếu cố tình làm hư hỏng cơ sở vật chất của CLB (ví dụ: làm rách nỉ bàn do hành vi phi thể thao, đập gãy cơ của CLB, làm hỏng băng bàn đấu...) phải có trách nhiệm bồi thường thiệt hại theo giá trị thực tế do CLB định giá.
                  </li>
                </ul>
              </div>

              <hr className="border-gray-200" />

              {/* Update Info and Signature */}
              <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center pt-2 gap-4 text-gray-500 text-sm">
                <span>Bản cập nhật mới nhất ngày: <strong>13/06/2026</strong></span>
                <span className="font-bold uppercase tracking-wider text-[#172339]">BAN TỔ CHỨC GIẢI ĐẤU</span>
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
