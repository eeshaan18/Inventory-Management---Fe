'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LayoutDashboard, Package, Barcode, LogOut, Hexagon, History } from 'lucide-react';

export default function Sidebar() {
    const pathname = usePathname();
    const { logout, user } = useAuth();

    // Define links based on roles
    const adminLinks = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Product Catalog', href: '/dashboard/products', icon: Package },
        { name: 'Scan Inventory', href: '/dashboard/scan', icon: Barcode },
        { name: 'Audit Log', href: '/dashboard/audit', icon: History }, // Preparing for Point 6
    ];

    const warehouseLinks = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Scan Inventory', href: '/dashboard/scan', icon: Barcode },
    ];

    // Select the correct array based on who is logged in
    const navItems = user?.role === 'admin' ? adminLinks : warehouseLinks;

    return (
        <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col min-h-screen">
            {/* Logo Area */}
            <div className="h-16 flex items-center px-6 border-b border-slate-800">
                <Hexagon className="h-6 w-6 text-indigo-500 mr-2" />
                <span className="text-white font-bold text-lg tracking-wide">SKDS Vault</span>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 py-6 px-4 space-y-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center px-4 py-3 rounded-xl transition-all ${
                                isActive
                                    ? 'bg-indigo-600/10 text-indigo-400 font-medium'
                                    : 'hover:bg-slate-800/50 hover:text-white'
                            }`}
                        >
                            <Icon className="h-5 w-5 mr-3" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* User Profile & Logout (Updated with Roles & Warehouse IDs) */}
            <div className="p-4 border-t border-slate-800">
                <div className="px-4 py-3 mb-2 bg-slate-800/30 rounded-xl">
                    <p className="text-sm text-slate-400 truncate">Logged in as</p>
                    <p className="text-white font-medium capitalize">{user?.username}</p>
                    
                    {/* Role & Warehouse Badge */}
                    <div className="mt-1.5 flex items-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            user?.role === 'admin' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                            <span className="capitalize">{user?.role}</span>
                            {user?.role === 'warehouse' && (user as any)?.warehouse_id && (
                                <span className="ml-1 border-l border-current pl-1">
                                    WH-{ (user as any).warehouse_id }
                                </span>
                            )}
                        </span>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="w-full flex items-center px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-all"
                >
                    <LogOut className="h-5 w-5 mr-3" />
                    Sign Out
                </button>
            </div>
        </aside>
    );
}