"use client";

import React, { useState, useEffect } from "react";
import { Typography } from "antd";

const { Text } = Typography;

interface CountdownTimerProps {
  targetDate: Date | null;  // Ngày đích để đếm ngược
  status?: string;  // Trạng thái giải đấu: 'upcoming' | 'ongoing' | 'completed' | 'finished'
}

const TimeItem = ({ value, label }: { value: number; label: string }) => (
  <div className="flex items-center gap-1">
    <span
      className="text-white italic"
      style={{
        fontFamily: 'Montserrat, sans-serif',
        fontSize: '20px',
        fontWeight: 700,
        lineHeight: '28px',
      }}
    >
      {value}
    </span>
    <span
      className="text-[#757E95]"
      style={{
        fontFamily: 'Montserrat, sans-serif',
        fontSize: '16px',
        fontWeight: 400,
        lineHeight: '24px',
      }}
    >
      {label}
    </span>
  </div>
);

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate, status }) => {
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!targetDate) {
      setExpired(false);
      setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();

      if (diff <= 0) {
        setExpired(true);
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setExpired(false);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  if (expired) {
    let statusText = "Giải đấu đã diễn ra";
    if (status === "ongoing") {
      statusText = "Giải đấu đang diễn ra";
    } else if (status === "completed" || status === "finished") {
      statusText = "Giải đấu đã kết thúc";
    }

    return (
      <div className="text-center">
        <span
          className="text-[#757E95]"
          style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '16px', fontWeight: 500, lineHeight: '24px' }}
        >
          {statusText}
        </span>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="flex justify-center gap-4">
        <TimeItem value={countdown.days} label="ngày" />
        <TimeItem value={countdown.hours} label="giờ" />
        <TimeItem value={countdown.minutes} label="phút" />
        <TimeItem value={countdown.seconds} label="giây" />
      </div>
    </div>
  );
};
