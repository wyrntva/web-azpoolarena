"use client";

import { useState } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { storeSettingsAPI } from "@/api/storeSettings.api";
import ChatBox from "./ChatBox";

function getMessengerUrl(fbUrl: string | null | undefined): string {
  if (!fbUrl) return "https://m.me/poolarenavn";
  try {
    const cleanUrl = fbUrl.replace(/\/$/, "");
    const parts = cleanUrl.split("/");
    const username = parts[parts.length - 1];
    return `https://m.me/${username}`;
  } catch {
    return "https://m.me/poolarenavn";
  }
}

export default function FloatingContactButtons() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const { data: storeSettings } = useQuery({
    queryKey: ['store-settings-public'],
    queryFn: () => storeSettingsAPI.get().then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const phone = storeSettings?.phone || storeSettings?.phone_number || "0364756638";
  const cleanPhone = phone.replace(/[^0-9+]/g, '') || "0364756638";
  const messengerUrl = getMessengerUrl(storeSettings?.facebook_url);

  return (
    <>
      {/* Container nhóm 4 nút liên hệ cố định góc phải */}
      <div className="fixed bottom-[90px] xl:bottom-[40px] right-[16px] xl:right-[24px] z-50 flex flex-col items-center gap-3">
        {/* 1. Nút Trợ lý AI Chatbox (Nằm trên cùng, viền vàng nhạt nhẹ nhàng như Phone/Zalo) */}
        <button
          onClick={() => setIsChatOpen((prev) => !prev)}
          className="w-[48px] h-[48px] sm:w-[50px] sm:h-[50px] rounded-full shadow-[0_4px_16px_rgba(250,198,0,0.25)] flex items-center justify-center bg-white hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer border border-[#FAC600]/20 hover:shadow-[0_6px_20px_rgba(250,198,0,0.4)] group relative"
          aria-label="Mở Trợ lý AI POOLARENA"
        >
          {/* Logo Image 3 */}
          <div className="relative w-[30px] h-[30px] sm:w-[32px] sm:h-[32px] rounded-full overflow-hidden flex items-center justify-center pointer-events-none">
            <Image
              src="/images/chat-logo.png"
              alt="PoolArena AI"
              width={32}
              height={32}
              className="object-contain"
              priority
            />
          </div>

          {/* Online Indicator Green Dot */}
          <span className="absolute top-0 right-0 w-3 h-3 bg-[#60DB80] border-2 border-white rounded-full" />
        </button>

        {/* 2. Nút Gọi Hotline */}
        <a
          href={`tel:${cleanPhone}`}
          className="w-[48px] h-[48px] sm:w-[50px] sm:h-[50px] rounded-full shadow-[0_4px_16px_rgba(0,184,20,0.25)] flex items-center justify-center bg-white hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer border border-[#00B814]/20 hover:shadow-[0_6px_20px_rgba(0,184,20,0.4)]"
          aria-label="Gọi điện hotline"
        >
          <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="30" height="30" viewBox="8 8 32 32">
            <path fill="#00B814" d="M35.45,31.041l-4.612-3.051c-0.563-0.341-1.267-0.347-1.836-0.017c0,0,0,0-1.978,1.153	c-0.265,0.154-0.52,0.183-0.726,0.145c-0.262-0.048-0.442-0.191-0.454-0.201c-1.087-0.797-2.357-1.852-3.711-3.205	c-1.353-1.353-2.408-2.623-3.205-3.711c-0.009-0.013-0.153-0.193-0.201-0.454c-0.037-0.206-0.009-0.46,0.145-0.726	c1.153-1.978,1.153-1.978,1.153-1.978c0.331-0.569,0.324-1.274-0.017-1.836l-3.051-4.612c-0.378-0.571-1.151-0.722-1.714-0.332	c0,0-1.445,0.989-1.922,1.325c-0.764,0.538-1.01,1.356-1.011,2.496c-0.002,1.604,1.38,6.629,7.201,12.45l0,0l0,0l0,0l0,0	c5.822,5.822,10.846,7.203,12.45,7.201c1.14-0.001,1.958-0.248,2.496-1.011c0.336-0.477,1.325-1.922,1.325-1.922	C36.172,32.192,36.022,31.419,35.45,31.041z"></path>
          </svg>
        </a>

        {/* 3. Nút Zalo */}
        <a
          href={`https://zalo.me/${cleanPhone}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-[48px] h-[48px] sm:w-[50px] sm:h-[50px] rounded-full shadow-[0_4px_16px_rgba(55,147,246,0.25)] flex items-center justify-center bg-white hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer border border-[#3793F6]/20 hover:shadow-[0_6px_20px_rgba(55,147,246,0.4)]"
          aria-label="Liên hệ Zalo"
        >
          <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="30" height="30" viewBox="0 0 48 48">
            <path fill="#3793F6" d="M15,36V6.827l-1.211-0.811C8.64,8.083,5,13.112,5,19v10c0,7.732,6.268,14,14,14h10	c4.722,0,8.883-2.348,11.417-5.931V36H15z"></path>
            <path fill="#eee" d="M29,5H19c-1.845,0-3.601,0.366-5.214,1.014C10.453,9.25,8,14.528,8,19	c0,6.771,0.936,10.735,3.712,14.607c0.216,0.301,0.357,0.653,0.376,1.022c0.043,0.835-0.129,2.365-1.634,3.742	c-0.162,0.148-0.059,0.419,0.16,0.428c0.942,0.041,2.843-0.014,4.797-0.877c0.557-0.246,1.191-0.203,1.729,0.083	C20.453,39.764,24.333,40,28,40c4.676,0,9.339-1.04,12.417-2.916C42.038,34.799,43,32.014,43,29V19C43,11.268,36.732,5,29,5z"></path>
            <path fill="#3793F6" d="M36.75,27C34.683,27,33,25.317,33,23.25s1.683-3.75,3.75-3.75s3.75,1.683,3.75,3.75	S38.817,27,36.75,27z M36.75,21c-1.24,0-2.25,1.01-2.25,2.25s1.01,2.25,2.25,2.25S39,24.49,39,23.25S37.99,21,36.75,21z"></path>
            <path fill="#3793F6" d="M31.5,27h-1c-0.276,0-0.5-0.224-0.5-0.5V18h1.5V27z"></path>
            <path fill="#3793F6" d="M27,19.75v0.519c-0.629-0.476-1.403-0.769-2.25-0.769c-2.067,0-3.75,1.683-3.75,3.75	S22.683,27,24.75,27c0.847,0,1.621-0.293,2.25-0.769V26.5c0,0.276,0.224,0.5,0.5,0.5h1v-7.25H27z M24.75,25.5	c-1.24,0-2.25-1.01-2.25-2.25S23.51,21,24.75,21S27,22.01,27,23.25S25.99,25.5,24.75,25.5z"></path>
            <path fill="#3793F6" d="M21.25,18h-8v1.5h5.321L13,26h0.026c-0.163,0.211-0.276,0.463-0.276,0.75V27h7.5	c0.276,0,0.5-0.224,0.5-0.5v-1h-5.321L21,19h-0.026c0.163-0.211,0.276-0.463,0.276-0.75V18z"></path>
          </svg>
        </a>

        {/* 4. Nút Messenger */}
        <a
          href={messengerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-[48px] h-[48px] sm:w-[50px] sm:h-[50px] rounded-full shadow-[0_4px_16px_rgba(55,147,246,0.25)] flex items-center justify-center bg-white hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer border border-[#3793F6]/20 hover:shadow-[0_6px_20px_rgba(55,147,246,0.4)]"
          aria-label="Liên hệ Messenger"
        >
          <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="30" height="30" viewBox="0 0 48 48">
            <path fill="#3793F6" d="M24,4C13.5,4,5,12.1,5,22c0,5.2,2.3,9.8,6,13.1V44l7.8-4.7c1.6,0.4,3.4,0.7,5.2,0.7c10.5,0,19-8.1,19-18C43,12.1,34.5,4,24,4z"></path>
            <path fill="#FFF" d="M12 28L22 17 27 22 36 17 26 28 21 23z"></path>
          </svg>
        </a>
      </div>

      {/* ChatBox Component */}
      <ChatBox isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  );
}
