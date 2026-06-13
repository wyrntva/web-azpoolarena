"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { CiUser } from "react-icons/ci";
import { HiQuestionMarkCircle } from "react-icons/hi";
import { FaLock } from "react-icons/fa";


import { motion, AnimatePresence } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { logout } from "@/stores/auth.slice";

export default function NavBar(props?: { logoUrl?: string }) {
  const logoUrl = props?.logoUrl;
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const [openMenu, setOpenMenu] = useState(false);
  const { token } = useAppSelector((state) => state.auth);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isLoggedIn = isMounted && !!token;

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem("role");
    router.push("/login");
  };

  return (
    <div className="sticky top-0 z-50 shadow-md">
      <div className="h-[4px] w-full bg-[#172339]" />
    <div className="w-full h-[46px] xl:h-[62px] bg-white relative">

      {/* Desktop Back button - only on bracket pages, hidden on mobile */}
      {pathname?.endsWith('/bracket') && (
        <button
          onClick={() => router.back()}
          className="hidden xl:flex"
          style={{
            width: '40px',
            height: '40px',
            padding: '8px',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            borderRadius: '100px',
            background: '#FFF',
            boxShadow: '0 4px 6px 0 rgba(138, 138, 138, 0.10)',
            position: 'absolute',
            left: '30px',
            top: '50%',
            transform: 'translateY(-50%)',
            border: 'none',
            cursor: 'pointer',
            zIndex: 10,
            flexShrink: 0,
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="9" height="16" viewBox="0 0 7 13" fill="none">
            <path d="M6.03 0.75L0.75 6.045L6.03 11.34" stroke="#37393E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      {/* Mobile Back button - positioned fixed in the bottom-left corner */}
      {pathname?.endsWith('/bracket') && (
        <button
          onClick={() => router.back()}
          className="flex xl:hidden fixed left-[16px] bottom-[16px] w-[50px] h-[50px] items-center justify-center rounded-full bg-[#e23841] shadow-[0_4px_12px_rgba(226,56,65,0.4)] border-none cursor-pointer z-50 transition-transform active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15.5 19L8.5 12L15.5 5" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      {pathname?.endsWith('/bracket') && (
        <Link
          href="/tournaments"
          className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 xl:left-auto xl:right-[30px] xl:translate-x-0 z-10 w-[150px] h-[30px] xl:w-[180px] xl:h-[36px]"
          prefetch
        >
          <img
            src={logoUrl || "/images/logo-dark.png"}
            alt="Tournament Logo"
            className="w-full h-full object-contain object-center xl:object-right"
          />
        </Link>
      )}

      <div className="flex justify-between items-center max-w-[1360px] mx-auto px-4 sm:px-6 md:px-8 w-full h-full relative">



        {/* Logo (Left) - Desktop */}
        {!pathname?.endsWith('/bracket') && (
          <Link
            href="/tournaments"
            className="hidden xl:flex relative w-[260px] h-12"
            prefetch
          >
            <Image
              src="/images/logo-dark.png"
              alt="Pool Arena Logo"
              fill
              sizes="260px"
              className="object-contain"
              priority
            />
          </Link>
        )}

        {/* Center Menu (Desktop) */}
        {!pathname?.endsWith('/bracket') && (
          <div className="hidden xl:flex items-center space-x-6 absolute left-1/2 -translate-x-1/2">
            <Link
              href="/tournaments"
              className="text-[16px] leading-[24px] text-[#37393E] font-medium hover:text-[#D22E39] transition-colors whitespace-nowrap"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
              prefetch
            >
              GIẢI ĐẤU
            </Link>
            <Link
              href="/rankings"
              className="text-[16px] leading-[24px] text-[#37393E] font-medium hover:text-[#D22E39] transition-colors whitespace-nowrap"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
              prefetch
            >
              BẢNG XẾP HẠNG
            </Link>
            <Link
              href="/achievements"
              className="text-[16px] leading-[24px] text-[#37393E] font-medium hover:text-[#D22E39] transition-colors whitespace-nowrap flex items-center gap-1"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
              prefetch
            >
              <span>THÀNH TÍCH</span>
              <FaLock size={12} className="text-[#9A9CA3]" />
            </Link>
          </div>
        )}

        {/* Right Menu (Desktop) */}
        {!pathname?.endsWith('/bracket') && (
          <div className="hidden xl:flex items-center space-x-6">
            {isLoggedIn ? (
              <>
                <Link
                  href="/myprofile"
                  className="flex items-center space-x-1 hover:text-[#D22E39] transition-colors group"
                  prefetch
                >
                  <CiUser className="text-[#37393E] group-hover:text-[#D22E39] transition-colors" size={20} />
                  <span 
                    className="text-[14px] leading-[20px] tracking-[0.28px] text-[#37393E] font-medium group-hover:text-[#D22E39] transition-colors whitespace-nowrap"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    My profile
                  </span>
                </Link>
                <Link
                  href="/info"
                  className="flex items-center space-x-1 hover:text-[#D22E39] transition-colors group"
                  prefetch
                >
                  <HiQuestionMarkCircle className="text-[#37393E] group-hover:text-[#D22E39] transition-colors" size={20} />
                  <span 
                    className="text-[14px] leading-[20px] tracking-[0.28px] text-[#37393E] font-medium group-hover:text-[#D22E39] transition-colors whitespace-nowrap"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    Support
                  </span>
                </Link>
                <button
                  className="flex items-center space-x-1 cursor-pointer hover:text-[#D22E39] transition-colors group"
                  onClick={handleLogout}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    className="text-[#37393E] group-hover:text-[#D22E39] transition-colors"
                  >
                    <path d="M7.41699 6.29995C7.67533 3.29995 9.21699 2.07495 12.592 2.07495H12.7003C16.4253 2.07495 17.917 3.56662 17.917 7.29162V12.725C17.917 16.45 16.4253 17.9416 12.7003 17.9416H12.592C9.24199 17.9416 7.70033 16.7333 7.42533 13.7833" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M1.66699 10H12.4003" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M10.542 7.20837L13.3337 10L10.542 12.7917" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span 
                    className="text-[14px] leading-[20px] tracking-[0.28px] text-[#37393E] font-medium group-hover:text-[#D22E39] transition-colors whitespace-nowrap"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    Đăng xuất
                  </span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/info"
                  className="flex items-center space-x-1 hover:text-[#D22E39] transition-colors group"
                  prefetch
                >
                  <HiQuestionMarkCircle className="text-[#37393E] group-hover:text-[#D22E39] transition-colors" size={20} />
                  <span 
                    className="text-[14px] leading-[20px] tracking-[0.28px] text-[#37393E] font-medium group-hover:text-[#D22E39] transition-colors whitespace-nowrap"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    Support
                  </span>
                </Link>
                <Link
                  href="/login"
                  className="flex items-center space-x-1 hover:text-[#D22E39] transition-colors group"
                  prefetch
                >
                  <CiUser className="text-[#37393E] group-hover:text-[#D22E39] transition-colors" size={20} />
                  <span 
                    className="text-[14px] leading-[20px] tracking-[0.28px] text-[#37393E] font-medium group-hover:text-[#D22E39] transition-colors whitespace-nowrap"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    Đăng nhập
                  </span>
                </Link>
              </>
            )}
          </div>
        )}

      {/* Mobile: Logo left + hamburger right */}
      <div className="flex xl:hidden items-center w-full justify-between">
        {/* Logo (Left) */}
        {!pathname?.endsWith('/bracket') ? (
          <Link href="/tournaments" className="relative w-[180px] h-[36px]" prefetch>
            <Image
              src="/images/logo-dark.png"
              alt="Pool Arena Logo"
              fill
              sizes="180px"
              className="object-contain object-left"
              priority
            />
          </Link>
        ) : (
          <div className="w-[180px] h-[36px]" />
        )}

        {/* Menu toggle (Right) */}
        {!pathname?.endsWith('/bracket') ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 36 36"
            fill="none"
            className="cursor-pointer"
            onClick={() => setOpenMenu(!openMenu)}
          >
            <rect y="3.34302" width="36" height="3.6" rx="1.8" fill="#37393E"/>
            <rect y="28.8" width="21.6" height="3.6" rx="1.8" fill="#C6010B"/>
            <rect y="16.2" width="36" height="3.6" rx="1.8" fill="#37393E"/>
          </svg>
        ) : (
          <div className="w-[28px] h-[28px]" />
        )}
      </div>

      {/* Mobile Dropdown Menu */}
      <AnimatePresence>
        {openMenu && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="absolute top-[46px] left-0 w-full bg-white shadow-xl xl:hidden z-50 overflow-hidden"
          >
            <div className="p-6 flex flex-col space-y-4">
              {/* Navigation Links */}
              {/* Navigation Links */}
              <Link
                href="/tournaments"
                className="flex items-center space-x-3 text-[#37393E] hover:text-[#D22E39] font-medium text-[16px] leading-[24px] tracking-wide uppercase transition-colors"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
                onClick={() => setOpenMenu(false)}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none"
                  className="flex-shrink-0"
                >
                  <path 
                    d="M17.5 22.5C19.7091 22.5 21.5 20.7091 21.5 18.5C21.5 16.2909 19.7091 14.5 17.5 14.5C15.2909 14.5 13.5 16.2909 13.5 18.5C13.5 20.7091 15.2909 22.5 17.5 22.5Z" 
                    stroke="currentColor" 
                    strokeWidth="1.5" 
                    strokeMiterlimit="10" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                  <path 
                    d="M18.99 18.55H16.01" 
                    stroke="#C6010B" 
                    strokeWidth="1.5" 
                    strokeMiterlimit="10" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                  <path 
                    d="M17.5 17.09V20.08" 
                    stroke="#C6010B" 
                    strokeWidth="1.5" 
                    strokeMiterlimit="10" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                  <path 
                    d="M14.5 3.5V1.5M14.5 3.5V5.5M14.5 3.5H10M13.4942 20.5H4.5C3.39543 20.5 2.5 19.6046 2.5 18.5V9.5H20.5V15.9179" 
                    stroke="currentColor" 
                    strokeWidth="1.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                  <path 
                    d="M2.5 9.5V5.5C2.5 4.39543 3.39543 3.5 4.5 3.5H6.5" 
                    stroke="currentColor" 
                    strokeWidth="1.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                  <path 
                    d="M6.5 1.5V5.5" 
                    stroke="currentColor" 
                    strokeWidth="1.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                  <path 
                    d="M20.5 9.5V5.5C20.5 4.39543 19.6046 3.5 18.5 3.5H18" 
                    stroke="currentColor" 
                    strokeWidth="1.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                  <path 
                    d="M11.4955 13.2H11.5045" 
                    stroke="currentColor" 
                    strokeWidth="1.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                  <path 
                    d="M7.79431 13.2H7.80329" 
                    stroke="currentColor" 
                    strokeWidth="1.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                  <path 
                    d="M7.79431 16.2H7.80329" 
                    stroke="currentColor" 
                    strokeWidth="1.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
                <span>GIẢI ĐẤU</span>
              </Link>
              <Link
                href="/rankings"
                className="flex items-center space-x-3 text-[#37393E] hover:text-[#D22E39] font-medium text-[16px] leading-[24px] tracking-wide uppercase transition-colors"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
                onClick={() => setOpenMenu(false)}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="20" 
                  height="20" 
                  viewBox="0 0 20 20" 
                  fill="none"
                  className="flex-shrink-0"
                >
                  <g clipPath="url(#clip0_menu_leaderboard)">
                    <path 
                      d="M0.000391284 19.2145C0.144775 18.8322 0.42963 18.6941 0.826 18.7097C1.22706 18.7258 1.6297 18.7132 2.05307 18.7132V18.4429C2.05307 16.2889 2.05307 14.1349 2.05307 11.9808C2.05307 11.8963 2.05229 11.8114 2.05933 11.7273C2.08906 11.3751 2.33088 11.1306 2.68186 11.1286C3.70351 11.1219 4.72515 11.1219 5.74679 11.1286C6.10443 11.1309 6.36424 11.4013 6.37089 11.7461C6.37754 12.0954 6.14003 12.3803 5.77731 12.3901C5.05539 12.4101 4.33308 12.4003 3.61077 12.4026C3.52704 12.4026 3.4433 12.4026 3.34431 12.4026V18.7026H6.80444V18.4507C6.80444 15.4636 6.80444 12.4766 6.80521 9.48951C6.80521 9.39208 6.80639 9.29351 6.82282 9.19801C6.87604 8.88379 7.10729 8.66779 7.42736 8.66665C9.13886 8.66115 10.8503 8.66036 12.5618 8.66586C12.9171 8.66701 13.1808 8.94208 13.191 9.28372C13.2008 9.61901 12.9425 9.90151 12.5899 9.92929C12.4346 9.94143 12.2777 9.93715 12.1216 9.93715C10.8589 9.93751 9.59664 9.93715 8.33393 9.93715H8.09564V18.6968H11.9111V18.4671C11.9111 16.0334 11.9107 13.5991 11.9126 11.1654C11.9126 11.0562 11.9185 10.9424 11.9483 10.8386C12.0265 10.5655 12.2859 10.3844 12.5653 10.3918C12.8537 10.3992 13.1053 10.6007 13.1664 10.8856C13.1879 10.9861 13.1929 11.0918 13.1929 11.1955C13.1945 13.6164 13.1941 16.0373 13.1941 18.4581V18.7007H16.6539V14.3782C16.5881 14.3755 16.5196 14.37 16.4508 14.3696C15.7351 14.3688 15.0191 14.3735 14.3034 14.3676C13.8072 14.3637 13.4934 13.9239 13.6715 13.49C13.7787 13.2286 13.988 13.0913 14.2654 13.0897C15.2804 13.0839 16.2958 13.0819 17.3108 13.0905C17.6634 13.0936 17.9028 13.337 17.9392 13.688C17.9474 13.7654 17.9474 13.8437 17.9474 13.922C17.9478 15.4253 17.9474 16.9286 17.9474 18.4319C17.9474 18.5161 17.9474 18.6001 17.9474 18.7136C18.1654 18.7136 18.3712 18.7136 18.577 18.7136C18.8176 18.7136 19.0586 18.7105 19.2993 18.7144C19.7066 18.7214 19.9919 18.986 19.9939 19.3526C19.9962 19.7282 19.707 19.9951 19.2872 19.9955C16.2935 19.9966 13.3001 19.9963 10.3064 19.9963C7.13702 19.9963 3.96801 19.9931 0.798614 20.0006C0.404979 20.0014 0.133819 19.866 0 19.4888L0 19.2153L0.000391284 19.2145Z" 
                      fill="currentColor"
                    />
                    <path 
                      d="M10.1539 0.000391284C10.5347 0.106821 10.7612 0.377981 10.9267 0.717614C11.1282 1.13238 11.3286 1.54831 11.5427 1.95681C11.579 2.02646 11.6769 2.09298 11.7559 2.10706C12.3123 2.20606 12.8773 2.26241 13.4274 2.38684C14.1161 2.54296 14.3622 3.30557 13.8962 3.83694C13.5323 4.25169 13.1238 4.62733 12.7267 5.01157C12.6249 5.11017 12.5979 5.20291 12.6234 5.33751C12.7122 5.81018 12.7936 6.28402 12.8726 6.75826C12.9662 7.31821 12.7157 7.77836 12.2454 7.90707C11.9449 7.98921 11.6667 7.9055 11.401 7.767C10.9745 7.54471 10.5515 7.31621 10.1211 7.10141C10.0549 7.06855 9.94423 7.06776 9.87852 7.10064C9.45394 7.31193 9.0388 7.542 8.61466 7.75407C8.46559 7.82879 8.30394 7.89886 8.14123 7.92236C7.5398 8.00879 7.07261 7.59129 7.11526 6.97504C7.14659 6.5231 7.22009 6.06921 7.32652 5.62901C7.41144 5.27881 7.34923 5.03896 7.06634 4.8038C6.73258 4.52638 6.42503 4.21139 6.13822 3.88467C5.62094 3.29539 5.85728 2.54726 6.62497 2.37157C7.1493 2.25145 7.68809 2.19001 8.22259 2.11959C8.36187 2.10119 8.42373 2.04094 8.47809 1.92629C8.67137 1.52171 8.87487 1.1222 9.07009 0.718786C9.23487 0.378372 9.46216 0.108386 9.84173 0L10.1539 0.000391284ZM11.5051 6.37519C11.437 5.96513 11.3916 5.59067 11.309 5.22482C11.2261 4.85466 11.3216 4.57411 11.5997 4.31665C11.8748 4.06231 12.1143 3.76964 12.3612 3.50278C12.3577 3.50199 12.3154 3.48634 12.2716 3.48008C11.8987 3.42569 11.5258 3.37013 11.1522 3.32005C10.8857 3.28444 10.6963 3.15101 10.5793 2.90724C10.4302 2.59695 10.2745 2.28979 10.1215 1.98146C10.0859 1.90986 10.0483 1.83943 9.99666 1.73926C9.79044 2.15441 9.60066 2.53044 9.41716 2.90959C9.29902 3.15336 9.10809 3.2864 8.84237 3.31966C8.73909 3.33257 8.63616 3.34704 8.5333 3.36231C8.22066 3.40887 7.90759 3.45621 7.63059 3.49808C7.88373 3.77159 8.12402 4.06466 8.39987 4.31899C8.67923 4.57685 8.78444 4.86249 8.68544 5.22716C8.66516 5.3019 8.65773 5.38055 8.6448 5.45764C8.59666 5.74992 8.54894 6.0426 8.49452 6.37284C8.88187 6.17016 9.23716 5.99565 9.58073 5.80079C9.86287 5.64075 10.1266 5.63723 10.4099 5.79688C10.7542 5.99134 11.1091 6.16703 11.5047 6.37441L11.5051 6.37519Z" 
                      fill="#C6010B" 
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_menu_leaderboard">
                      <rect width="20" height="20" fill="white"/>
                    </clipPath>
                  </defs>
                </svg>
                <span>BẢNG XẾP HẠNG</span>
              </Link>
              <Link
                href="/achievements"
                className="flex items-center justify-between text-[#37393E] hover:text-[#D22E39] font-medium text-[16px] leading-[24px] tracking-wide uppercase transition-colors w-full"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
                onClick={() => setOpenMenu(false)}
              >
                <div className="flex items-center space-x-3">
                  <svg 
                    viewBox="0 0 1024 1024" 
                    width="20" 
                    height="20" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                    className="flex-shrink-0"
                  >
                    <path 
                      d="M352 128a32 32 0 0 0 12.16-2.56 37.12 37.12 0 0 0 10.56-6.72 37.12 37.12 0 0 0 6.72-10.56A32 32 0 0 0 384 96a33.6 33.6 0 0 0-9.28-22.72 32 32 0 0 0-45.44 0A32 32 0 0 0 320 96a32 32 0 0 0 32 32zM480 128h128a32 32 0 0 0 0-64h-128a32 32 0 0 0 0 64z" 
                      fill="currentColor"
                    />
                    <path 
                      d="M960 32h-32a32 32 0 0 0-22.72 9.28L832 115.2V96a32 32 0 0 0-32-32h-64a32 32 0 0 0 0 64h32c-8 271.68-117.44 480-256 480-143.68 0-256-224-256-512a32 32 0 0 0-64 0v19.2L118.72 41.28A32 32 0 0 0 96 32H64a32 32 0 0 0-32 32v256a32 32 0 0 0 9.28 22.72l96 96A32 32 0 0 0 160 448h96c46.4 111.04 114.88 188.48 196.16 214.4l-115.2 137.6H224a32 32 0 0 0-32 32v128a32 32 0 0 0 32 32h576a32 32 0 0 0 32-32v-128a32 32 0 0 0-32-32h-112.96l-114.88-137.6c81.28-25.6 149.76-103.04 196.16-214.4h96a32 32 0 0 0 22.72-9.28l96-96A32 32 0 0 0 992 320V64a32 32 0 0 0-32-32zM173.12 384L96 306.88V109.12L198.08 211.2A909.76 909.76 0 0 0 232.32 384zM672 864h96v64H256v-64h96a32 32 0 0 0 24.64-11.52L512 689.92l135.36 162.56A32 32 0 0 0 672 864z m256-557.12L850.88 384h-59.2a909.76 909.76 0 0 0 34.56-172.8L928 109.12z" 
                      fill="currentColor"
                    />
                    <path 
                      d="M384 224a32 32 0 0 0 0 64h256a32 32 0 0 0 0-64zM448 384a32 32 0 0 0 0 64h128a32 32 0 0 0 0-64z" 
                      fill="#C6010B"
                    />
                  </svg>
                  <span>THÀNH TÍCH</span>
                </div>
                <FaLock size={12} className="text-[#9A9CA3] mr-1" />
              </Link>

              {/* Divider */}
              <div className="border-t border-gray-200 my-2" />

              {/* User Actions */}
              {isLoggedIn ? (
                <>
                  <Link
                    href="/myprofile"
                    className="flex items-center space-x-3 text-gray-700 hover:text-[#D22E39] transition-colors py-1"
                    onClick={() => setOpenMenu(false)}
                  >
                    <CiUser size={22} className="text-gray-600" />
                    <span className="text-base font-medium">My profile</span>
                  </Link>
                  <Link
                    href="/info"
                    className="flex items-center space-x-3 text-gray-700 hover:text-[#D22E39] transition-colors py-1"
                    onClick={() => setOpenMenu(false)}
                  >
                    <HiQuestionMarkCircle size={22} className="text-gray-600" />
                    <span className="text-base font-medium">Support</span>
                  </Link>
                  <button
                    className="flex items-center space-x-3 text-gray-700 hover:text-[#D22E39] group w-full text-left transition-colors py-1"
                    onClick={() => {
                      handleLogout();
                      setOpenMenu(false);
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="22"
                      height="22"
                      viewBox="0 0 20 20"
                      fill="none"
                      className="text-gray-600 group-hover:text-[#D22E39] transition-colors"
                    >
                      <path d="M7.41699 6.29995C7.67533 3.29995 9.21699 2.07495 12.592 2.07495H12.7003C16.4253 2.07495 17.917 3.56662 17.917 7.29162V12.725C17.917 16.45 16.4253 17.9416 12.7003 17.9416H12.592C9.24199 17.9416 7.70033 16.7333 7.42533 13.7833" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M1.66699 10H12.4003" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M10.542 7.20837L13.3337 10L10.542 12.7917" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="text-base font-medium">Đăng xuất</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/info"
                    className="flex items-center space-x-3 text-gray-700 hover:text-[#D22E39] transition-colors py-1"
                    onClick={() => setOpenMenu(false)}
                  >
                    <HiQuestionMarkCircle size={22} className="text-gray-600" />
                    <span className="text-base font-medium">Support</span>
                  </Link>
                  <Link
                    href="/login"
                    className="flex items-center space-x-3 text-gray-700 hover:text-[#D22E39] transition-colors py-1"
                    onClick={() => setOpenMenu(false)}
                  >
                    <CiUser size={22} className="text-gray-600" />
                    <span className="text-base font-medium">Đăng nhập</span>
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay khi mở menu */}
      {openMenu && (
        <div
          className="fixed inset-x-0 bottom-0 top-[50px] bg-black/40 xl:hidden z-40"
          onClick={() => setOpenMenu(false)}
        />
      )}
      {/* Mobile Bottom Navigation Bar */}
      {!pathname?.endsWith('/bracket') && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.08)] rounded-t-[20px] xl:hidden h-[52px] flex items-center justify-around px-2 pb-0.5">
        {/* Tournaments Tab */}
        <Link
          href="/tournaments"
          className={`flex flex-col items-center justify-center transition-all duration-300 h-[40px] px-3 min-[360px]:px-5 rounded-[12px] ${
            pathname === "/tournaments"
              ? "bg-[#172339] text-white"
              : "text-[#172339]"
          }`}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none"
            className="mb-0.5 flex-shrink-0"
          >
            <path 
              d="M17.5 22.5C19.7091 22.5 21.5 20.7091 21.5 18.5C21.5 16.2909 19.7091 14.5 17.5 14.5C15.2909 14.5 13.5 16.2909 13.5 18.5C13.5 20.7091 15.2909 22.5 17.5 22.5Z" 
              stroke={pathname === "/tournaments" ? "#FFF" : "#37393E"} 
              strokeWidth="1.5" 
              strokeMiterlimit="10" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
            <path 
              d="M18.99 18.55H16.01" 
              stroke="#C6010B" 
              strokeWidth="1.5" 
              strokeMiterlimit="10" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
            <path 
              d="M17.5 17.09V20.08" 
              stroke="#C6010B" 
              strokeWidth="1.5" 
              strokeMiterlimit="10" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
            <path 
              d="M14.5 3.5V1.5M14.5 3.5V5.5M14.5 3.5H10M13.4942 20.5H4.5C3.39543 20.5 2.5 19.6046 2.5 18.5V9.5H20.5V15.9179" 
              stroke={pathname === "/tournaments" ? "#FFF" : "#37393E"} 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
            <path 
              d="M2.5 9.5V5.5C2.5 4.39543 3.39543 3.5 4.5 3.5H6.5" 
              stroke={pathname === "/tournaments" ? "#FFF" : "#37393E"} 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
            <path 
              d="M6.5 1.5V5.5" 
              stroke={pathname === "/tournaments" ? "#FFF" : "#37393E"} 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
            <path 
              d="M20.5 9.5V5.5C20.5 4.39543 19.6046 3.5 18.5 3.5H18" 
              stroke={pathname === "/tournaments" ? "#FFF" : "#37393E"} 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
            <path 
              d="M11.4955 13.2H11.5045" 
              stroke={pathname === "/tournaments" ? "#FFF" : "#37393E"} 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
            <path 
              d="M7.79431 13.2H7.80329" 
              stroke={pathname === "/tournaments" ? "#FFF" : "#37393E"} 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
            <path 
              d="M7.79431 16.2H7.80329" 
              stroke={pathname === "/tournaments" ? "#FFF" : "#37393E"} 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-[10px] font-normal uppercase tracking-wide" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Giải đấu
          </span>
        </Link>

        {/* Leaderboard Tab */}
        <Link
          href="/rankings"
          className={`flex flex-col items-center justify-center transition-all duration-300 h-[40px] px-3 min-[360px]:px-5 rounded-[12px] ${
            pathname === "/rankings"
              ? "bg-[#172339] text-white"
              : "text-[#172339]"
          }`}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 20 20" 
            fill="none"
            className="mb-0.5 flex-shrink-0"
          >
            <g clipPath="url(#clip0_172_25927)">
              <path 
                d="M0.000391284 19.2145C0.144775 18.8322 0.42963 18.6941 0.826 18.7097C1.22706 18.7258 1.6297 18.7132 2.05307 18.7132V18.4429C2.05307 16.2889 2.05307 14.1349 2.05307 11.9808C2.05307 11.8963 2.05229 11.8114 2.05933 11.7273C2.08906 11.3751 2.33088 11.1306 2.68186 11.1286C3.70351 11.1219 4.72515 11.1219 5.74679 11.1286C6.10443 11.1309 6.36424 11.4013 6.37089 11.7461C6.37754 12.0954 6.14003 12.3803 5.77731 12.3901C5.05539 12.4101 4.33308 12.4003 3.61077 12.4026C3.52704 12.4026 3.4433 12.4026 3.34431 12.4026V18.7026H6.80444V18.4507C6.80444 15.4636 6.80444 12.4766 6.80521 9.48951C6.80521 9.39208 6.80639 9.29351 6.82282 9.19801C6.87604 8.88379 7.10729 8.66779 7.42736 8.66665C9.13886 8.66115 10.8503 8.66036 12.5618 8.66586C12.9171 8.66701 13.1808 8.94208 13.191 9.28372C13.2008 9.61901 12.9425 9.90151 12.5899 9.92929C12.4346 9.94143 12.2777 9.93715 12.1216 9.93715C10.8589 9.93751 9.59664 9.93715 8.33393 9.93715H8.09564V18.6968H11.9111V18.4671C11.9111 16.0334 11.9107 13.5991 11.9126 11.1654C11.9126 11.0562 11.9185 10.9424 11.9483 10.8386C12.0265 10.5655 12.2859 10.3844 12.5653 10.3918C12.8537 10.3992 13.1053 10.6007 13.1664 10.8856C13.1879 10.9861 13.1929 11.0918 13.1929 11.1955C13.1945 13.6164 13.1941 16.0373 13.1941 18.4581V18.7007H16.6539V14.3782C16.5881 14.3755 16.5196 14.37 16.4508 14.3696C15.7351 14.3688 15.0191 14.3735 14.3034 14.3676C13.8072 14.3637 13.4934 13.9239 13.6715 13.49C13.7787 13.2286 13.988 13.0913 14.2654 13.0897C15.2804 13.0839 16.2958 13.0819 17.3108 13.0905C17.6634 13.0936 17.9028 13.337 17.9392 13.688C17.9474 13.7654 17.9474 13.8437 17.9474 13.922C17.9478 15.4253 17.9474 16.9286 17.9474 18.4319C17.9474 18.5161 17.9474 18.6001 17.9474 18.7136C18.1654 18.7136 18.3712 18.7136 18.577 18.7136C18.8176 18.7136 19.0586 18.7105 19.2993 18.7144C19.7066 18.7214 19.9919 18.986 19.9939 19.3526C19.9962 19.7282 19.707 19.9951 19.2872 19.9955C16.2935 19.9966 13.3001 19.9963 10.3064 19.9963C7.13702 19.9963 3.96801 19.9931 0.798614 20.0006C0.404979 20.0014 0.133819 19.866 0 19.4888L0 19.2153L0.000391284 19.2145Z" 
                fill={pathname === "/rankings" ? "#FFF" : "#37393E"} 
              />
              <path 
                d="M10.1539 0.000391284C10.5347 0.106821 10.7612 0.377981 10.9267 0.717614C11.1282 1.13238 11.3286 1.54831 11.5427 1.95681C11.579 2.02646 11.6769 2.09298 11.7559 2.10706C12.3123 2.20606 12.8773 2.26241 13.4274 2.38684C14.1161 2.54296 14.3622 3.30557 13.8962 3.83694C13.5323 4.25169 13.1238 4.62733 12.7267 5.01157C12.6249 5.11017 12.5979 5.20291 12.6234 5.33751C12.7122 5.81018 12.7936 6.28402 12.8726 6.75826C12.9662 7.31821 12.7157 7.77836 12.2454 7.90707C11.9449 7.98921 11.6667 7.9055 11.401 7.767C10.9745 7.54471 10.5515 7.31621 10.1211 7.10141C10.0549 7.06855 9.94423 7.06776 9.87852 7.10064C9.45394 7.31193 9.0388 7.542 8.61466 7.75407C8.46559 7.82879 8.30394 7.89886 8.14123 7.92236C7.5398 8.00879 7.07261 7.59129 7.11526 6.97504C7.14659 6.5231 7.22009 6.06921 7.32652 5.62901C7.41144 5.27881 7.34923 5.03896 7.06634 4.8038C6.73258 4.52638 6.42503 4.21139 6.13822 3.88467C5.62094 3.29539 5.85728 2.54726 6.62497 2.37157C7.1493 2.25145 7.68809 2.19001 8.22259 2.11959C8.36187 2.10119 8.42373 2.04094 8.47809 1.92629C8.67137 1.52171 8.87487 1.1222 9.07009 0.718786C9.23487 0.378372 9.46216 0.108386 9.84173 0L10.1539 0.000391284ZM11.5051 6.37519C11.437 5.96513 11.3916 5.59067 11.309 5.22482C11.2261 4.85466 11.3216 4.57411 11.5997 4.31665C11.8748 4.06231 12.1143 3.76964 12.3612 3.50278C12.3577 3.50199 12.3154 3.48634 12.2716 3.48008C11.8987 3.42569 11.5258 3.37013 11.1522 3.32005C10.8857 3.28444 10.6963 3.15101 10.5793 2.90724C10.4302 2.59695 10.2745 2.28979 10.1215 1.98146C10.0859 1.90986 10.0483 1.83943 9.99666 1.73926C9.79044 2.15441 9.60066 2.53044 9.41716 2.90959C9.29902 3.15336 9.10809 3.2864 8.84237 3.31966C8.73909 3.33257 8.63616 3.34704 8.5333 3.36231C8.22066 3.40887 7.90759 3.45621 7.63059 3.49808C7.88373 3.77159 8.12402 4.06466 8.39987 4.31899C8.67923 4.57685 8.78444 4.86249 8.68544 5.22716C8.66516 5.3019 8.65773 5.38055 8.6448 5.45764C8.59666 5.74992 8.54894 6.0426 8.49452 6.37284C8.88187 6.17016 9.23716 5.99565 9.58073 5.80079C9.86287 5.64075 10.1266 5.63723 10.4099 5.79688C10.7542 5.99134 11.1091 6.16703 11.5047 6.37441L11.5051 6.37519Z" 
                fill="#C6010B" 
              />
            </g>
            <defs>
              <clipPath id="clip0_172_25927">
                <rect width="20" height="20" fill="white"/>
              </clipPath>
            </defs>
          </svg>
          <span className="text-[10px] font-normal uppercase tracking-wide" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Bảng xếp hạng
          </span>
        </Link>

        {/* Achievements Tab */}
        <Link
          href="/achievements"
          className={`flex flex-col items-center justify-center transition-all duration-300 h-[40px] px-3 min-[360px]:px-5 rounded-[12px] relative ${
            pathname === "/achievements"
              ? "bg-[#172339] text-white"
              : "text-[#172339]"
          }`}
        >
          <svg 
            viewBox="0 0 1024 1024" 
            width="16" 
            height="16" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="mb-0.5 flex-shrink-0"
          >
            <path 
              d="M352 128a32 32 0 0 0 12.16-2.56 37.12 37.12 0 0 0 10.56-6.72 37.12 37.12 0 0 0 6.72-10.56A32 32 0 0 0 384 96a33.6 33.6 0 0 0-9.28-22.72 32 32 0 0 0-45.44 0A32 32 0 0 0 320 96a32 32 0 0 0 32 32zM480 128h128a32 32 0 0 0 0-64h-128a32 32 0 0 0 0 64z" 
              fill={pathname === "/achievements" ? "#FFF" : "#37393E"}
            />
            <path 
              d="M960 32h-32a32 32 0 0 0-22.72 9.28L832 115.2V96a32 32 0 0 0-32-32h-64a32 32 0 0 0 0 64h32c-8 271.68-117.44 480-256 480-143.68 0-256-224-256-512a32 32 0 0 0-64 0v19.2L118.72 41.28A32 32 0 0 0 96 32H64a32 32 0 0 0-32 32v256a32 32 0 0 0 9.28 22.72l96 96A32 32 0 0 0 160 448h96c46.4 111.04 114.88 188.48 196.16 214.4l-115.2 137.6H224a32 32 0 0 0-32 32v128a32 32 0 0 0 32 32h576a32 32 0 0 0 32-32v-128a32 32 0 0 0-32-32h-112.96l-114.88-137.6c81.28-25.6 149.76-103.04 196.16-214.4h96a32 32 0 0 0 22.72-9.28l96-96A32 32 0 0 0 992 320V64a32 32 0 0 0-32-32zM173.12 384L96 306.88V109.12L198.08 211.2A909.76 909.76 0 0 0 232.32 384zM672 864h96v64H256v-64h96a32 32 0 0 0 24.64-11.52L512 689.92l135.36 162.56A32 32 0 0 0 672 864z m256-557.12L850.88 384h-59.2a909.76 909.76 0 0 0 34.56-172.8L928 109.12z" 
              fill={pathname === "/achievements" ? "#FFF" : "#37393E"}
            />
            <path 
              d="M384 224a32 32 0 0 0 0 64h256a32 32 0 0 0 0-64zM448 384a32 32 0 0 0 0 64h128a32 32 0 0 0 0-64z" 
              fill="#C6010B"
            />
          </svg>
          <span className="text-[10px] font-normal uppercase tracking-wide flex items-center gap-0.5" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            <span>Thành tích</span>
            <FaLock size={7} className={pathname === "/achievements" ? "text-white/70" : "text-gray-400"} />
          </span>
        </Link>
      </div>
      )}
    </div>
    </div>
    </div>
  );
}

