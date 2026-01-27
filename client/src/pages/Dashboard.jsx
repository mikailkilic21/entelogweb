import React, { useState, useEffect, useMemo, useCallback } from 'react';
import StatCard from '../components/StatCard';
import InvoiceList from '../components/InvoiceList';
import { LayoutDashboard, Loader2, RotateCw } from 'lucide-react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    Sector
} from 'recharts';

import InvoiceDetailModal from '../components/InvoiceDetailModal';

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [invoices, setInvoices] = useState([]);
    const [trendData, setTrendData] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [topCustomers, setTopCustomers] = useState([]);
    const [topSuppliers, setTopSuppliers] = useState([]);
    const [companyInfo, setCompanyInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('weekly');
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [chartView1, setChartView1] = useState('amount'); // For Top Products/Customers toggle if needed
    const [activePieIndex, setActivePieIndex] = useState(0);

    const onPieEnter = (_, index) => {
        setActivePieIndex(index);
    };

    const renderActiveShape = (props) => {
        const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;
        return (
            <g>
                <text x={cx} y={cy} dy={4} textAnchor="middle" fill="#fff" className="text-xs font-bold">
                    {((value / (stats?.totalSales + stats?.totalPurchases)) * 100).toFixed(0)}%
                </text>
                <Sector
                    cx={cx}
                    cy={cy}
                    innerRadius={innerRadius}
                    outerRadius={outerRadius + 6}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    fill={fill}
                />
                <Sector
                    cx={cx}
                    cy={cy}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    innerRadius={outerRadius + 8}
                    outerRadius={outerRadius + 10}
                    fill={fill}
                />
            </g>
        );
    };

    const fetchData = useCallback(async () => {
        console.log(`📊 Fetching data for period: ${period}`);
        setLoading(true);
        try {
            const periodParam = `?period=${period}`;
            const [statsRes, invoicesRes, trendRes, productsRes, customersRes, suppliersRes, companyRes] = await Promise.all([
                fetch(`/api/stats${periodParam}`),
                fetch(`/api/invoices${periodParam}&limit=10`),
                fetch(`/api/stats/trend${periodParam}`),
                fetch(`/api/stats/top-products${periodParam}`),
                fetch(`/api/stats/top-customers${periodParam}`),
                fetch(`/api/stats/top-suppliers${periodParam}`),
                fetch('/api/settings/company')
            ]);

            if (statsRes.ok) {
                const data = await statsRes.json();
                setStats(data);
            }
            if (trendRes.ok) {
                const data = await trendRes.json();
                setTrendData(data);
            }
            if (invoicesRes.ok) {
                const data = await invoicesRes.json();
                if (Array.isArray(data)) {
                    setInvoices(data);
                }
            }
            if (productsRes.ok) {
                const data = await productsRes.json();
                if (Array.isArray(data)) setTopProducts(data);
            }
            if (customersRes.ok) {
                const data = await customersRes.json();
                if (Array.isArray(data)) setTopCustomers(data);
            }
            if (suppliersRes.ok) {
                const data = await suppliersRes.json();
                if (Array.isArray(data)) setTopSuppliers(data);
            }
            if (companyRes.ok) setCompanyInfo(await companyRes.json());

        } catch (error) {
            console.error("❌ Veri çekme hatası:", error);
        } finally {
            setLoading(false);
        }
    }, [period]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Financial Summary Pie Data
    const financialSummaryData = useMemo(() => {
        if (!stats) return [];
        return [
            { name: 'Satış', value: stats.totalSales || 0, color: '#8b5cf6' }, // Violet
            { name: 'Alış', value: stats.totalPurchases || 0, color: '#f43f5e' } // Rose
        ];
    }, [stats]);

    // Format Trend Data for Area Chart
    const formattedTrendData = useMemo(() => {
        return trendData.map(item => ({
            ...item,
            formattedDate: period === 'daily' ? item.date :
                period === 'weekly' ? item.date :
                    period === 'monthly' ? item.date.split(' ')[1] : item.date
        }));
    }, [trendData, period]);

    // Colors for Bar Charts
    const barColors = ['#f97316', '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b'];

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="animate-spin text-blue-500" size={48} />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-full mx-auto space-y-8 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        {companyInfo?.TITLE || companyInfo?.NAME || 'Yönetim Paneli'}
                    </h1>
                    {companyInfo ? (
                        <p className="text-slate-400 mt-2">{companyInfo.ADDR1} {companyInfo.CITY}</p>
                    ) : (
                        <p className="text-slate-400 mt-2">İşletmenizin genel durumu</p>
                    )}
                </div>

                {/* Period Filter Buttons */}
                <div className="flex bg-slate-900/50 p-1 rounded-lg border border-slate-800">
                    {['daily', 'weekly', 'monthly', 'yearly'].map(p => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${period === p
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            {p === 'daily' ? 'Günlük' : p === 'weekly' ? 'Haftalık' : p === 'monthly' ? 'Aylık' : 'Yıllık'}
                        </button>
                    ))}
                    <button
                        onClick={fetchData}
                        className="p-2 ml-2 text-slate-400 hover:text-white transition-colors"
                        title="Yenile"
                    >
                        <RotateCw size={18} />
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Toplam Satış"
                    value={stats?.totalSales || 0}
                    trend={12.5}
                    period={period}
                    icon="trending-up"
                    color="green"
                    isCurrency={true}
                />
                <StatCard
                    title="Toplam Alış"
                    value={stats?.totalPurchases || 0}
                    trend={-2.4}
                    period={period}
                    icon="shopping-cart"
                    color="blue"
                    isCurrency={true}
                />
                <StatCard
                    title="Satış Faturası"
                    value={stats?.salesCount || 0}
                    trend={5.2}
                    period={period}
                    icon="file-text"
                    color="purple"
                />
                <StatCard
                    title="Alış Faturası"
                    value={stats?.purchaseCount || 0}
                    trend={-0.8}
                    period={period}
                    icon="package"
                    color="orange"
                />
            </div>

            {/* Compact Analytics Charts - 4 columns */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                {/* 1. Finansal Özet (Pie) */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 backdrop-blur-xl">
                    <h3 className="text-xs font-semibold text-slate-400 mb-3">Finansal Dağılım</h3>
                    <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                            <Pie
                                activeIndex={activePieIndex}
                                activeShape={renderActiveShape}
                                data={financialSummaryData}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={60}
                                paddingAngle={5}
                                dataKey="value"
                                onMouseEnter={onPieEnter}
                            >
                                {financialSummaryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                labelStyle={{ color: '#f1f5f9' }}
                                formatter={(value) => `₺${(value / 1000).toFixed(1)}k`}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-4 mt-1">
                        {financialSummaryData.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                                <span className="text-[10px] text-slate-400">
                                    {item.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. Finansal Trend (Area) */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 backdrop-blur-xl">
                    <h3 className="text-xs font-semibold text-slate-400 mb-3">Finansal Trend</h3>
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
                                dataKey="formattedDate"
                                stroke="#64748b"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                interval="preserveStartEnd"
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                labelStyle={{ color: '#f1f5f9' }}
                                formatter={(value) => `₺${(value / 1000).toFixed(1)}k`}
                            />
                            <Area type="monotone" dataKey="sales" stroke="#10b981" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2} />
                            <Area type="monotone" dataKey="purchase" stroke="#ef4444" fillOpacity={1} fill="url(#colorPurchase)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* 3. En Çok Satanlar (Bar) */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 backdrop-blur-xl">
                    <h3 className="text-xs font-semibold text-slate-400 mb-3">En Çok Satanlar</h3>
                    <ResponsiveContainer width="100%" height={160}>
                        <BarChart data={topProducts} layout="vertical" margin={{ left: 0, right: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="name"
                                type="category"
                                width={80}
                                tick={{ fill: '#94a3b8', fontSize: 10 }}
                                tickFormatter={(value) => value.length > 10 ? value.substring(0, 10) + '..' : value}
                            />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                labelStyle={{ color: '#f1f5f9' }}
                                formatter={(value) => `₺${(value / 1000).toFixed(0)}k`}
                            />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={12}>
                                {topProducts.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* 4. En İyi Müşteriler (Bar) */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 backdrop-blur-xl">
                    <h3 className="text-xs font-semibold text-slate-400 mb-3">En İyi Müşteriler</h3>
                    <ResponsiveContainer width="100%" height={160}>
                        <BarChart data={topCustomers} layout="vertical" margin={{ left: 0, right: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="name"
                                type="category"
                                width={80}
                                tick={{ fill: '#94a3b8', fontSize: 10 }}
                                tickFormatter={(value) => value.length > 10 ? value.substring(0, 10) + '..' : value}
                            />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                labelStyle={{ color: '#f1f5f9' }}
                                formatter={(value) => `₺${(value / 1000).toFixed(0)}k`}
                            />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={12}>
                                {topCustomers.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

            </div>

            {/* Invoice List */}
            <div className="grid grid-cols-1 gap-6">
                <InvoiceList invoices={invoices} onInvoiceClick={setSelectedInvoice} />
            </div>

            {/* Modals */}
            {selectedInvoice && (
                <InvoiceDetailModal
                    invoice={selectedInvoice}
                    onClose={() => setSelectedInvoice(null)}
                />
            )}
        </div>
    );
};

export default Dashboard;
