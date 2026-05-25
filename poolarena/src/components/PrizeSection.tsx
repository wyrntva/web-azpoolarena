import React from "react";
import { Typography, Button } from "antd";
import { CountdownTimer } from "./CountdownTimer";

const { Text } = Typography;

interface PrizeSectionProps {
  prizes: {
    total: string;
    first: string;
    second: string;
    contribution: string;
    top5_8?: string;
    top9_16?: string;
    top17_32?: string;
    top33_64?: string;
    top65_128?: string;
    top129_256?: string;
  };
  targetDate: Date | null;  // Ngày đích để đếm ngược
  onRegister: () => void;
  className?: string;
}

export const PrizeSection: React.FC<PrizeSectionProps> = ({
  prizes,
  targetDate,
  onRegister,
  className = "",
}) => {
  // Tạo mảng các giải thưởng để hiển thị, chỉ lấy những giải thưởng có giá trị
  const prizeItems = [
    { label: 'Tổng giải thưởng', value: prizes.total },
    { label: 'Vô địch', value: prizes.first },
    { label: 'Giải nhì', value: prizes.second },
    { label: 'Đồng giải ba', value: prizes.contribution },
    { label: 'Top 5-8', value: prizes.top5_8 },
    { label: 'Top 9-16', value: prizes.top9_16 },
    { label: 'Top 17-32', value: prizes.top17_32 },
    { label: 'Top 33-64', value: prizes.top33_64 },
    { label: 'Top 65-128', value: prizes.top65_128 },
    { label: 'Top 129-256', value: prizes.top129_256 },
  ].filter(item => item.value); // Chỉ lấy các giải thưởng có giá trị

  // Chia thành các hàng, mỗi hàng 4 giải thưởng
  const rows: Array<Array<{ label: string; value: string }>> = [];
  for (let i = 0; i < prizeItems.length; i += 4) {
    rows.push(prizeItems.slice(i, i + 4) as Array<{ label: string; value: string }>);
  }

  return (
    <div className={`bg-[#172339] rounded-[12px] pt-[16px] pb-[24px] text-white w-full ${className}`}>
      {/* Prize Information - Mỗi hàng 4 giải thưởng, tự động xuống hàng, không có div trống */}
      <div className="flex flex-col w-full px-[16px]">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-between w-full">
            {row.map((prize, colIndex) => (
              <div key={colIndex} className="w-[324px] h-[84px] px-[16px] py-[12px] flex flex-col gap-2">
                <div
                  className="text-[#BAE3FF]"
                  style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '16px', fontWeight: 500, lineHeight: '24px' }}
                >
                  {prize.label}
                </div>
                <div
                  className="text-white italic"
                  style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '20px', fontWeight: 700, lineHeight: '28px' }}
                >
                  {prize.value}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="flex flex-col mt-[28px] gap-2">
        {/* Countdown Timer */}
        <CountdownTimer targetDate={targetDate} />

        {/* Registration Button */}
        <div className="text-center">
          <Button
            className="!w-[398px] !h-[40px] !text-white !bg-[#C6010B] hover:!bg-[#8B0007] !border-none !rounded-full transition-all duration-300"
            style={{
              fontFamily: 'Montserrat, sans-serif',
              fontSize: '16px',
              fontStyle: 'normal',
              fontWeight: 500,
              lineHeight: '24px',
            }}
            onClick={onRegister}
          >
            Đăng ký ngay
          </Button>
        </div>
      </div>
    </div>
  );
};
