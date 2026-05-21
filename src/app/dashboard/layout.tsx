'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    // Security Check: Kick unauthenticated users back to login
    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    // Don't flash the dashboard while checking authentication
    if (loading || !user) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <Sidebar />
            <main className="flex-1 overflow-x-hidden overflow-y-auto">
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}