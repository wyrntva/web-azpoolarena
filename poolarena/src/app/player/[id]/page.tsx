"use client";

import React, { useEffect, useState } from "react";
import NavBar from '@/components/NavBar';
import { Spin } from 'antd';
import { useParams } from 'next/navigation';
import PlayerProfileCard from "@/components/profile/PlayerProfileCard";

export default function PlayerDetailPage() {
    const params = useParams();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPlayer = async () => {
            if (!params?.id) return;

            try {
                // Fetch user details by ID
                // Assuming there's an API endpoint to get a user by ID. 
                // If not, we might need to use the endpoint that allows fetching public profiles.
                // Based on previous file explorations, there wasn't an explicit getById on authAPI shown, 
                // but we can try fetching from the leaderboard list or a specific user endpoint.
                // For now, I'll assume we can fetch via a standard REST pattern or similar to profile

                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/pool-arena/users/${params.id}`);

                if (response.ok) {
                    const userData = await response.json();
                    setUser(userData);
                } else {
                    console.error("Failed to fetch player details");
                }
            } catch (error) {
                console.error("Error fetching player:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPlayer();
    }, [params?.id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#e8e8e8]">
                <Spin size="large" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-[#e8e8e8]">
                <NavBar />
                <div className="max-w-7xl mx-auto px-4 py-8 text-center">
                    <h2 className="text-xl font-bold text-gray-700">Không tìm thấy người chơi</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#e8e8e8] flex flex-col">
            {/* Top Navigation Bar */}
            <NavBar />

            {/* Main Content */}
            <main className="flex-grow flex items-center justify-center p-4">
                <div className="w-full max-w-7xl -translate-y-[40px]">
                    <PlayerProfileCard user={user} />
                </div>
            </main>

        </div>
    );
}
