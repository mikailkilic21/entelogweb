import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Package,
    FileText,
    ShoppingCart,
    Banknote,
    Settings,
    LogOut,
    User
} from 'lucide-react';

const Sidebar = () => {
    const [dbConfig, setDbConfig] = useState(null);

    const fetchDbConfig = async () => {
        try {
            const res = await fetch('/api/settings/db');
            if (res.ok) {
                const data = await res.json();
                setDbConfig(data);
            }
        } catch (err) {
            console.error('Sidebar config fetch error:', err);
        }
    };

    useEffect(() => {
        fetchDbConfig();

        // Listen for db settings updates
        const handleDbUpdate = () => {
            console.log('🔄 Sidebar: DB settings updated, refreshing...');
            fetchDbConfig();
        };

        window.addEventListener('dbSettingsUpdated', handleDbUpdate);

        return () => {
            window.removeEventListener('dbSettingsUpdated', handleDbUpdate);
        };
    }, []);

    const navItems = [
        { path: '/', name: 'Panel', icon: <LayoutDashboard size={20} /> },
        { path: '/accounts', name: 'Cari Hesaplar', icon: <Users size={20} /> },
        { path: '/products', name: 'Stok Yönetimi', icon: <Package size={20} /> },
        { path: '/invoices', name: 'Faturalar', icon: <FileText size={20} /> },
        { path: '/orders', name: 'Siparişler', icon: <ShoppingCart size={20} /> },
        { path: '/checks', name: 'Çek / Senet', icon: <Banknote size={20} /> },
        { path: '/settings', name: 'Ayarlar', icon: <Settings size={20} /> },
    ];

    return (
        <div className="h-screen w-64 bg-slate-900 border-r border-slate-800 flex flex-col fixed left-0 top-0 z-50">
            {/* Logo Area */}
            <div className="p-6 border-b border-slate-800">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    ENTELOG
                </h1>
                <p className="text-slate-500 text-xs mt-1">Web Dashboard</p>
                {dbConfig && (
                    <div className="mt-4 px-4 py-3 bg-slate-800 rounded-xl border border-slate-700 shadow-lg">
                        {dbConfig.firmName && (
                            <div className="mb-2 pb-2 border-b border-slate-700">
                                <span className="block text-xs font-medium text-slate-400 mb-0.5">Aktif Firma</span>
                                <div className="text-sm font-bold text-white uppercase tracking-tight truncate" title={dbConfig.firmName}>
                                    {dbConfig.firmName}
                                </div>
                            </div>
                        )}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                    <span className="text-xs font-medium text-slate-400">Firma No</span>
                                </div>
                                <span className="font-mono text-sm font-bold text-white bg-slate-900/50 px-2 py-0.5 rounded border border-slate-700/50">
                                    {dbConfig.firmNo}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                                    <span className="text-xs font-medium text-slate-400">Dönem No</span>
                                </div>
                                <span className="font-mono text-sm font-bold text-white bg-slate-900/50 px-2 py-0.5 rounded border border-slate-700/50">
                                    {dbConfig.periodNo}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                            }`
                        }
                    >
                        {item.icon}
                        <span className="font-medium">{item.name}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Footer / User Area */}
            <div className="p-4 border-t border-slate-800">
                {/* User Profile */}
                <div className="mb-4 px-4 py-3 bg-slate-800/30 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                            MK
                        </div>
                        <div className="overflow-hidden">
                            <h4 className="text-sm font-bold text-white truncate">MİKAİL KILIÇ</h4>
                            <a href="mailto:mikailkilic21@gmail.com" className="text-[10px] text-blue-400 hover:underline truncate block">
                                mikailkilic21@gmail.com
                            </a>
                        </div>
                    </div>
                </div>

                <button className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors">
                    <LogOut size={20} />
                    <span className="font-medium">Çıkış Yap</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
