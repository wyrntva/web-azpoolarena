"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NavBar from '@/components/NavBar';
import { Spin } from 'antd';
import { useAppSelector, useAppDispatch } from "@/stores/hooks";
import { authAPI } from "@/api/auth.api";
import { setUser, logout } from "@/stores/auth.slice";
import ChangePasswordForm from "@/components/profile/ChangePasswordForm";
import PlayerProfileCard from "@/components/profile/PlayerProfileCard";

export default function MyProfilePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const { user, token } = useAppSelector((state) => state.auth);

  useEffect(() => {
    const fetchProfile = async () => {
      // Check if token exists first
      if (!token && typeof window !== 'undefined') {
        const storedToken = localStorage.getItem('token');
        if (!storedToken) {
          router.push('/login?redirect=/myprofile');
          return;
        }
      }

      try {
        const userData = await authAPI.profile();
        dispatch(setUser(userData));
      } catch (error: any) {
        // If 401, token is invalid - logout and redirect
        if (error?.response?.status === 401) {
          dispatch(logout());
          router.push('/login?redirect=/myprofile');
          return;
        }
        console.error("Failed to fetch profile", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [dispatch, token, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F0F2F4]">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F2F4]">
      {/* Top Navigation Bar */}
      <NavBar />

      {/* Main Content */}
      <main className="max-w-[1360px] mx-auto px-4 sm:px-6 md:px-8 xl:px-12 2xl:px-0 pt-8 pb-24 lg:py-8 flex flex-col gap-3 lg:gap-8">

        {/* Change Password Form */}
        <ChangePasswordForm />

        {/* Player Profile Card */}
        <PlayerProfileCard user={user} />

      </main>

    </div>
  );
}
