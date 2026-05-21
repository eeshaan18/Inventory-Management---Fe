'use client';

import { useAuth } from '@/context/AuthContext';
import { Package, Barcode, TrendingUp, Filter, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Link from 'next/link';

// Types for our merged data
interface MergedStock {
    sku: string;
    name: string;
    category: string;
    quantity: number;
    warehouse_name: string;
    warehouse_id: number;
    last_updated: string;
}

export default function DashboardPage() {
    const { user } = useAuth();
    const [stockData, setStockData] = useState<MergedStock[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedWarehouse, setSelectedWarehouse] = useState<string>('All');
    const [warehouses, setWarehouses] = useState<string[]>(['All']);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch from both databases simultaneously
                const [productsRes, stockRes] = await Promise.all([
                    api.get('/products'),
                    api.get('/inventory/all-stock')
                ]);

                if (productsRes.data.success && stockRes.data.success) {
                    const products = productsRes.data.products;
                    const stock = stockRes.data.stock;

                    // Merge Postgres stock with Mongo product names
                    const merged: MergedStock[] = stock.map((s: any) => {
                        const productDetails = products.find((p: any) => p.sku === s.product_sku);
                        return {
                            sku: s.product_sku,
                            name: productDetails?.name || 'Unknown Product',
                            category: productDetails?.category || 'Uncategorized',
                            quantity: s.quantity,
                            warehouse_name: s.warehouse_name,
                            warehouse_id: s.warehouse_id,
                            last_updated: s.last_updated
                        };
                    });

                    setStockData(merged);

                    // Extract unique warehouse names for the Admin filter
                    const uniqueWarehouses = Array.from(new Set(merged.map(item => item.warehouse_name)));
                    setWarehouses(['All', ...uniqueWarehouses as string[]]);
                }
            } catch (error) {
                console.error("Failed to load dashboard data", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mb-4" />
                <p className="text-slate-500 font-medium">Syncing SKDS Vault...</p>
            </div>
        );
    }

    // ==========================================
    // VIEW 1: THE WAREHOUSE WORKER DASHBOARD
    // ==========================================

    if (user?.role === 'warehouse') {
        // FIX: Match the fallback logic from the scanner and handle number conversions
        const userWarehouseId = user?.warehouse_id ? Number(user.warehouse_id) : 1;
        
        // Filter strictly to this user's assigned warehouse ID
        const myStock = stockData.filter(item => Number(item.warehouse_id) === userWarehouseId);
        const totalItems = myStock.reduce((sum, item) => sum + item.quantity, 0);

        return (
            <div className="space-y-8">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                            Warehouse Dashboard
                        </h1>
                        <p className="text-slate-500 mt-1">
                            Logged in as <span className="font-semibold capitalize text-slate-700">{user.username}</span>. Viewing local stock.
                        </p>
                    </div>
                    <Link 
                        href="/dashboard/scan"
                        className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-medium shadow-sm"
                    >
                        <Barcode className="h-5 w-5 mr-2" />
                        Scan Items In/Out
                        <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center">
                        <div className="p-4 rounded-xl bg-indigo-500/10"><Package className="h-6 w-6 text-indigo-500" /></div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-slate-500">Total Local Units</p>
                            <p className="text-2xl font-semibold text-slate-900 mt-1">{totalItems}</p>
                        </div>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center">
                        <div className="p-4 rounded-xl bg-emerald-500/10"><TrendingUp className="h-6 w-6 text-emerald-500" /></div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-slate-500">Location ID</p>
                            <p className="text-2xl font-semibold text-slate-900 mt-1">Warehouse {userWarehouseId}</p>
                        </div>
                    </motion.div>
                </div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50">
                        <h3 className="text-lg font-semibold text-slate-800">Your Current Inventory</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white border-b border-slate-200 text-sm text-slate-500 uppercase tracking-wider">
                                    <th className="px-6 py-4 font-medium">Product / SKU</th>
                                    <th className="px-6 py-4 font-medium">Category</th>
                                    <th className="px-6 py-4 font-medium text-right">Quantity Available</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {myStock.length === 0 ? (
                                    <tr><td colSpan={3} className="px-6 py-12 text-center text-slate-500">No stock found in this warehouse.</td></tr>
                                ) : (
                                    myStock.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-900">{item.name}</div>
                                                <div className="font-mono text-xs text-indigo-600 mt-1">{item.sku}</div>
                                            </td>
                                            <td className="px-6 py-4"><span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium">{item.category}</span></td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold ${item.quantity > 10 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                    {item.quantity} Units
                                                </span>
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

    // ==========================================
    // VIEW 2: THE ADMIN GLOBAL DASHBOARD
    // ==========================================
    const filteredStock = selectedWarehouse === 'All' ? stockData : stockData.filter(item => item.warehouse_name === selectedWarehouse);
    const totalItems = filteredStock.reduce((sum, item) => sum + item.quantity, 0);
    const totalUniqueProducts = new Set(filteredStock.map(item => item.sku)).size;

    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                        Global Admin View
                    </h1>
                    <p className="text-slate-500 mt-1">Welcome back, <span className="capitalize">{user?.username}</span>. Here is the studio's live stock overview.</p>
                </div>
                <div className="flex items-center bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm">
                    <Filter className="h-4 w-4 text-slate-400 mr-2" />
                    <select 
                        value={selectedWarehouse} onChange={(e) => setSelectedWarehouse(e.target.value)}
                        className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none cursor-pointer"
                    >
                        {warehouses.map(wh => (
                            <option key={wh} value={wh}>{wh === 'All' ? 'All Locations' : wh}</option>
                        ))}
                    </select>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center">
                    <div className="p-4 rounded-xl bg-indigo-500/10"><Package className="h-6 w-6 text-indigo-500" /></div>
                    <div className="ml-4">
                        <p className="text-sm font-medium text-slate-500">Total Units</p>
                        <p className="text-2xl font-semibold text-slate-900 mt-1">{totalItems}</p>
                    </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center">
                    <div className="p-4 rounded-xl bg-emerald-500/10"><Barcode className="h-6 w-6 text-emerald-500" /></div>
                    <div className="ml-4">
                        <p className="text-sm font-medium text-slate-500">Unique SKUs</p>
                        <p className="text-2xl font-semibold text-slate-900 mt-1">{totalUniqueProducts}</p>
                    </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center">
                    <div className="p-4 rounded-xl bg-amber-500/10"><TrendingUp className="h-6 w-6 text-amber-500" /></div>
                    <div className="ml-4">
                        <p className="text-sm font-medium text-slate-500">Active View</p>
                        <p className="text-2xl font-semibold text-slate-900 mt-1">{selectedWarehouse}</p>
                    </div>
                </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50">
                    <h3 className="text-lg font-semibold text-slate-800">Global Inventory Levels</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white border-b border-slate-200 text-sm text-slate-500 uppercase tracking-wider">
                                <th className="px-6 py-4 font-medium">Product / SKU</th>
                                <th className="px-6 py-4 font-medium">Category</th>
                                <th className="px-6 py-4 font-medium">Location</th>
                                <th className="px-6 py-4 font-medium text-right">Quantity Available</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {filteredStock.length === 0 ? (
                                <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500">No stock found.</td></tr>
                            ) : (
                                filteredStock.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{item.name}</div>
                                            <div className="font-mono text-xs text-indigo-600 mt-1">{item.sku}</div>
                                        </td>
                                        <td className="px-6 py-4"><span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium">{item.category}</span></td>
                                        <td className="px-6 py-4 text-slate-600 font-medium">{item.warehouse_name}</td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold ${item.quantity > 10 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                {item.quantity} Units
                                            </span>
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