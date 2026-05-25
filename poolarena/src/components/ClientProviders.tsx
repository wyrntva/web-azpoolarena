"use client";
import '@ant-design/v5-patch-for-react-19/lib/index';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import { useState } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/stores/store';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 5 * 60 * 1000, // 5 minutes - tăng để giảm refetch
                gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
                refetchOnWindowFocus: false,
                refetchOnReconnect: false,
                retry: 1, // Giảm retry để tránh request nhiều lần
            },
        },
    }));

    return (
        <QueryClientProvider client={queryClient}>
            <Provider store={store}>
                <ConfigProvider
                    theme={{
                        token: {
                            colorPrimary: '#1677ff',
                            borderRadius: 8,
                        },
                    }}
                >
                    <ProtectedRoute>
                        {children}
                    </ProtectedRoute>
                </ConfigProvider>
            </Provider>
        </QueryClientProvider>
    );
}
