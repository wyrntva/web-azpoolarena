"use client";

import React from "react";
import NavBar from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { FaFacebook, FaTiktok } from "react-icons/fa6";
import { IoCallOutline, IoMailOutline, IoLocationOutline } from "react-icons/io5";

export default function InfoPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col" style={{ fontFamily: 'Montserrat, sans-serif' }}>
      {/* Header */}
      <NavBar />

      {/* Hero Banner Section */}
      <div className="relative h-[200px] sm:h-[300px] md:h-[400px] w-full bg-[url('/images/info_banner.webp')] bg-cover bg-center overflow-hidden" />
      <div className="h-[4px] w-full bg-brand-secondary" />

      {/* Main Content Area (Overlapping the banner) */}
      <div className="flex-1 max-w-[1360px] mx-auto px-4 sm:px-6 md:px-8 xl:px-12 2xl:px-0 w-full relative z-10 -mt-12 sm:-mt-20 md:-mt-[126px] pb-16">
        <div className="w-full flex flex-col gap-[12px]">
          
          {/* Card 1: ABOUT */}
          <div className="bg-white rounded-[16px] lg:rounded-3xl shadow-sm w-full relative pt-0 pb-8 pr-8 pl-4 md:pb-10 md:pr-10 md:pl-4 transition-all hover:shadow-[0_12px_30px_rgba(0,0,0,0.05)]">
            {/* Rounded-bottom Header Tab (matching Rankings page) */}
            <div className="flex justify-center mb-8">
              <div className="bg-brand-secondary text-white w-full max-w-[313px] xl:max-w-[648px] xl:w-[648px] h-[56px] flex items-center justify-center rounded-b-[24px] xl:rounded-t-none xl:rounded-b-[32px] shadow-md z-20">
                <h2 
                  className="text-base sm:text-xl xl:text-[24px] xl:leading-[32px] font-bold uppercase tracking-wide m-0"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  GIỚI THIỆU
                </h2>
              </div>
            </div>
            
            <div className="text-text-primary text-[16px] leading-relaxed space-y-4">
              <p>
                <strong>POOLARENA<span className="text-brand-primary">.</span>VN</strong> tự hào là hệ thống thi đấu bida chuyên nghiệp hàng đầu Việt Nam, nơi quy tụ và nâng tầm các giải đấu theo tiêu chuẩn quốc tế. Chúng tôi kiến tạo một hệ sinh thái thể thao đột phá, mang đến cho các cơ thủ và người hâm mộ những trải nghiệm đỉnh cao chưa từng có. Đặc biệt, nhằm tối ưu hóa tính minh bạch và hiện đại hóa trải nghiệm, hệ thống của <strong>POOLARENA<span className="text-brand-primary">.</span>VN</strong> sẽ không sử dụng cách phân cấp truyền thống theo các hạng G, H, I cũ, mà thay vào đó là bộ tiêu chuẩn LEVEL từ Level 1 đến Level 10 (MASTER), giúp đánh giá chính xác và công bằng nhất năng lực thực tế của từng cơ thủ.
              </p>
              <p>
                Hãy truy cập <a href="https://poolarena.vn" target="_blank" rel="noopener noreferrer" className="text-brand-primary font-semibold hover:underline">poolarena.vn</a> để theo dõi các trận đấu, cập nhật tỉ số real-time của các giải đấu, đồng thời tra cứu bảng xếp hạng, thành tích cá nhân và phong độ của các cơ thủ.
              </p>
            </div>
          </div>

          {/* Card 4: BAREM HẠNG */}
          <div className="bg-white rounded-[16px] lg:rounded-3xl shadow-sm w-full relative pt-0 pb-8 pr-8 pl-4 md:pb-10 md:pr-10 md:pl-4 transition-all hover:shadow-[0_12px_30px_rgba(0,0,0,0.05)]">
            {/* Rounded-bottom Header Tab */}
            <div className="flex justify-center mb-8">
              <div className="bg-brand-secondary text-white w-full max-w-[313px] xl:max-w-[648px] xl:w-[648px] min-h-[56px] py-2 sm:py-0 sm:h-[56px] flex items-center justify-center rounded-b-[24px] xl:rounded-t-none xl:rounded-b-[32px] shadow-md z-20">
                <h2 
                  className="text-base sm:text-xl xl:text-[24px] xl:leading-[32px] font-bold uppercase tracking-wide m-0 text-center px-4"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  <span className="block sm:inline">BAREM XẾP HẠNG LEVEL</span>
                  <span className="hidden sm:inline"> - </span>
                  <span className="block sm:inline">POOLARENA.VN</span>
                </h2>
              </div>
            </div>

            {/* Rank tiers */}
            <div className="space-y-6 text-text-primary text-[16px] leading-relaxed">
              
              {/* Hạng I */}
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-[80px] text-center">
                  <span className="text-[28px] font-bold italic text-brand-secondary">Lv .1</span>
                </div>
                <div>
                  <p>
                    <strong>Level 1</strong> dành chỉ dành cho cơ thủ nữ (Hoặc những cơ thủ nam thực sự yếu đã rớt từ Level 2 xuống). Tuy nhiên nếu cơ thủ nữ đã đánh tốt như barem Level 4, Level 3, Level 2 thì vui lòng đăng kí đúng hạng
                  </p>
                </div>
              </div>

              <hr className="border-gray-200" />

              {/* Hạng H */}
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-[80px] text-center">
                  <span className="text-[28px] font-bold italic text-brand-secondary">Lv .2</span>
                </div>
                <div className="space-y-2">
                  <p>
                    <strong>Level 2</strong> dành cho cơ thủ đang tập chơi, đi được từ 1 đến tối đa 4 bóng (<strong className="text-brand-primary">KHÔNG THỂ</strong> ĐI ĐƯỢC CHẤM, kể cả <strong className="text-brand-primary">RÙA</strong> hay <strong className="text-brand-primary">HÌNH BI ĐẸP</strong>)
                  </p>
                  <p>Có thể ăn từ 3 đến 5 bóng trong trường hợp 1 - 2 bóng nằm cửa lỗ, tuy nhiên tính ổn định không được cao.</p>
                  <p>Biết sử dụng các kĩ thuật cơ bản nhưng chưa thành thạo.</p>
                  <p><strong className="text-brand-primary">LƯU Ý:</strong> Level 2 của <strong>POOLARENA<span className="text-brand-primary">.</span>VN</strong> phù hợp với những bạn đã đánh giải hạng I, hạng K ở giải ngoài, nhưng chưa được giải. Nếu có tư duy nên đánh Level 3 cho thoát tay.</p>
                </div>
              </div>

              <hr className="border-gray-200" />

              {/* Hạng G */}
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-[80px] text-center">
                  <span className="text-[28px] font-bold italic text-brand-secondary">Lv .3</span>
                </div>
                <div className="space-y-2">
                  <p>
                    <strong>Level 3</strong> dành cho cơ thủ đã chơi được một thời gian, đi được từ 3 đến 5 bóng (<strong className="text-brand-primary">CÓ THỂ</strong> ĐI ĐƯỢC CHẤM, <strong className="text-brand-primary">1 CHẤM TRÊN 10 GAME ĐẤU</strong>)
                  </p>
                  <p>Chỉ đi được tối đa 2 lần 6-7 bóng trong 1 game đấu (Trường hợp quá 2 lần giải hình nếu bị toàn cửa lỗ ban tổ chức sẽ check camera xem xét)</p>
                  <p>Đã có tư duy hình và chạy đạn, sử dụng đầu cơ cơ bản, có tư duy và góc ra tốt hơn H, chưa có tư duy giải hình.</p>
                  <p>4 bóng có thể xử lý tốt, tuy nhiên tính ổn định chưa cao (Không nhận H+ hoặc G ở giải ngoài)</p>
                  <p><strong className="text-brand-primary">LƯU Ý:</strong> Level 3 của <strong>POOLARENA<span className="text-brand-primary">.</span>VN</strong> phù hợp với những bạn đã vô địch giải hạng HIK ở ngoài, đã có thành tích đánh giải.</p>
                </div>
              </div>

              <hr className="border-gray-200" />

              {/* Hạng F */}
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-[80px] text-center">
                  <span className="text-[28px] font-bold italic text-brand-secondary">Lv .4</span>
                </div>
                <div className="space-y-2">
                  <p>
                    <strong>Level 4</strong> dành cho cơ thủ đã tốt, đi hình từ 4 đến 6 bóng, sử dụng đầu cơ và áp phê thành thạo, góc ra con bi rõ ràng, ít sót những con bi cơ bản (<strong className="text-brand-primary">CÓ THỂ</strong> ĐI CHẤM, <strong className="text-brand-primary">KHÔNG THỂ</strong> ĐI 2 CHẤM THÔNG), tuy nhiên có thể đi 1 chấm phá và 1 chấm đơn.
                  </p>
                  <p>Riêng Level 4, <strong>POOLARENA<span className="text-brand-primary">.</span>VN</strong> chỉ nhận cơ thủ đã qua kiểm định, đã được lên Level 4 từ Level 3 trong hệ thống tính điểm của team.</p>
                  <p><strong className="text-brand-primary">LƯU Ý:</strong> Level 4 của <strong>POOLARENA<span className="text-brand-primary">.</span>VN</strong> không phù hợp với những bạn hạng cao, chuyên đi săn giải. Bên mình có hệ thống tính điểm để lên level. Nếu bạn có ý định bíp level bên mình sẽ ban bạn khỏi hệ thống giải bên mình.</p>
                </div>
              </div>

              <hr className="border-gray-200" />

              {/* Level 5 */}
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-[80px] text-center">
                  <span className="text-[28px] font-bold italic text-brand-secondary">Lv .5</span>
                </div>
                <div className="space-y-2">
                  <p>
                    <strong>Level 5</strong> dành cho cơ thủ trình độ khá - giỏi, có khả năng đi hình tốt từ 6 đến 9 bóng. Về quy định, <strong>POOLARENA<span className="text-brand-primary">.</span>VN</strong> chỉ nhận cơ thủ thăng hạng từ hệ thống tính điểm nội bộ hoặc được BTC kiểm định.
                  </p>
                  <p><strong className="text-brand-primary">LƯU Ý:</strong> Level 5 của <strong>POOLARENA<span className="text-brand-primary">.</span>VN</strong> không phù hợp với những bạn hạng cao, chuyên đi săn giải. Bên mình có hệ thống tính điểm để lên level. Nếu bạn có ý định bíp level bên mình sẽ ban bạn khỏi hệ thống giải bên mình.</p>
                </div>
              </div>

              <hr className="border-gray-200" />

              {/* Lưu ý chung */}
              <div className="pl-[66px]">
                <p>
                  <strong className="text-brand-primary">LƯU Ý:</strong> Barem phân level chỉ là hình thức tham khảo. Để có một sân chơi công bằng, mọi người có thể đăng kí lên 1 level để đánh cho thoát tay. Nếu mọi người đánh đúng barem nhưng ban tổ chức nghi ngờ bíp level thì vẫn có thể bị ban.
                </p>
                <p>
                  <a href="https://poolarena.vn" target="_blank" rel="noopener noreferrer" className="text-brand-primary font-semibold hover:underline">Poolarena.vn</a> hy vọng sẽ là một sân chơi công bằng dành cho tất cả mọi người.
                </p>
              </div>
            </div>
          </div>

          {/* Card 5: QUY TẮC ĐIỂM */}
          <div className="bg-white rounded-[16px] lg:rounded-3xl shadow-sm w-full relative pt-0 pb-8 pr-8 pl-4 md:pb-10 md:pr-10 md:pl-4 transition-all hover:shadow-[0_12px_30px_rgba(0,0,0,0.05)]">
            {/* Rounded-bottom Header Tab */}
            <div className="flex justify-center mb-8">
              <div className="bg-brand-secondary text-white w-full max-w-[313px] xl:max-w-[648px] xl:w-[648px] min-h-[56px] py-2 sm:py-0 sm:h-[56px] flex items-center justify-center rounded-b-[24px] xl:rounded-t-none xl:rounded-b-[32px] shadow-md z-20">
                <h2 
                  className="text-base sm:text-xl xl:text-[24px] xl:leading-[32px] font-bold uppercase tracking-wide m-0 text-center px-4"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  QUY TẮC TÍNH ĐIỂM
                </h2>
              </div>
            </div>

            <div className="px-2 sm:px-6">
              {/* Table Container */}
              <div className="overflow-x-auto w-full border border-gray-100 rounded-2xl shadow-sm">
                <table className="w-full text-left border-collapse" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  <thead>
                    <tr className="bg-gray-50/70 border-b border-gray-100 text-text-tertiary font-bold text-xs uppercase tracking-wider">
                      <th className="py-4 px-6 text-center font-bold">Chênh lệch</th>
                      <th className="py-4 px-6 text-center font-bold">Thắng (Cửa trên)</th>
                      <th className="py-4 px-6 text-center font-bold">Thắng (Cửa dưới)</th>
                      <th className="py-4 px-6 text-center font-bold">Thua (Cửa trên)</th>
                      <th className="py-4 px-6 text-center font-bold">Thua (Cửa dưới)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-text-primary text-sm">
                    <tr className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6 text-center font-bold text-text-secondary"># 0</td>
                      <td className="py-4 px-6 text-center font-bold text-base text-emerald-500">15</td>
                      <td className="py-4 px-6 text-center font-bold text-base text-emerald-500">15</td>
                      <td className="py-4 px-6 text-center font-bold text-base text-red-500">-15</td>
                      <td className="py-4 px-6 text-center font-bold text-base text-red-500">-15</td>
                    </tr>
                    <tr className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6 text-center font-bold text-text-secondary"># 1</td>
                      <td className="py-4 px-6 text-center font-bold text-base text-emerald-500">10</td>
                      <td className="py-4 px-6 text-center font-bold text-base text-emerald-500">25</td>
                      <td className="py-4 px-6 text-center font-bold text-base text-red-500">-25</td>
                      <td className="py-4 px-6 text-center font-bold text-base text-red-500">-10</td>
                    </tr>
                    <tr className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6 text-center font-bold text-text-secondary"># 2</td>
                      <td className="py-4 px-6 text-center font-bold text-base text-emerald-500">5</td>
                      <td className="py-4 px-6 text-center font-bold text-base text-emerald-500">30</td>
                      <td className="py-4 px-6 text-center font-bold text-base text-red-500">-30</td>
                      <td className="py-4 px-6 text-center font-bold text-base text-red-500">-5</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              {/* Lưu ý Quy tắc tính điểm */}
              <div className="mt-6 text-text-primary text-[15px] leading-relaxed">
                <p>
                  <strong className="text-brand-primary">LƯU Ý:</strong> Quy tắc tính điểm trên chỉ áp dụng cho <strong>VÒNG LOẠI</strong>. Đối với <strong>VÒNG LOẠI TRỰC TIẾP</strong>, hệ thống sẽ áp dụng quy tắc nhân hệ số điểm tùy theo quy mô từng giải đấu (16, 24, 32... cơ thủ). Cụ thể, người thua cuộc vẫn nhận điểm theo quy tắc thông thường, trong khi người thắng cuộc sẽ được nhân điểm theo hệ số tương ứng của vòng đấu đó; càng vào sâu các vòng trong như Vòng 1/8, Tứ Kết, Bán Kết và Chung Kết, hệ số điểm thưởng sẽ càng tăng cao. Quy tắc này được đặt ra nhằm đảm bảo tính công bằng tuyệt đối cho hệ thống xếp hạng, giúp phản ánh chính xác phong độ thực tế khi những cơ thủ xuất sắc có bản lĩnh lọt vào sâu trong giải chắc chắn phải được cộng nhiều điểm hơn so với những người dừng bước sớm.
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: NEWS & SOCIAL */}
          <div className="bg-white rounded-[16px] lg:rounded-3xl shadow-sm w-full relative pt-0 pb-8 pr-8 pl-4 md:pb-10 md:pr-10 md:pl-4 transition-all hover:shadow-[0_12px_30px_rgba(0,0,0,0.05)]">
            {/* Rounded-bottom Header Tab (matching Rankings page) */}
            <div className="flex justify-center mb-8">
              <div className="bg-brand-secondary text-white w-full max-w-[313px] xl:max-w-[648px] xl:w-[648px] h-[56px] flex items-center justify-center rounded-b-[24px] xl:rounded-t-none xl:rounded-b-[32px] shadow-md z-20">
                <h2 
                  className="text-base sm:text-xl xl:text-[24px] xl:leading-[32px] font-bold uppercase tracking-wide m-0"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  MẠNG XÃ HỘI & TIN TỨC
                </h2>
              </div>
            </div>

            {/* Clean list with icons, aligned left but centered group */}
            <div className="space-y-1">
              <a 
                href="https://poolarena.vn" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-4 text-brand-secondary py-0.5"
              >
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[18px] h-[18px] flex-shrink-0 text-brand-secondary">
                  <path d="M15.3222 10.383C15.3796 10.9457 15.4125 11.4903 15.4125 12C15.4125 12.9541 15.2972 14.0315 15.1208 15.1208C14.0315 15.2972 12.9541 15.4125 12 15.4125C11.0502 15.4125 9.97313 15.2975 8.87911 15.1205C8.70281 14.0312 8.5875 12.954 8.5875 12C8.5875 11.4905 8.62039 10.9458 8.67789 10.383C9.82608 10.5668 10.9715 10.6875 12 10.6875C13.0286 10.6875 14.174 10.5668 15.3222 10.383Z" fill="currentColor"/>
                  <path d="M16.8752 10.0994C16.9462 10.7579 16.9875 11.399 16.9875 12C16.9875 12.8769 16.8997 13.8389 16.7599 14.8153C18.7425 14.4016 20.575 13.8731 21.5567 13.5722C21.8739 13.475 21.9986 13.4363 22.1658 13.3694C22.2494 13.336 22.326 13.302 22.4259 13.2543C22.4748 12.843 22.5 12.4244 22.5 12C22.5 10.878 22.324 9.79714 21.9982 8.78346L21.9133 8.81017C20.8868 9.12245 18.9652 9.6745 16.8752 10.0994Z" fill="currentColor"/>
                  <path d="M21.4017 7.31948C20.3698 7.63221 18.579 8.14039 16.6599 8.53603C16.2178 5.84926 15.443 3.16951 15.0702 1.95598C17.8422 2.80227 20.1273 4.76467 21.4017 7.31948Z" fill="currentColor"/>
                  <path d="M15.1117 8.82229C14.0253 8.99781 12.9513 9.1125 12 9.1125C11.0487 9.1125 9.97477 8.99781 8.88843 8.8223C9.30471 6.28005 10.0478 3.68306 10.4278 2.44333C10.525 2.12606 10.5637 2.00144 10.6306 1.83418C10.664 1.75062 10.698 1.67398 10.7457 1.57414C11.157 1.52518 11.5756 1.5 12 1.5C12.4434 1.5 12.8803 1.52748 13.3093 1.58083C13.3184 1.61564 13.3268 1.64679 13.3351 1.67626C13.3597 1.76333 13.3982 1.8857 13.4628 2.09104L13.4696 2.11261C13.7935 3.14223 14.6519 6.01401 15.1117 8.82229Z" fill="currentColor"/>
                  <path d="M7.34004 8.536C7.7801 5.86107 8.54986 3.19576 8.92192 1.98181L8.92983 1.95597C6.15777 2.80225 3.8727 4.76465 2.59835 7.31946C3.63018 7.63219 5.42095 8.14036 7.34004 8.536Z" fill="currentColor"/>
                  <path d="M2.00184 8.78345C1.67598 9.79714 1.5 10.878 1.5 12C1.5 12.4389 1.52693 12.8715 1.57923 13.2963L1.74471 13.3515L1.74879 13.3528C1.80205 13.3705 3.36305 13.886 5.41878 14.3975C5.99886 14.5418 6.61307 14.6844 7.24006 14.8151C7.10025 13.8388 7.0125 12.8769 7.0125 12C7.0125 11.3988 7.05374 10.7577 7.12472 10.0994C5.03428 9.67436 3.11218 9.12212 2.08597 8.80989L2.00184 8.78345Z" fill="currentColor"/>
                  <path d="M12 16.9875C12.8769 16.9875 13.8389 16.8997 14.8153 16.7599C14.4016 18.7425 13.8731 20.575 13.5722 21.5566C13.475 21.8739 13.4363 21.9985 13.3694 22.1658C13.336 22.2494 13.302 22.326 13.2543 22.4259C12.843 22.4748 12.4244 22.5 12 22.5C11.5756 22.5 11.157 22.4748 10.7457 22.4259C10.698 22.326 10.664 22.2494 10.6306 22.1658C10.5637 21.9986 10.525 21.8739 10.4278 21.5567C10.1269 20.5751 9.59846 18.7427 9.18478 16.7603C10.1579 16.8996 11.1201 16.9875 12 16.9875Z" fill="currentColor"/>
                  <path d="M5.0385 15.9259C3.73853 15.6024 2.63135 15.2775 1.95597 15.0702C2.97258 18.4002 5.59982 21.0274 8.92983 22.044L8.92192 22.0182C8.59705 20.9582 7.96897 18.7917 7.52191 16.4784C6.6525 16.3103 5.80722 16.1171 5.0385 15.9259Z" fill="currentColor"/>
                  <path d="M22.0182 15.0781C20.9582 15.403 18.7915 16.0311 16.4781 16.4781C16.0311 18.7915 15.403 20.9581 15.0781 22.0182L15.0702 22.044C18.4002 21.0274 21.0274 18.4002 22.044 15.0702L22.0182 15.0781Z" fill="currentColor"/>
                </svg>
                <span className="font-medium text-[16px]">poolarena.vn</span>
              </a>

              <a 
                href="https://www.facebook.com/azpoolarena" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-4 text-brand-secondary py-0.5"
              >
                <FaFacebook className="text-[18px] text-brand-secondary" />
                <span className="font-medium text-[16px]">@azpoolarena</span>
              </a>

              <a 
                href="https://www.facebook.com/aztournament" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-4 text-brand-secondary py-0.5"
              >
                <FaFacebook className="text-[18px] text-brand-secondary" />
                <span className="font-medium text-[16px]">@aztournament</span>
              </a>

              <a 
                href="https://www.facebook.com/poolarenavn" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-4 text-brand-secondary py-0.5"
              >
                <FaFacebook className="text-[18px] text-brand-secondary" />
                <span className="font-medium text-[16px]">@poolarenavn</span>
              </a>

              <a 
                href="https://www.tiktok.com/@az.pool.arena" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-4 text-brand-secondary py-0.5"
              >
                <FaTiktok className="text-[18px] text-brand-secondary" />
                <span className="font-medium text-[16px]">@az.pool.arena</span>
              </a>

              <a 
                href="https://www.tiktok.com/@az.tournament" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-4 text-brand-secondary py-0.5"
              >
                <FaTiktok className="text-[18px] text-brand-secondary" />
                <span className="font-medium text-[16px]">@az.tournament</span>
              </a>

              <a 
                href="https://www.tiktok.com/@poolarena.vn" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-4 text-brand-secondary py-0.5"
              >
                <FaTiktok className="text-[18px] text-brand-secondary" />
                <span className="font-medium text-[16px]">@poolarena.vn</span>
              </a>
            </div>
          </div>

          {/* Card 3: CONTACT INFO */}
          <div className="bg-white rounded-[16px] lg:rounded-3xl shadow-sm w-full relative pt-0 pb-8 pr-8 pl-4 md:pb-10 md:pr-10 md:pl-4 transition-all hover:shadow-[0_12px_30px_rgba(0,0,0,0.05)]">
            {/* Rounded-bottom Header Tab (matching Rankings page) */}
            <div className="flex justify-center mb-8">
              <div className="bg-brand-secondary text-white w-full max-w-[313px] xl:max-w-[648px] xl:w-[648px] h-[56px] flex items-center justify-center rounded-b-[24px] xl:rounded-t-none xl:rounded-b-[32px] shadow-md z-20">
                <h2 
                  className="text-base sm:text-xl xl:text-[24px] xl:leading-[32px] font-bold uppercase tracking-wide m-0"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  THÔNG TIN LIÊN HỆ
                </h2>
              </div>
            </div>

            {/* Clean list with icons, aligned left but centered group */}
            <div className="space-y-1">
              <div className="flex items-center space-x-4 text-brand-secondary py-0.5">
                <IoCallOutline className="text-[18px] text-brand-secondary flex-shrink-0" />
                <span className="font-medium text-[16px]">0364756638</span>
              </div>

              <div className="flex items-center space-x-4 text-brand-secondary py-0.5">
                <IoMailOutline className="text-[18px] text-brand-secondary flex-shrink-0" />
                <span className="font-medium text-[16px]">poolarena.vn@gmail.com</span>
              </div>

              <div className="flex items-start space-x-4 text-brand-secondary py-0.5">
                <IoLocationOutline className="text-[18px] text-brand-secondary flex-shrink-0 mt-0.5" />
                <span className="font-medium text-[16px] leading-relaxed">
                  Ô 102, Tháp Tây, Chung cư Học viện Quốc Phòng, Đ. Võ Chí Công, Xuân La, Tây Hồ, Hà Nội, Vietnam
                </span>
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
