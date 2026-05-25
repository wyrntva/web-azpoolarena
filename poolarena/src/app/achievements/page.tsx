"use client";

import NavBar from "@/components/NavBar";

export default function AchievementsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#e8e8e8]">
      <NavBar />
      <main className="flex-1 max-w-[1360px] mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-0 py-10">
        <h1 className="text-2xl font-bold text-[#172339] mb-6">THÀNH TÍCH</h1>
        <p className="text-gray-500">Nội dung thành tích sẽ được cập nhật tại đây.</p>
      </main>
    </div>
  );
}
