'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Lock, User, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // 1. Make the API call to verify the credentials
            const res = await api.post('/auth/login', { username, password });

            if (res.data.success) {
                // 2. Pass BOTH the verified User object AND the JWT token into your AuthContext
                login(res.data.user, res.data.token);

                // 3. Send them to the dashboard
                router.push('/dashboard');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 relative overflow-hidden">
            {/* Subtle background glow to match the vibe */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full mix-blend-multiply filter blur-[128px]"></div>

            <div className="bg-slate-800 p-8 rounded-[2rem] shadow-2xl border border-slate-700/50 w-full max-w-md relative z-10">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">SKDS Inventory</h1>
                    <p className="text-slate-400 text-sm">Enter your credentials to access the vault</p>
                </div>

                {error && (
                    <div className="mb-6 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-slate-500" />
                        </div>
                        <input
                            type="text"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="block w-full pl-11 pr-4 py-3 bg-slate-100 border-transparent rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                            placeholder="Username"
                        />
                    </div>

                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-slate-500" />
                        </div>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="block w-full pl-11 pr-4 py-3 bg-slate-100 border-transparent rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                            placeholder="Password"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex items-center justify-center py-3.5 px-4 rounded-xl text-white bg-[#5a4fcf] hover:bg-[#4b41b3] focus:outline-none transition-all font-medium mt-6 shadow-lg shadow-indigo-500/25"
                    >
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                            <>Sign In <ArrowRight className="ml-2 h-4 w-4" /></>
                        )}
                    </button>

                    {/* NEW: Registration Link */}
                    <div className="text-center mt-6 pt-6 border-t border-slate-700/50 text-sm text-slate-400">
                        Don't have an account?{' '}
                        <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                            Create a new account
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}