"use client";

import React from "react";
import NavBar from "@/components/NavBar";
import { Footer } from "@/components/Footer";

export default function ContactCooperationPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col" style={{ fontFamily: 'Montserrat, sans-serif' }}>
      <NavBar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center py-20 px-4">
        <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm max-w-lg w-full text-center transition-all hover:shadow-[0_12px_30px_rgba(0,0,0,0.05)] border border-gray-100">
          <div className="text-6xl mb-6">🤝</div>
          <h1 className="text-2xl font-bold text-[#172339] mb-4">LIÊN HỆ HỢP TÁC</h1>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Nội dung liên hệ hợp tác đang được hoàn thiện. Vui lòng quay lại sau!
          </p>
          <a
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-white bg-[#172339] hover:bg-[#1f2e4b] transition-colors"
          >
            Quay về trang chủ
          </a>
        </div>
      </div>

      <Footer />
    </div>
  );
}
