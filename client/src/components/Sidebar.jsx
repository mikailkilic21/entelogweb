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
    const [firms, setFirms] = useState([]);
    const [periods, setPeriods] = useState([]);
    const [selectedFirmNo, setSelectedFirmNo] = useState('');
    const [selectedPeriodNo, setSelectedPeriodNo] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [tempFirmNo, setTempFirmNo] = useState('');
    const [tempPeriodNo, setTempPeriodNo] = useState('');

    const fetchDbConfig = async () => {
        try {
            const res = await fetch('/api/settings/db');
            if (res.ok) {
                const data = await res.json();
                setDbConfig(data);
                setSelectedFirmNo(data.firmNo || '');
                setSelectedPeriodNo(data.periodNo || '');
                setTempFirmNo(data.firmNo || '');
                setTempPeriodNo(data.periodNo || '');
            }
        } catch (err) {
            console.error('Sidebar config fetch error:', err);
        }
    };

    const fetchFirms = async () => {
        try {
            const res = await fetch('/api/firms');
            if (res.ok) {
                const data = await res.json();
                setFirms(data);
            }
        } catch (err) {
            console.error('Firms fetch error:', err);
        }
    };

    const fetchPeriods = async (firmNo) => {
        try {
            const res = await fetch(`/api/firms/${firmNo}/periods`);
            if (res.ok) {
                const data = await res.json();
                setPeriods(data);
            }
        } catch (err) {
            console.error('Periods fetch error:', err);
            setPeriods([]);
        }
    };

    const handleFirmChange = async (e) => {
        const newFirmNo = e.target.value;
        setTempFirmNo(newFirmNo);

        if (newFirmNo) {
            // Fetch periods for this firm
            await fetchPeriods(newFirmNo);
            // Auto-set to period 01
            setTempPeriodNo('01');
        } else {
            setPeriods([]);
            setTempPeriodNo('');
        }
    };

    const handlePeriodChange = (e) => {
        const newPeriodNo = e.target.value;
        setTempPeriodNo(newPeriodNo);
    };

    const switchFirmPeriod = async (firmNo, periodNo) => {
        try {
            const res = await fetch('/api/settings/db/switch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ firmNo, periodNo })
            });

            if (res.ok) {
                // Refresh config and emit event for Dashboard to reload
                await fetchDbConfig();
                window.dispatchEvent(new CustomEvent('dbSettingsUpdated'));

                // Reload the page to reinitialize all data with new firm/period
                window.location.reload();
            }
        } catch (err) {
            console.error('Switch error:', err);
        }
    };

    const handleEditClick = () => {
        setIsEditing(true);
        setTempFirmNo(selectedFirmNo);
        setTempPeriodNo(selectedPeriodNo);
    };

    const handleConfirmClick = async () => {
        if (!tempFirmNo || !tempPeriodNo) {
            alert('Lütfen firma ve dönem seçiniz.');
            return;
        }

        setIsEditing(false);
        setSelectedFirmNo(tempFirmNo);
        setSelectedPeriodNo(tempPeriodNo);

        await switchFirmPeriod(tempFirmNo, tempPeriodNo);
    };

    const handleCancelClick = () => {
        setIsEditing(false);
        setTempFirmNo(selectedFirmNo);
        setTempPeriodNo(selectedPeriodNo);
    };


    useEffect(() => {
        fetchDbConfig();
        fetchFirms();

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

    // Fetch periods when firmNo is loaded from config
    useEffect(() => {
        if (selectedFirmNo) {
            fetchPeriods(selectedFirmNo);
        }
    }, [selectedFirmNo]);

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
                            <div className="mb-3 pb-3 border-b border-slate-700">
                                <span className="block text-xs font-medium text-slate-400 mb-1">Aktif Firma</span>
                                <div className="text-sm font-bold text-white uppercase tracking-tight truncate" title={dbConfig.firmName}>
                                    {dbConfig.firmName}
                                </div>
                            </div>
                        )}
                        <div className="space-y-3">
                            {/* Firma Dropdown */}
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Firma Seç</label>
                                <select
                                    value={tempFirmNo}
                                    onChange={handleFirmChange}
                                    disabled={!isEditing}
                                    className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded px-2 py-1.5 focus:outline-none focus:border-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <option value="">Seçiniz...</option>
                                    {firms.map((firm) => (
                                        <option key={firm.nr} value={firm.nr}>
                                            {firm.nr} - {firm.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Dönem Dropdown */}
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Dönem Seç</label>
                                <select
                                    value={tempPeriodNo}
                                    onChange={handlePeriodChange}
                                    disabled={!isEditing || !tempFirmNo}
                                    className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded px-2 py-1.5 focus:outline-none focus:border-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {periods.map((period) => (
                                        <option key={period.nr} value={period.nr.toString().padStart(2, '0')}>
                                            Dönem {period.nr.toString().padStart(2, '0')}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 mt-2">
                                {!isEditing ? (
                                    <button
                                        onClick={handleEditClick}
                                        className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded transition"
                                    >
                                        Değiştir
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={handleConfirmClick}
                                            className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded transition"
                                        >
                                            Tamam
                                        </button>
                                        <button
                                            onClick={handleCancelClick}
                                            className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium rounded transition"
                                        >
                                            İptal
                                        </button>
                                    </>
                                )}
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
