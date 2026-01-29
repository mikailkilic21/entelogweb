import React, { useState, useEffect, useMemo } from 'react';
import AccountDetailModal from '../components/AccountDetailModal';
import StatCard from '../components/StatCard';
import { Users, Building2, Search, Loader2, RotateCw } from 'lucide-react';
import {
    Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Sector
} from 'recharts';

const Accounts = () => {
    // UI State
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'customers', 'suppliers'
    const [searchTerm, setSearchTerm] = useState('');
    const [period, setPeriod] = useState('weekly'); // 'daily', 'weekly', 'monthly', 'yearly'
    const [selectedAccountId, setSelectedAccountId] = useState(null);
    const [activePieIndex, setActivePieIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    // Data State
    const [accounts, setAccounts] = useState([]);
    const [stats, setStats] = useState(null);
    const [trendData, setTrendData] = useState([]);

    useEffect(() => {
        fetchData();
        fetchStats();
    }, [activeTab]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        fetchTrendStats();
    }, [period]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const searchParam = searchTerm ? `&search=${searchTerm}` : '';
            const typeParam = activeTab === 'customers' ? '&type=customer' : activeTab === 'suppliers' ? '&type=supplier' : '';

            const res = await fetch(`/api/accounts?limit=50${searchParam}${typeParam}`);
            if (res.ok) {
                const data = await res.json();
                setAccounts(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Error fetching accounts:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/accounts/stats');
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Error fetching account stats:', error);
        }
    };

    const fetchTrendStats = async () => {
        try {
            // Using existing general financial trend endpoint which covers sales/purchases
            // Adjust this if a specific accounts-only trend endpoint is needed, 
            // but usually financial trend IS based on invoices/accounts.
            const res = await fetch(`/api/stats/trend?period=${period}`);
            if (res.ok) {
                const data = await res.json();
                setTrendData(data);
            }
        } catch (error) {
            console.error('Error fetching trend stats:', error);
        }
    };

    // --- Helpers ---
    const formatCurrency = (amount) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);

    // Pie Chart Render
    const renderActiveShape = (props) => {
        const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, value } = props;
        const total = (stats?.totalReceivables || 0) + (stats?.totalPayables || 0);
        const percent = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
        return (
            <g>
                <text x={cx} y={cy} dy={4} textAnchor="middle" fill="#fff" className="text-xs font-bold">{percent}%</text>
                <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 6} startAngle={startAngle} endAngle={endAngle} fill={fill} />
                <Sector cx={cx} cy={cy} startAngle={startAngle} endAngle={endAngle} innerRadius={outerRadius + 8} outerRadius={outerRadius + 10} fill={fill} />
            </g>
        );
    };

    const balancePieData = useMemo(() => {
        if (!stats) return [];
        return [
            { name: 'Alacaklarımız', value: stats.totalReceivables || 0, color: '#10b981' }, // Green
            { name: 'Borçlarımız', value: stats.totalPayables || 0, color: '#ef4444' }    // Red
        ].filter(i => i.value > 0);
    }, [stats]);

    const formattedTrendData = useMemo(() => {
        return trendData.map(item => {
            const d = new Date(item.date); // Might be formatted date string depending on backend
            // Backend currently returns pre-formatted 'date' strings like 'Mon', '2023-01' or '04:00'
            // So we mostly trust item.date but can refine if needed.
            return {
                ...item,
                amount: item.sales, // Sales = Receivables generated
                expense: item.purchase // Purchase = Payables generated
            };
        });
    }, [trendData]);

    // Combine Top Data for Bar Chart
    const topAccountsData = useMemo(() => {
        if (!stats) return [];
        // Combine top Customers (Receivables) and Suppliers (Payables)
        // We'll show top 3 of each or just top 5 overall magnitude

        // Transform to common format
        const customers = (stats.topCustomers || []).map(c => ({ name: c.name, value: c.value, type: 'Alacak', color: '#10b981' }));
        const suppliers = (stats.topSuppliers || []).map(s => ({ name: s.name, value: s.value, type: 'Borç', color: '#ef4444' }));

        // Merge and sort
        return [...customers, ...suppliers]
            .sort((a, b) => b.value - a.value)
            .slice(0, 5); // Take top 5
    }, [stats]);


    if (loading && !accounts.length) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="animate-spin text-blue-500" size={48} />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-full mx-auto space-y-8 text-slate-100 pb-24 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Cari Hesaplar</h1>
                    <p className="text-slate-400 mt-2">Müşteri ve tedarikçi yönetimi</p>
                </div>
                <div className="flex bg-slate-900/50 p-1 rounded-lg border border-slate-800 h-fit">
                    {['daily', 'weekly', 'monthly', 'yearly'].map(p => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${period === p ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-400 hover:text-white'}`}
                        >
                            {p === 'daily' ? 'Günlük' : p === 'weekly' ? 'Haftalık' : p === 'monthly' ? 'Aylık' : 'Yıllık'}
                        </button>
                    ))}
                    <button onClick={() => { fetchData(); fetchStats(); fetchTrendStats(); }} className="p-2 ml-2 text-slate-400 hover:text-white transition-colors" title="Yenile">
                        <RotateCw size={18} />
                    </button>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                    title="Toplam Müşteri"
                    value={stats?.totalCustomers || 0}
                    icon="users"
                    color="blue"
                />
                <StatCard
                    title="Toplam Tedarikçi"
                    value={stats?.totalSuppliers || 0}
                    icon="briefcase" // or building
                    color="purple"
                />
                <StatCard
                    title="Toplam Alacak"
                    value={stats?.totalReceivables || 0}
                    isCurrency={true}
                    icon="trending-up"
                    color="green"
                />
                <StatCard
                    title="Toplam Borç"
                    value={stats?.totalPayables || 0}
                    isCurrency={true}
                    icon="trending-down" // Map this or use alert-circle
                    color="orange" // Using orange as warning/debt
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* 1. Status Pie */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 backdrop-blur-xl">
                    <h3 className="text-xs font-semibold text-slate-400 mb-3">Borç / Alacak Dağılımı</h3>
                    <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                            <Pie
                                activeIndex={activePieIndex}
                                activeShape={renderActiveShape}
                                data={balancePieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={60}
                                paddingAngle={5}
                                dataKey="value"
                                onMouseEnter={(_, index) => setActivePieIndex(index)}
                            >
                                {balancePieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} formatter={(value) => `₺${(value / 1000).toFixed(1)}k`} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* 2. Trend Area */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 backdrop-blur-xl md:col-span-2">
                    <h3 className="text-xs font-semibold text-slate-400 mb-3">Finansal Hareket Trendi</h3>
                    <ResponsiveContainer width="100%" height={160}>
                        <AreaChart data={formattedTrendData}>
                            <defs>
                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorPurchase" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis
                                dataKey="date"
                                stroke="#64748b"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                interval="preserveStartEnd"
                            />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} labelStyle={{ color: '#f1f5f9' }} formatter={(value) => `₺${(value / 1000).toFixed(1)}k`} />
                            {/* Area for Sales (Green) */}
                            <Area type="monotone" dataKey="amount" stroke="#10b981" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2} name="Satış (Alacak)" />
                            {/* Area for Purchases (Red) */}
                            <Area type="monotone" dataKey="expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorPurchase)" strokeWidth={2} name="Alış (Borç)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* 3. Top Accounts Bar */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 backdrop-blur-xl">
                    <h3 className="text-xs font-semibold text-slate-400 mb-3">En Yüksek Bakiyeler</h3>
                    <ResponsiveContainer width="100%" height={160}>
                        <BarChart data={topAccountsData} layout="vertical" margin={{ left: 0, right: 0 }}>
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
                            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={12}>
                                {topAccountsData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Main Tabs and Search */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mt-8">
                <div className="flex p-1 bg-slate-900/50 rounded-xl border border-slate-800">
                    {['all', 'customers', 'suppliers'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                        >
                            {tab === 'all' && 'Tümü'}
                            {tab === 'customers' && 'Müşteriler'}
                            {tab === 'suppliers' && 'Tedarikçiler'}
                        </button>
                    ))}
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            type="text"
                            placeholder="Cari hesap ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-900/50 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>
                </div>
            </div>

            {/* Accounts Table List */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden shadow-xl backdrop-blur-xl">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-800/50 border-b border-slate-700">
                                <th className="text-left p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Cari Kodu</th>
                                <th className="text-left p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Ünvan</th>
                                <th className="text-right p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Bakiye</th>
                                <th className="text-center p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Son İşlem</th>
                                <th className="text-left p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Şehir/İlçe</th>
                                <th className="text-center p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Durum</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {accounts.length > 0 ? (
                                accounts.map((account) => (
                                    <tr
                                        key={account.id}
                                        onDoubleClick={() => setSelectedAccountId(account.id)}
                                        className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                                    >
                                        <td className="p-4 text-sm font-mono text-slate-400 group-hover:text-blue-400 transition-colors">
                                            {account.code}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${account.cardType === 1 ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                                                    <Building2 size={16} />
                                                </div>
                                                <span className="text-sm font-medium text-slate-200">{account.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className={`text-sm font-semibold ${account.balance > 0 ? 'text-green-400' : account.balance < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                                                {formatCurrency(Math.abs(account.balance))}
                                                <span className="text-xs ml-1 opacity-70">
                                                    {account.balance > 0 ? '(A)' : account.balance < 0 ? '(B)' : '-'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="text-sm text-slate-400">
                                                {account.lastOperationDate
                                                    ? new Date(account.lastOperationDate).toLocaleDateString('tr-TR')
                                                    : '-'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-slate-500">
                                            {[account.town, account.city].filter(Boolean).join(' / ')}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                                AKTİF
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="p-12 text-center text-slate-500">
                                        <Building2 size={48} className="mx-auto mb-4 opacity-20" />
                                        <p className="text-lg">Kayıt bulunamadı</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail Modal */}
            {selectedAccountId && (
                <AccountDetailModal
                    accountId={selectedAccountId}
                    onClose={() => setSelectedAccountId(null)}
                />
            )}
        </div>
    );
};

export default Accounts;
