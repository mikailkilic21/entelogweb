import React, { useState, useEffect } from 'react';
import Logo from '../assets/yenilogo.png';
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
    User,
    Landmark
} from 'lucide-react';

const Sidebar = () => {
    const [dbConfig, setDbConfig] = useState(null);
    const [firms, setFirms] = useState([]);
    const [periods, setPeriods] = useState([]);
    const [selectedFirmNo, setSelectedFirmNo] = useState('');
    const [selectedPeriodNo, setSelectedPeriodNo] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
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

                // Emit event for other components to listen
                window.dispatchEvent(new CustomEvent('dbSettingsUpdated'));

                // Close menu
                setIsMenuOpen(false);
            }
        } catch (err) {
            console.error('Switch error:', err);
        }
    };

    const toggleMenu = () => {
        if (!isMenuOpen) {
            // Opening menu - reset temp values to current selected
            setTempFirmNo(selectedFirmNo);
            setTempPeriodNo(selectedPeriodNo);
        }
        setIsMenuOpen(!isMenuOpen);
    };

    const handleConfirmClick = async () => {
        if (!tempFirmNo || !tempPeriodNo) {
            alert('Lütfen firma ve dönem seçiniz.');
            return;
        }

        setSelectedFirmNo(tempFirmNo);
        setSelectedPeriodNo(tempPeriodNo);

        await switchFirmPeriod(tempFirmNo, tempPeriodNo);
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
        { path: '/banks', name: 'Bankalar', icon: <Landmark size={20} /> },
        { path: '/settings', name: 'Ayarlar', icon: <Settings size={20} /> },
    ];



    return (
        <div className="h-screen w-64 bg-slate-900 border-r border-slate-800 flex flex-col fixed left-0 top-0 z-50">
            {/* Logo Area & Firm Switcher */}
            <div className="p-4 border-b border-slate-800">
                <div className="flex items-center justify-center mb-6">
                    <img src={Logo} alt="Logo" className="w-auto h-24 object-contain" />
                </div>

                {/* Compact Firm Switcher */}
                {dbConfig && (
                    <div className="relative">
                        <button
                            onClick={toggleMenu}
                            className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-all ${isMenuOpen ? 'bg-slate-800 border-blue-500/50' : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'}`}
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                                    {dbConfig.firmNo || '??'}
                                </div>
                                <div className="text-left overflow-hidden">
                                    <div className="text-xs font-medium text-slate-300 truncate w-32" title={dbConfig.firmName}>
                                        {dbConfig.firmName || 'Firma Seçiniz'}
                                    </div>
                                    <div className="text-[10px] text-slate-500">
                                        Dönem: <span className="text-blue-400">{dbConfig.periodNo}</span>
                                    </div>
                                </div>
                            </div>
                            <Settings size={14} className={`text-slate-500 transition-transform duration-300 ${isMenuOpen ? 'rotate-90 text-blue-400' : ''}`} />
                        </button>

                        {/* Dropdown Menu */}
                        {isMenuOpen && (
                            <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-slate-800 rounded-xl border border-slate-700 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200">
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-[10px] font-medium text-slate-400 mb-1">FİRMA</label>
                                        <select
                                            value={tempFirmNo}
                                            onChange={handleFirmChange}
                                            className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded px-2 py-1.5 focus:outline-none focus:border-blue-500"
                                        >
                                            <option value="">Seçiniz...</option>
                                            {firms.map((firm) => (
                                                <option key={firm.nr} value={firm.nr}>
                                                    {firm.nr} - {firm.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-medium text-slate-400 mb-1">DÖNEM</label>
                                        <select
                                            value={tempPeriodNo}
                                            onChange={handlePeriodChange}
                                            disabled={!tempFirmNo}
                                            className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded px-2 py-1.5 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                                        >
                                            {periods.map((period) => (
                                                <option key={period.nr} value={period.nr.toString().padStart(2, '0')}>
                                                    {period.nr.toString().padStart(2, '0')} - {period.beginDate?.split('T')[0]} / {period.endDate?.split('T')[0]}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <button
                                        onClick={handleConfirmClick}
                                        className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition shadow-lg shadow-blue-500/20"
                                    >
                                        UYGULA & DEĞİŞTİR
                                    </button>
                                </div>
                            </div>
                        )}
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
