"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CiUser } from "react-icons/ci";
import { HiQuestionMarkCircle } from "react-icons/hi";
import { TbLogout } from "react-icons/tb";
import { FiMenu, FiX } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useAppDispatch } from "@/stores/hooks";
import { logout } from "@/stores/auth.slice";

export default function NavBar() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [openLeft, setOpenLeft] = useState(false);
  const [openRight, setOpenRight] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem("role");
    router.push("/login");
  };

  return (
    <div className="sticky top-0 z-50 shadow-md">
      <div className="h-[4px] w-full bg-[#172339]" />
    <div className="flex justify-between items-center w-full h-[57px] px-4 sm:px-10 lg:px-20 xl:px-40 2xl:px-[280px] bg-white">

      {/* Logo (Left) - Desktop */}
      <Link
        href="/tournaments"
        className="hidden md:flex relative w-[260px] h-12"
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

      {/* Center Menu (Desktop) */}
      <div className="hidden md:flex items-center space-x-6 absolute left-1/2 -translate-x-1/2">
        <Link
          href="/tournaments"
          className="text-base text-gray-700 font-medium hover:text-[#D22E39] transition-colors"
          prefetch
        >
          GIẢI ĐẤU
        </Link>
        <Link
          href="/leaderboard"
          className="text-base text-gray-700 font-medium hover:text-[#D22E39] transition-colors"
          prefetch
        >
          BẢNG XẾP HẠNG
        </Link>
        <Link
          href="/achievements"
          className="text-base text-gray-700 font-medium hover:text-[#D22E39] transition-colors"
          prefetch
        >
          THÀNH TÍCH
        </Link>
      </div>

      {/* Right Menu (Desktop) */}
      <div className="hidden md:flex items-center space-x-6">
        <Link
          href="/myprofile"
          className="flex items-center space-x-1 hover:text-[#D22E39] transition-colors group"
          prefetch
        >
          <CiUser className="text-gray-600 group-hover:text-[#D22E39] transition-colors" size={20} />
          <span className="text-sm text-gray-700 group-hover:text-[#D22E39] transition-colors">My profile</span>
        </Link>
        <div className="flex items-center space-x-1 cursor-pointer hover:text-[#D22E39] transition-colors group">
          <HiQuestionMarkCircle className="text-gray-700 group-hover:text-[#D22E39] transition-colors" size={20} />
          <span className="text-sm text-gray-700 group-hover:text-[#D22E39] transition-colors">Support</span>
        </div>
        <button
          className="flex items-center space-x-1 cursor-pointer hover:text-[#D22E39] transition-colors group"
          onClick={handleLogout}
        >
          <TbLogout className="text-gray-700 group-hover:text-[#D22E39] transition-colors" size={20} />
          <span className="text-sm text-gray-700 group-hover:text-[#D22E39] transition-colors">Đăng xuất</span>
        </button>
      </div>

      {/* Mobile Icons */}
      <div className="flex md:hidden items-center space-x-4 w-[100%] justify-between">
        {/* Left menu toggle */}
        {openLeft ? (
          <FiX
            size={24}
            className="text-gray-700 cursor-pointer"
            onClick={() => setOpenLeft(false)}
          />
        ) : (
          <FiMenu
            size={24}
            className="text-gray-700 cursor-pointer"
            onClick={() => {
              setOpenLeft(true);
              setOpenRight(false);
            }}
          />
        )}

        {/* Logo (Center) */}
        <Link href="/tournaments" className="relative w-[160px] h-9 mx-auto" prefetch>
          <Image
            src="/images/logo-dark.png"
            alt="Pool Arena Logo"
            fill
            sizes="160px"
            className="object-contain"
            priority
          />
        </Link>

        {/* Right menu toggle */}
        {openRight ? (
          <FiX
            size={24}
            className="text-gray-700 cursor-pointer"
            onClick={() => setOpenRight(false)}
          />
        ) : (
          <FiMenu
            size={24}
            className="text-gray-700 cursor-pointer"
            onClick={() => {
              setOpenRight(true);
              setOpenLeft(false);
            }}
          />
        )}
      </div>

      {/* Mobile Left Dropdown */}
      <AnimatePresence>
        {openLeft && (
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute top-[61px] left-0 w-1/2 bg-white shadow-md md:hidden z-50 p-4"
          >
            <Link
              href="/tournaments"
              className="block text-gray-700 hover:text-[#D22E39] mb-3"
              onClick={() => setOpenLeft(false)}
            >
              GIẢI ĐẤU
            </Link>
            <Link
              href="/leaderboard"
              className="block text-gray-700 hover:text-[#D22E39] mb-3"
              onClick={() => setOpenLeft(false)}
            >
              BẢNG XẾP HẠNG
            </Link>
            <Link
              href="/achievements"
              className="block text-gray-700 hover:text-[#D22E39]"
              onClick={() => setOpenLeft(false)}
            >
              THÀNH TÍCH
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Right Dropdown */}
      <AnimatePresence>
        {openRight && (
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute top-[61px] right-0 w-1/2 bg-white shadow-md md:hidden z-50 p-4 text-gray-700"
          >
            <Link
              href="/myprofile"
              className="flex items-center space-x-2 hover:text-[#D22E39] mb-3"
              onClick={() => setOpenRight(false)}
            >
              <CiUser size={20} />
              <span>My profile</span>
            </Link>
            <div className="flex items-center space-x-2 cursor-pointer hover:text-[#D22E39] mb-3">
              <HiQuestionMarkCircle size={20} />
              <span>Support</span>
            </div>
            <button
              className="flex items-center space-x-2 hover:text-[#D22E39]"
              onClick={() => {
                handleLogout();
                setOpenRight(false);
              }}
            >
              <TbLogout size={20} />
              <span>Đăng xuất</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay khi mở menu */}
      {(openLeft || openRight) && (
        <div
          className="fixed inset-0 bg-black/40 md:hidden z-40"
          onClick={() => {
            setOpenLeft(false);
            setOpenRight(false);
          }}
        />
      )}
    </div>
    </div>
  );
}
