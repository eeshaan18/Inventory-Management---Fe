'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { History, Loader2, ArrowDownRight, ArrowUpRight, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

// Types for our merged audit data
interface AuditLog {
    id: number;
    sku: string;
    name: string;
    action: 'IN' | 'OUT';
    quantity: number;
    warehouse_name: string;
    created_at: string;
}

export default function AuditPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Security: Admins only
    useEffect(() => {
        if (user && user.role !== 'admin') {
            router.push('/dashboard');
        }
    }, [user, router]);

    useEffect(() => {
        const fetchAuditData = async () => {
            try {
                // Fetch from both databases to merge names with SKUs
                const [productsRes, auditRes] = await Promise.all([
                    api.get('/products'),
                    api.get('/inventory/audit')
                ]);

                if (productsRes.data.success && auditRes.data.success) {
                    const products = productsRes.data.products;
                    const rawLogs = auditRes.data.logs;

                    const mergedLogs: AuditLog[] = rawLogs.map((log: any) => {
                        const productDetails = products.find((p: any) => p.sku === log.product_sku);
                        return {
                            id: log.id,
                            sku: log.product_sku,
                            name: productDetails?.name || 'Unknown Product',
                            action: log.action,
                            quantity: log.quantity,
                            warehouse_name: log.warehouse_name,
                            created_at: log.created_at
                        };
                    });

                    setLogs(mergedLogs);
                }
            } catch (error) {
                console.error("Failed to load audit logs", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (user?.role === 'admin') {
            fetchAuditData();
        }
    }, [user]);

    if (user?.role !== 'admin') return null;

    return (
        <div className="space-y-6 relative min-h-[calc(100vh-4rem)]">
            <header>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center">
                    <History className="mr-2 h-6 w-6 text-indigo-600" />
                    Live Audit Trail
                </h1>
                <p className="text-slate-500 text-sm mt-1">Real-time log of all inbound and outbound inventory movements.</p>
            </header>

            <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
                className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-200 text-sm text-slate-500 uppercase tracking-wider">
                                <th className="px-6 py-4 font-medium">Transaction</th>
                                <th className="px-6 py-4 font-medium">Product Details</th>
                                <th className="px-6 py-4 font-medium">Location</th>
                                <th className="px-6 py-4 font-medium text-right">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-500 mb-2" />
                                        Fetching logs...
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                        No transactions recorded yet.
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                        {/* Action Status */}
                                        <td className="px-6 py-4">
                                            <div className={`inline-flex items-center px-3 py-1.5 rounded-lg font-bold text-sm ${
                                                log.action === 'IN' 
                                                    ? 'bg-emerald-100 text-emerald-700' 
                                                    : 'bg-rose-100 text-rose-700'
                                            }`}>
                                                {log.action === 'IN' ? (
                                                    <ArrowDownRight className="h-4 w-4 mr-1.5" />
                                                ) : (
                                                    <ArrowUpRight className="h-4 w-4 mr-1.5" />
                                                )}
                                                {log.action} : {log.quantity}
                                            </div>
                                        </td>
                                        
                                        {/* Product Details */}
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{log.name}</div>
                                            <div className="font-mono text-xs text-indigo-600 mt-0.5">{log.sku}</div>
                                        </td>

                                        {/* Location */}
                                        <td className="px-6 py-4 text-slate-600 font-medium">
                                            {log.warehouse_name}
                                        </td>

                                        {/* Time */}
                                        <td className="px-6 py-4 text-right text-slate-500 whitespace-nowrap">
                                            <div className="flex flex-col items-end">
                                                <span className="text-slate-900 font-medium">
                                                    {new Date(log.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </span>
                                                <span className="flex items-center text-xs mt-0.5">
                                                    <Clock className="h-3 w-3 mr-1" />
                                                    {new Date(log.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
}