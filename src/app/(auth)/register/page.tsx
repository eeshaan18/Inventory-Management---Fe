'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Lock, User, Loader2, ShieldAlert, Package, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function RegisterPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'admin' | 'warehouse'>('warehouse');
    
    // NEW: State to hold the specific warehouse ID assignment
    const [warehouseId, setWarehouseId] = useState<number | ''>(''); 
    
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Dynamically assign the ID based on the input field
            const response = await api.post('/auth/register', { 
                username, 
                password, 
                role,
                warehouse_id: role === 'warehouse' ? warehouseId : null 
            });

            if (response.data.success) {
                router.push('/login');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to register account.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob animation-delay-2000"></div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                className="w-full max-w-md p-8 relative z-10"
            >
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Create Account</h1>
                        <p className="text-slate-300">Register a new user for the SKDS vault.</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-5">
                        <div className="flex p-1 bg-slate-900/50 rounded-xl border border-slate-700">
                            <button
                                type="button" onClick={() => setRole('admin')}
                                className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-sm font-medium transition-all ${
                                    role === 'admin' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                <ShieldAlert className="w-4 h-4 mr-2" />
                                Admin
                            </button>
                            <button
                                type="button" onClick={() => setRole('warehouse')}
                                className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-sm font-medium transition-all ${
                                    role === 'warehouse' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                <Package className="w-4 h-4 mr-2" />
                                Warehouse
                            </button>
                        </div>

                        <div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
                                    className="block w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                    placeholder="Username"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                    placeholder="Password"
                                />
                            </div>
                        </div>

                        {/* NEW: Dynamic Warehouse ID Input */}
                        <AnimatePresence>
                            {role === 'warehouse' && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }} 
                                    animate={{ opacity: 1, height: 'auto' }} 
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="relative pt-1">
                                        <div className="absolute inset-y-0 top-1 left-0 pl-4 flex items-center pointer-events-none">
                                            <Building2 className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <input
                                            type="number" required min="1" 
                                            value={warehouseId} onChange={(e) => setWarehouseId(Number(e.target.value))}
                                            className="block w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                            placeholder="Assign Warehouse ID (e.g., 1)"
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button
                            type="submit" disabled={isLoading}
                            className={`w-full flex items-center justify-center py-3 px-4 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all font-medium disabled:opacity-50 mt-2 ${
                                role === 'admin' ? 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500' : 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500'
                            }`}
                        >
                            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : `Register ${role === 'admin' ? 'Admin' : 'Worker'}`}
                        </button>

                        <div className="text-center mt-4 text-sm text-slate-400">
                            Already have an account? <Link href="/login" className="text-indigo-400 hover:text-indigo-300">Sign in</Link>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}