"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { FaLock, FaTrophy, FaMedal, FaCrown } from "react-icons/fa";
import NavBar from "@/components/NavBar";

export default function AchievementsPage() {
  return (
    <div className="min-h-screen bg-[#F4F7FE] flex flex-col font-sans">
      <NavBar />
      
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 md:px-8 py-12 md:py-20 relative overflow-hidden">
        {/* Subtle decorative background circles */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-400/10 rounded-full blur-3xl -z-10" />

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="bg-white rounded-3xl shadow-[0_20px_50px_rgba(23,35,57,0.06)] border border-gray-100/80 w-full max-w-[600px] p-8 sm:p-12 text-center relative overflow-hidden flex flex-col items-center"
        >
          {/* Animated Locked Badge */}
          <div className="relative mb-8">
            <motion.div 
              animate={{ 
                scale: [1, 1.05, 1],
                rotate: [0, -3, 3, 0]
              }}
              transition={{ 
                duration: 6, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-[#172339] to-[#2b3e5e] flex items-center justify-center shadow-lg relative z-10"
            >
              <FaLock size={44} className="text-[#D22E39] drop-shadow-[0_2px_8px_rgba(210,46,57,0.4)]" />
            </motion.div>
            
            {/* Glowing rings */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 sm:w-36 sm:h-36 bg-red-500/10 rounded-full blur-xl -z-10 animate-pulse" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 sm:w-48 sm:h-48 bg-blue-500/5 rounded-full blur-2xl -z-20" />
          </div>

          {/* Section Badges */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-50 text-red-600 font-bold text-xs sm:text-sm tracking-[0.28px] uppercase mb-4 shadow-sm border border-red-100">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            Tính năng tạm khóa
          </div>

          {/* Typography Header */}
          <h1 
            className="text-3xl sm:text-4xl font-extrabold text-[#172339] tracking-tight uppercase mb-4"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            THÀNH TÍCH
          </h1>

          {/* Description */}
          <p className="text-gray-500 text-sm sm:text-base leading-relaxed max-w-md mb-8">
            Hệ thống vinh danh danh hiệu, chuỗi thắng và kỷ lục của các cơ thủ đang được nâng cấp để đồng bộ chính xác dữ liệu từ đấu trường Pool Arena.
          </p>

          {/* Feature Checklist */}
          <div className="w-full bg-[#F8F9FA] rounded-2xl p-6 mb-8 text-left border border-gray-100 flex flex-col gap-4">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
              Trạng thái nâng cấp hệ thống
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3 text-[#37393E] font-medium">
                <FaTrophy className="text-yellow-500" size={16} />
                <span>Hệ thống Cúp & Danh hiệu</span>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 font-semibold border border-emerald-100">Đã sẵn sàng</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3 text-[#37393E] font-medium">
                <FaMedal className="text-blue-500" size={16} />
                <span>Chuỗi thắng & Kỷ lục cá nhân</span>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-orange-50 text-orange-600 font-semibold border border-orange-100 flex items-center gap-1 animate-pulse">
                Đang đồng bộ...
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3 text-[#37393E] font-medium">
                <FaCrown className="text-purple-500" size={16} />
                <span>Quà tặng vinh danh độc quyền</span>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 font-semibold border border-gray-200">Đang thiết lập</span>
            </div>
          </div>

          {/* Navigation Action Button */}
          <Link
            href="/tournaments"
            className="w-full sm:w-auto bg-[#D22E39] hover:bg-[#b5242e] text-white font-bold text-[16px] leading-[24px] px-8 py-3.5 rounded-xl shadow-lg shadow-red-600/20 hover:shadow-red-600/30 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Quay lại Giải đấu
          </Link>
        </motion.div>
      </main>
    </div>
  );
}
