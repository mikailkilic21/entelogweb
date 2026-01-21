import React, { useState, useEffect } from 'react';
import {
    FileText,
    Search,
    Calendar,
    ArrowUpRight,
    ArrowDownLeft,
    History,
    Filter,
    CheckCircle,
    AlertCircle,
    Clock,
    Briefcase,
    Building2,
    Users
} from 'lucide-react';

const Checks = () => {
    const [activeTab, setActiveTab] = useState('customer'); // 'customer' | 'own'
    const [checks, setChecks] = useState([]);
    const [upcomingChecks, setUpcomingChecks] = useState([]);
    const [upcomingFilter, setUpcomingFilter] = useState('week'); // 'today', 'week', 'month'
    const [recentChecks, setRecentChecks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchVal, setSearchVal] = useState('');
    const [dateFilter, setDateFilter] = useState('');

    useEffect(() => {
        fetchChecks();
        fetchUpcomingChecks();
        fetchRecentChecks();
    }, [activeTab]);

    useEffect(() => {
        // Debounce search slightly or just let it fly
        fetchChecks();
    }, [searchVal, dateFilter]);

    const fetchChecks = async () => {
        setLoading(true);
        try {
            let url = `/api/checks?type=${activeTab}`;
            if (searchVal) url += `&search=${searchVal}`;

            const res = await fetch(url);
            const data = await res.json();

            let filtered = data;
            if (dateFilter) {
                // Client side date filtering as before
                filtered = data.filter(c => c.dueDate === dateFilter);
            }
            setChecks(filtered);
        } catch (error) {
            console.error('Error fetching checks:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUpcomingChecks = async () => {
        try {
            const res = await fetch('/api/checks/upcoming');
            const data = await res.json();
            setUpcomingChecks(data);
        } catch (error) {
            console.error('Error fetching upcoming checks:', error);
        }
    };

    const fetchRecentChecks = async () => {
        try {
            const res = await fetch('/api/checks/recent');
            const data = await res.json();
            setRecentChecks(data);
        } catch (error) {
            console.error('Error fetching recent checks:', error);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY'
        }).format(amount);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('tr-TR');
    };

    const getStatusBadge = (status, type) => {
        const styles = {
            'Portföyde': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            'Ciro Edildi': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
            'Bankaya Verildi': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
            'Tahsil Edildi': 'bg-green-500/20 text-green-400 border-green-500/30',
            'Karşılıksız': 'bg-red-500/20 text-red-400 border-red-500/30',
            'Bekliyor': 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
            'Ödendi': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
            'Diğer': 'bg-slate-500/20 text-slate-400 border-slate-500/30',
        };
        const style = styles[status] || styles['Diğer'];
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${style}`}>
                {status}
            </span>
        );
    };

    // Filter Upcoming List
    const getFilteredUpcoming = () => {
        if (!upcomingChecks.length) return [];

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const nextWeek = new Date(now);
        nextWeek.setDate(now.getDate() + 7);

        const nextMonth = new Date(now);
        nextMonth.setMonth(now.getMonth() + 1);

        return upcomingChecks.filter(c => {
            if (!c.dueDate) return false;
            const d = new Date(c.dueDate);
            d.setHours(0, 0, 0, 0);

            if (d < now) return false; // Past due? Or maybe include today? user said "bugün"

            if (upcomingFilter === 'today') {
                return d.getTime() === now.getTime();
            }
            if (upcomingFilter === 'week') {
                return d <= nextWeek;
            }
            if (upcomingFilter === 'month') {
                return d <= nextMonth;
            }
            return true;
        });
    };

    const filteredUpcoming = getFilteredUpcoming();

    return (
        <div className="p-8 space-y-8 animate-fade-in text-slate-100 pb-24">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                        Çek / Senet İşlemleri
                    </h1>
                    <p className="text-slate-400 mt-2">Finansal hareketlerin detaylı takibi</p>
                </div>
            </div>

            {/* Upcoming Checks Section (Zebra List) */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-xl">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400">
                            <Clock size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Yaklaşan Çekler</h3>
                            <p className="text-xs text-slate-400">Önümüzdeki ödemeler ve tahsilatlar</p>
                        </div>
                    </div>
                    <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800">
                        {['today', 'week', 'month'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setUpcomingFilter(f)}
                                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${upcomingFilter === f
                                        ? 'bg-slate-800 text-white shadow-sm'
                                        : 'text-slate-500 hover:text-slate-300'
                                    }`}
                            >
                                {f === 'today' ? 'Bugün' : f === 'week' ? 'Bu Hafta' : 'Bu Ay'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-950 text-slate-500 uppercase font-medium text-xs">
                            <tr>
                                <th className="px-6 py-3">Vade</th>
                                <th className="px-6 py-3">Cari Ünvanı</th>
                                <th className="px-6 py-3">Banka</th>
                                <th className="px-6 py-3 text-right">Tutar</th>
                                <th className="px-6 py-3">Ciro Edilen / Ödenen</th>
                                <th className="px-6 py-3 text-center">Durum</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {filteredUpcoming.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                                        Seçilen dönemde yaklaşan çek bulunmamaktadır.
                                    </td>
                                </tr>
                            ) : (
                                filteredUpcoming.map((check, idx) => (
                                    <tr key={check.id} className={`${idx % 2 === 0 ? 'bg-slate-900/30' : 'bg-slate-900/10'} hover:bg-indigo-900/10 transition-colors`}>
                                        <td className="px-6 py-3 font-medium text-slate-200">
                                            {formatDate(check.dueDate)}
                                        </td>
                                        <td className="px-6 py-3 text-slate-300">
                                            <div className="flex items-center gap-2">
                                                <Users size={14} className="text-slate-500" />
                                                <span className="truncate max-w-[200px]" title={check.clientName}>{check.clientName || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-slate-400">
                                            <div className="flex items-center gap-2">
                                                <Building2 size={14} className="text-slate-600" />
                                                <span className="truncate max-w-[150px]">{check.bankName || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-right font-mono text-slate-200 font-medium">
                                            {formatCurrency(check.amount)}
                                        </td>
                                        <td className="px-6 py-3 text-slate-400">
                                            {check.endorseeName ? (
                                                <div className="flex items-center gap-2 text-orange-400/80">
                                                    <ArrowUpRight size={14} />
                                                    <span className="truncate max-w-[150px]" title={check.endorseeName}>{check.endorseeName}</span>
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            {getStatusBadge(check.statusLabel, check.type)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Main Tabs and Search */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mt-12">
                <div className="flex p-1 bg-slate-900/50 rounded-xl border border-slate-800">
                    <button
                        onClick={() => setActiveTab('customer')}
                        className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'customer'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                    >
                        Müşteri Çekleri
                    </button>
                    <button
                        onClick={() => setActiveTab('own')}
                        className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'own'
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                    >
                        Kendi Çeklerimiz
                    </button>
                </div>

                <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            type="text"
                            placeholder="Çek No / Portföy No"
                            value={searchVal}
                            onChange={(e) => setSearchVal(e.target.value)}
                            className="w-full bg-slate-900/50 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl backdrop-blur-xl overflow-hidden min-h-[400px]">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-950/50 text-xs uppercase text-slate-400 font-medium">
                            <tr>
                                <th className="px-6 py-4 text-left">Durum</th>
                                <th className="px-6 py-4 text-left">Vade</th>
                                <th className="px-6 py-4 text-left">Cari</th>
                                <th className="px-6 py-4 text-left">Seri / Portföy</th>
                                <th className="px-6 py-4 text-left">Banka</th>
                                <th className="px-6 py-4 text-right">Tutar</th>
                                <th className="px-6 py-4 text-right">Ciro / Alıcı</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {loading ? (
                                <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-500">Yükleniyor...</td></tr>
                            ) : checks.length === 0 ? (
                                <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-500">Kayıt bulunamadı.</td></tr>
                            ) : checks.map((check) => (
                                <tr key={check.id} className="hover:bg-slate-800/30 transition-colors group">
                                    <td className="px-6 py-4">{getStatusBadge(check.statusLabel, activeTab)}</td>
                                    <td className="px-6 py-4 text-slate-300 font-medium">{formatDate(check.dueDate)}</td>
                                    <td className="px-6 py-4 text-slate-300">
                                        <div className="truncate max-w-[180px]" title={check.clientName}>{check.clientName || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-slate-200 text-sm">{check.serialNo}</div>
                                        <div className="text-xs text-slate-500">{check.portfolioNo}</div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-400 text-sm">{check.bankName || '-'}</td>
                                    <td className="px-6 py-4 text-right font-mono text-slate-200 font-medium">{formatCurrency(check.amount)}</td>
                                    <td className="px-6 py-4 text-right text-sm text-slate-400">
                                        <div className="truncate max-w-[150px]" title={check.endorseeName}>{check.endorseeName || '-'}</div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Recent Checks (As requested at the bottom) */}
            <div className="mt-8 pt-8 border-t border-slate-800/50">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Son İşlemler</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 opacity-75 hover:opacity-100 transition-opacity">
                    {recentChecks.map((check) => (
                        <div key={check.id} className="bg-slate-950/30 border border-slate-800 p-3 rounded-lg flex flex-col gap-1">
                            <div className="flex justify-between items-start">
                                <span className={`w-2 h-2 rounded-full ${check.statusLabel === 'Portföyde' ? 'bg-blue-500' : 'bg-slate-500'
                                    }`}></span>
                                <span className="text-[10px] text-slate-500">{formatDate(check.dueDate)}</span>
                            </div>
                            <div className="text-sm font-mono text-slate-300">{formatCurrency(check.amount)}</div>
                            <div className="text-[10px] text-slate-600 truncate">{check.serialNo}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Checks;
