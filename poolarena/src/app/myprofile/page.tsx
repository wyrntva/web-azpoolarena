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
  // Cast user to any to access properties safely
  const { user, token } = useAppSelector((state) => state.auth) as any;

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
      <div className="min-h-screen flex items-center justify-center bg-[#e8e8e8]">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#e8e8e8]">
      {/* Top Navigation Bar */}
      <NavBar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">

        {/* Change Password Form */}
        <ChangePasswordForm />

        {/* Player Profile Card */}
        <PlayerProfileCard user={user} />

      </main>

    </div>
  );
}
