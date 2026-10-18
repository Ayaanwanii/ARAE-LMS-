/**
 * React Query Provider Setup
 * Handles server state management and caching
 */

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import devtools only on client side
const ReactQueryDevtools = dynamic(
    () =>
        import('@tanstack/react-query-devtools').then((mod) => ({
            default: mod.ReactQueryDevtools,
        })),
    { ssr: false }
);

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 60 * 1000, // 1 minute
                        refetchOnWindowFocus: false,
                        retry: 1,
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            {process.env.NODE_ENV === 'development' && (
                <div suppressHydrationWarning style={{ display: 'contents' }}>
                    <ReactQueryDevtools initialIsOpen={false} />
                </div>
            )}
        </QueryClientProvider>
    );
}
