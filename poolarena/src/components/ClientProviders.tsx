"use client";
import '@ant-design/v5-patch-for-react-19/lib/index';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import { useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/stores/store';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // Khi iOS Safari restore trang từ BFCache, event.persisted = true
        // Các chunk JS có thể đã bị xóa sau deploy mới → reload để lấy HTML + chunks mới
        const handlePageShow = (event: PageTransitionEvent) => {
            if (event.persisted) {
                window.location.reload();
            }
        };
        window.addEventListener('pageshow', handlePageShow);
        return () => window.removeEventListener('pageshow', handlePageShow);
    }, []);

    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 5 * 60 * 1000,
                gcTime: 10 * 60 * 1000,
                refetchOnWindowFocus: false,
                refetchOnReconnect: false,
                retry: 1,
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
                    {children}
                </ConfigProvider>
            </Provider>
        </QueryClientProvider>
    );
}
