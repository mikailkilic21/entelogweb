import React, { useState, useEffect, useMemo } from 'react';
import {
    FileText, Search, Calendar, ArrowUpRight, ArrowDownLeft, History, Filter,
    CheckCircle, AlertCircle, Clock, Briefcase, Building2, Users, Loader2, RotateCw
} from 'lucide-react';
import {
    Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Sector
} from 'recharts';
import StatCard from '../components/StatCard';

const Checks = () => {
    const [activeTab, setActiveTab] = useState('customer'); // 'customer' | 'own' | 'overdue' | 'recent'
    const [checks, setChecks] = useState([]);
    const [upcomingChecks, setUpcomingChecks] = useState([]);
    const [activeCheck, setActiveCheck] = useState(null);
    const [upcomingFilter, setUpcomingFilter] = useState('today');
    const [upcomingCheckTab, setUpcomingCheckTab] = useState('all');
    const [recentChecks, setRecentChecks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchVal, setSearchVal] = useState('');
    const [period, setPeriod] = useState('weekly');

    // Stats State
    const [checkStats, setCheckStats] = useState(null);
    const [trendData, setTrendData] = useState([]);
    const [topIssuers, setTopIssuers] = useState([]);
    const [activePieIndex, setActivePieIndex] = useState(0);

    useEffect(() => {
        fetchChecks();
        fetchUpcomingChecks();
        fetchRecentChecks();
    }, [activeTab]);

    useEffect(() => {
        fetchStats();
    }, [period]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchChecks();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [searchVal]);

    const fetchStats = async () => {
        try {
            const periodParam = `?period=${period}`;
            const [statsRes, trendRes, issuersRes] = await Promise.all([
                fetch('/api/checks/stats'),
                fetch(`/api/checks/stats/trend${periodParam}`),
                fetch(`/api/checks/stats/top-issuers${periodParam}`)
            ]);

            if (statsRes.ok) setCheckStats(await statsRes.json());
            if (trendRes.ok) setTrendData(await trendRes.json());
            if (issuersRes.ok) setTopIssuers(await issuersRes.json());

        } catch (error) {
            console.error('Error fetching check stats:', error);
        }
    };

    const fetchChecks = async () => {
        setLoading(true);
        try {
            let url = `/api/checks?type=${activeTab}`;
            if (activeTab === 'overdue') url = '/api/checks/overdue';
            else if (activeTab === 'recent') url = '/api/checks/recent';

            if (searchVal && activeTab !== 'recent') url += `${activeTab === 'overdue' ? '?' : '&'}search=${searchVal}`;

            const res = await fetch(url);
            const data = await res.json();
            if (Array.isArray(data)) setChecks(data);
            else setChecks([]);
        } catch (error) {
            console.error('Error fetching checks:', error);
            setChecks([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchUpcomingChecks = async () => {
        try {
            const res = await fetch('/api/checks/upcoming');
            const data = await res.json();
            if (Array.isArray(data)) setUpcomingChecks(data);
            else setUpcomingChecks([]);
        } catch (error) {
            console.error('Error fetching upcoming checks:', error);
            setUpcomingChecks([]);
        }
    };

    const fetchRecentChecks = async () => {
        try {
            const res = await fetch('/api/checks/recent');
            const data = await res.json();
            if (Array.isArray(data)) setRecentChecks(data);
            else setRecentChecks([]);
        } catch (error) {
            console.error('Error fetching recent checks:', error);
            setRecentChecks([]);
        }
    };

    const formatCurrency = (amount) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
    const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString('tr-TR') : '-';

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
        return <span className={`px-3 py-1 rounded-full text-xs font-medium border ${style}`}>{status}</span>;
    };

    const renderActiveShape = (props) => {
        const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, value } = props;
        const total = (checkStats?.portfolio?.total || 0) + (checkStats?.bank?.total || 0) + (checkStats?.endorsed?.total || 0);
        const percent = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
        return (
            <g>
                <text x={cx} y={cy} dy={4} textAnchor="middle" fill="#fff" className="text-xs font-bold">{percent}%</text>
                <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 6} startAngle={startAngle} endAngle={endAngle} fill={fill} />
                <Sector cx={cx} cy={cy} startAngle={startAngle} endAngle={endAngle} innerRadius={outerRadius + 8} outerRadius={outerRadius + 10} fill={fill} />
            </g>
        );
    };

    const statusPieData = useMemo(() => {
        if (!checkStats) return [];
        return [
            { name: 'Portföy', value: checkStats.portfolio?.total || 0, color: '#8b5cf6' },
            { name: 'Tahsil', value: checkStats.bank?.total || 0, color: '#10b981' },
            { name: 'Ciro', value: checkStats.endorsed?.total || 0, color: '#f59e0b' },
            { name: 'Karşılıksız', value: (checkStats.protest?.total || 0) + (checkStats.overdue?.total || 0), color: '#f43f5e' }
        ].filter(i => i.value > 0);
    }, [checkStats]);

    const formattedTrendData = useMemo(() => {
        return trendData.map(item => {
            const d = new Date(item.date);
            let fDate = item.date;
            try {
                if (period === 'monthly') fDate = d.toLocaleDateString('tr-TR', { month: 'long' });
                else if (period === 'weekly' || period === 'daily') fDate = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
                else if (period === 'yearly') fDate = d.getFullYear().toString();
            } catch (e) { }
            return { ...item, formattedDate: fDate };
        });
    }, [trendData, period]);

    const filteredUpcoming = useMemo(() => {
        if (!upcomingChecks.length) return [];
        const now = new Date(); now.setHours(0, 0, 0, 0);
        const nextWeek = new Date(now); nextWeek.setDate(now.getDate() + 7);
        const nextMonth = new Date(now); nextMonth.setMonth(now.getMonth() + 1);

        return upcomingChecks.filter(c => {
            if (!c.dueDate) return false;
            const d = new Date(c.dueDate); d.setHours(0, 0, 0, 0);
            if (d < now) return false; // Past
            if (upcomingFilter === 'today') return d.getTime() === now.getTime();
            if (upcomingFilter === 'week') return d <= nextWeek;
            if (upcomingFilter === 'month') return d <= nextMonth;
            return true;
        });
    }, [upcomingChecks, upcomingFilter]);

    // RENDER
    return (
        <div className="p-8 max-w-full mx-auto space-y-8 text-slate-100 pb-24">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Çek / Senet İşlemleri</h1>
                    <p className="text-slate-400 mt-2">Finansal hareketlerin detaylı takibi</p>
                </div>
                <div className="flex bg-slate-900/50 p-1 rounded-lg border border-slate-800 h-fit">
                    {['daily', 'weekly', 'monthly', 'yearly'].map(p => (
                        <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${period === p ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-400 hover:text-white'}`}>
                            {p === 'daily' ? 'Günlük' : p === 'weekly' ? 'Haftalık' : p === 'monthly' ? 'Aylık' : 'Yıllık'}
                        </button>
                    ))}
                    <button onClick={() => { fetchChecks(); fetchStats(); }} className="p-2 ml-2 text-slate-400 hover:text-white transition-colors" title="Yenile"><RotateCw size={18} /></button>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                    title="Portföydeki Çekler"
                    value={checkStats?.portfolio?.total || 0}
                    isCurrency={true}
                    icon="briefcase"
                    color="blue"
                />
                <StatCard
                    title="Tahsil Edilen"
                    value={checkStats?.bank?.total || 0}
                    isCurrency={true}
                    icon="check-circle"
                    color="green"
                />
                <StatCard
                    title="Ciro Edilen"
                    value={checkStats?.endorsed?.total || 0}
                    isCurrency={true}
                    icon="refresh-cw"
                    color="orange"
                />
                <StatCard
                    title="Riskli / Karşılıksız"
                    value={(checkStats?.protest?.total || 0) + (checkStats?.overdue?.total || 0)}
                    isCurrency={true}
                    icon="alert-circle"
                    color="red"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* 1. Status Pie */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 backdrop-blur-xl">
                    <h3 className="text-xs font-semibold text-slate-400 mb-3">Durum Dağılımı</h3>
                    <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                            <Pie
                                activeIndex={activePieIndex}
                                activeShape={renderActiveShape}
                                data={statusPieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={60}
                                paddingAngle={5}
                                dataKey="value"
                                onMouseEnter={(_, index) => setActivePieIndex(index)}
                            >
                                {statusPieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} formatter={(value) => `₺${(value / 1000).toFixed(1)}k`} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* 2. Trend Area */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 backdrop-blur-xl md:col-span-2">
                    <h3 className="text-xs font-semibold text-slate-400 mb-3">Vade Trendi</h3>
                    <ResponsiveContainer width="100%" height={160}>
                        <AreaChart data={formattedTrendData}>
                            <defs>
                                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis
                                dataKey="formattedDate"
                                stroke="#64748b"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                interval="preserveStartEnd"
                            />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} labelStyle={{ color: '#f1f5f9' }} formatter={(value) => `₺${(value / 1000).toFixed(1)}k`} />
                            <Area type="monotone" dataKey="amount" stroke="#3b82f6" fillOpacity={1} fill="url(#colorAmount)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* 3. Top Issuers Bar */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 backdrop-blur-xl">
                    <h3 className="text-xs font-semibold text-slate-400 mb-3">En Çok Çek Verenler</h3>
                    <ResponsiveContainer width="100%" height={160}>
                        <BarChart data={topIssuers} layout="vertical" margin={{ left: 0, right: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="name"
                                type="category"
                                width={80}
                                tick={{ fill: '#94a3b8', fontSize: 10 }}
                                tickFormatter={(value) => value.length > 10 ? value.substring(0, 10) + '..' : value}
                            />
                            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} labelStyle={{ color: '#f1f5f9' }} formatter={(value) => `₺${(value / 1000).toFixed(0)}k`} />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={12} fill="#8b5cf6" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Upcoming Checks Section (Zebra List) */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-xl">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400"><Clock size={20} /></div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Yaklaşan Çekler</h3>
                            <p className="text-xs text-slate-400">Önümüzdeki ödemeler ve tahsilatlar</p>
                        </div>
                    </div>
                    <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800">
                        {['today', 'week', 'month'].map((f) => (
                            <button key={f} onClick={() => setUpcomingFilter(f)} className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${upcomingFilter === f ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
                                {f === 'today' ? 'Bugün' : f === 'week' ? 'Bu Hafta' : 'Bu Ay'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="px-6 pb-4 bg-slate-900/80 border-b border-slate-800">
                    <div className="flex gap-2">
                        {['all', 'own', 'portfolio', 'endorsed'].map(tab => {
                            const count = filteredUpcoming.filter(check => {
                                if (tab === 'all') return true;
                                if (tab === 'own') return check.type === 'own' || (Number(check.status) >= 7 && Number(check.status) <= 13);
                                if (tab === 'portfolio') return Number(check.status) === 1;
                                if (tab === 'endorsed') return Number(check.status) === 2;
                                return false;
                            }).length;

                            return (
                                <button
                                    key={tab}
                                    onClick={() => setUpcomingCheckTab(tab)}
                                    className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${upcomingCheckTab === tab ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                                >
                                    {tab === 'all' ? `Tümü (${count})` :
                                        tab === 'own' ? `Kendi Çeklerimiz (${count})` :
                                            tab === 'portfolio' ? `Müşteri (Portföy) (${count})` :
                                                `Müşteri (Cirolu) (${count})`}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-950 text-slate-500 uppercase font-medium text-xs">
                            <tr>
                                <th className="px-6 py-3">Seri No</th>
                                <th className="px-6 py-3">Vade</th>
                                <th className="px-6 py-3">Firma Ünvanı</th>
                                <th className="px-6 py-3">Banka</th>
                                <th className="px-6 py-3 text-right">Tutar</th>
                                <th className="px-6 py-3">Ciro Edilen / Ödenen</th>
                                <th className="px-6 py-3 text-center">Durum</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {(() => {
                                const visibleChecks = filteredUpcoming.filter(check => {
                                    if (upcomingCheckTab === 'all') return true;
                                    if (upcomingCheckTab === 'own') return check.type === 'own' || (Number(check.status) >= 7 && Number(check.status) <= 13);
                                    if (upcomingCheckTab === 'portfolio') return Number(check.status) === 1;
                                    if (upcomingCheckTab === 'endorsed') return Number(check.status) === 2;
                                    return false;
                                });

                                if (visibleChecks.length === 0) {
                                    return <tr><td colSpan="7" className="px-6 py-8 text-center text-slate-500">Seçilen kategoride yaklaşan çek bulunmamaktadır.</td></tr>;
                                }

                                return visibleChecks.map((check, idx) => (
                                    <tr key={check.id} onClick={() => setActiveCheck(check)} className={`${idx % 2 === 0 ? 'bg-slate-900/30' : 'bg-slate-900/10'} hover:bg-indigo-900/10 transition-colors cursor-pointer group`}>
                                        <td className="px-6 py-3 font-mono text-slate-100 font-bold text-sm tracking-wide">{check.serialNo}</td>
                                        <td className="px-6 py-3 font-medium text-slate-200">{formatDate(check.dueDate)}</td>
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
                                        <td className="px-6 py-3 text-right font-mono text-slate-200 font-medium">{formatCurrency(check.amount)}</td>
                                        <td className="px-6 py-3 text-slate-400">
                                            {check.endorseeName ? <div className="flex items-center gap-2 text-orange-400/80"><ArrowUpRight size={14} /><span className="truncate max-w-[150px]">{check.endorseeName}</span></div> : '-'}
                                        </td>
                                        <td className="px-6 py-3 text-center">{getStatusBadge(check.statusLabel, check.type)}</td>
                                    </tr>
                                ));
                            })()}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Main Tabs and Search */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mt-12">
                <div className="flex p-1 bg-slate-900/50 rounded-xl border border-slate-800">
                    {['customer', 'own', 'overdue', 'recent'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                        >
                            {tab === 'customer' && 'Müşteri Çekleri'}
                            {tab === 'own' && 'Kendi Çeklerimiz'}
                            {tab === 'overdue' && 'Günü Geçenler'}
                            {tab === 'recent' && 'Son İşlemler'}
                        </button>
                    ))}
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input type="text" placeholder="Çek No / Portföy No" value={searchVal} onChange={(e) => setSearchVal(e.target.value)} className="w-full bg-slate-900/50 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
                    </div>
                </div>
            </div>

            {/* Main Tables */}
            <div className="space-y-8">
                {/* Customer Portfolio */}
                {(activeTab === 'customer' || activeTab === 'overdue') && (
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl backdrop-blur-xl overflow-hidden">
                        <div className="p-4 bg-slate-950/50 flex items-center gap-2 border-b border-slate-800">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <h3 className="font-semibold text-slate-200">Müşteri Çekleri (Portföyde)</h3>
                            <span className="text-xs text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full ml-auto">{checks.filter(c => c.category === 'customer_portfolio').length} Kayıt</span>
                        </div>
                        <table className="w-full">
                            <thead className="bg-slate-950/30 text-xs uppercase text-slate-400 font-medium"><tr><th className="px-6 py-3 text-left">Vade</th><th className="px-6 py-3 text-left">Cari</th><th className="px-6 py-3 text-left">Portföy No</th><th className="px-6 py-3 text-right">Tutar</th></tr></thead>
                            <tbody className="divide-y divide-slate-800">{checks.filter(c => c.category === 'customer_portfolio').map((check) => (
                                <tr key={check.id} onClick={() => setActiveCheck(check)} className="hover:bg-slate-800/30 transition-colors cursor-pointer"><td className="px-6 py-3 text-red-400 font-medium">{formatDate(check.dueDate)}</td><td className="px-6 py-3 text-slate-300">{check.clientName}</td><td className="px-6 py-3 text-slate-400 text-sm">{check.portfolioNo}</td><td className="px-6 py-3 text-right font-mono text-slate-200">{formatCurrency(check.amount)}</td></tr>
                            ))}</tbody>
                        </table>
                    </div>
                )}

                {/* Own Checks Table */}
                {(activeTab === 'own' || activeTab === 'overdue') && (
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl backdrop-blur-xl overflow-hidden">
                        <div className="p-4 bg-slate-950/50 flex items-center gap-2 border-b border-slate-800">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            <h3 className="font-semibold text-slate-200">Kendi Çeklerimiz {activeTab === 'overdue' ? '(Ödenmemiş)' : ''}</h3>
                            <span className="text-xs text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full ml-auto">{checks.filter(c => activeTab === 'own' || c.category === 'own_overdue').length} Kayıt</span>
                        </div>
                        <table className="w-full">
                            <thead className="bg-slate-950/30 text-xs uppercase text-slate-400 font-medium"><tr><th className="px-6 py-3 text-left">Vade</th><th className="px-6 py-3 text-left">Banka</th><th className="px-6 py-3 text-left">Seri No</th><th className="px-6 py-3 text-right">Tutar</th></tr></thead>
                            <tbody className="divide-y divide-slate-800">{checks.filter(c => activeTab === 'own' || c.category === 'own_overdue').map((check) => (
                                <tr key={check.id} onClick={() => setActiveCheck(check)} className="hover:bg-slate-800/30 transition-colors cursor-pointer"><td className="px-6 py-3 text-red-400 font-medium">{formatDate(check.dueDate)}</td><td className="px-6 py-3 text-slate-300">{check.bankName}</td><td className="px-6 py-3 text-slate-400 text-sm">{check.serialNo}</td><td className="px-6 py-3 text-right font-mono text-slate-200">{formatCurrency(check.amount)}</td></tr>
                            ))}</tbody>
                        </table>
                    </div>
                )}

                {/* Customer Endorsed */}
                {(activeTab === 'customer' || activeTab === 'overdue') && (
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl backdrop-blur-xl overflow-hidden opacity-80">
                        <div className="p-4 bg-slate-950/50 flex items-center gap-2 border-b border-slate-800">
                            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                            <h3 className="font-semibold text-slate-200">Müşteri Çekleri (Ciro Edildi)</h3>
                            <span className="text-xs text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full ml-auto">{checks.filter(c => c.category === 'customer_endorsed').length} Kayıt</span>
                        </div>
                        <table className="w-full">
                            <thead className="bg-slate-950/30 text-xs uppercase text-slate-400 font-medium"><tr><th className="px-6 py-3 text-left">Vade</th><th className="px-6 py-3 text-left">Cari</th><th className="px-6 py-3 text-left">Portföy No</th><th className="px-6 py-3 text-right">Tutar</th></tr></thead>
                            <tbody className="divide-y divide-slate-800">{checks.filter(c => c.category === 'customer_endorsed').map((check) => (
                                <tr key={check.id} onClick={() => setActiveCheck(check)} className="hover:bg-slate-800/30 transition-colors cursor-pointer"><td className="px-6 py-3 text-red-400 font-medium">{formatDate(check.dueDate)}</td><td className="px-6 py-3 text-slate-300">{check.clientName}</td><td className="px-6 py-3 text-slate-400 text-sm">{check.portfolioNo}</td><td className="px-6 py-3 text-right font-mono text-slate-200">{formatCurrency(check.amount)}</td></tr>
                            ))}</tbody>
                        </table>
                    </div>
                )}

                {/* Recent Table */}
                {activeTab === 'recent' && (
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl backdrop-blur-xl overflow-hidden">
                        <div className="p-4 bg-slate-950/50 border-b border-slate-800 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            <h3 className="font-semibold text-slate-200">Son 20 İşlem</h3>
                        </div>
                        <table className="w-full">
                            <thead className="bg-slate-950/30 text-xs uppercase text-slate-400 font-medium"><tr><th className="px-6 py-3 text-left">Tip</th><th className="px-6 py-3 text-left">Durum</th><th className="px-6 py-3 text-left">Vade</th><th className="px-6 py-3 text-left">Cari</th><th className="px-6 py-3 text-left">Tutar</th></tr></thead>
                            <tbody className="divide-y divide-slate-800">{checks.map((check) => (
                                <tr key={check.id} onClick={() => setActiveCheck(check)} className="hover:bg-slate-800/30 transition-colors cursor-pointer"><td className="px-6 py-3">{check.type === 'own' ? 'Kendi' : 'Müşteri'}</td><td className="px-6 py-3">{getStatusBadge(check.statusLabel, check.type)}</td><td className="px-6 py-3">{formatDate(check.dueDate)}</td><td className="px-6 py-3">{check.clientName}</td><td className="px-6 py-3 font-mono">{formatCurrency(check.amount)}</td></tr>
                            ))}</tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {activeCheck && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative">
                        <button onClick={() => setActiveCheck(null)} className="absolute top-4 right-4 p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors">✕</button>
                        <div className="p-6 border-b border-slate-800 bg-slate-800/30">
                            <h3 className="text-xl font-bold text-white">Çek Detayı</h3>
                            <div className="flex items-center gap-2 mt-2"><span className="text-slate-400 text-sm">{activeCheck.portfolioNo} / {activeCheck.serialNo}</span></div>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div><label className="text-xs text-slate-500 uppercase font-semibold">{activeCheck.type === 'own' ? 'Firma (Alıcı)' : 'Cari Hesap'}</label><p className="text-white font-medium text-lg mt-1 truncate">{activeCheck.clientName || 'Cari Yok'}</p></div>
                                <div className="text-right"><label className="text-xs text-slate-500 uppercase font-semibold">Tutar</label><p className="text-emerald-400 font-bold text-2xl mt-1 font-mono">{formatCurrency(activeCheck.amount)}</p></div>
                            </div>
                            <div className="grid grid-cols-2 gap-6 p-4 bg-slate-950/50 rounded-xl border border-slate-800">
                                <div><label className="text-xs text-slate-500 uppercase">Vade Tarihi</label><p className="text-slate-200 mt-1 font-semibold">{formatDate(activeCheck.dueDate)}</p></div>
                                <div><label className="text-xs text-slate-500 uppercase">Banka</label><p className="text-slate-200 mt-1 truncate">{activeCheck.bankName || '-'}</p></div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between py-2 border-b border-slate-800/50"><span className="text-slate-500 text-sm">Çek Durumu</span><span>{getStatusBadge(activeCheck.statusLabel, activeCheck.type)}</span></div>
                                <div className="flex justify-between py-2 border-b border-slate-800/50"><span className="text-slate-500 text-sm">Ciro Edilen</span><span className="text-slate-300 text-sm">{activeCheck.endorseeName || '-'}</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default Checks;
