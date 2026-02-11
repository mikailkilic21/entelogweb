import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';
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

// Lazy load potentially heavy modal (includes html2pdf.js)
const InvoiceDetailModal = lazy(() => import('../components/InvoiceDetailModal'));

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
    const [activePieIndex, setActivePieIndex] = useState(0);

    const onPieEnter = (_, index) => {
        setActivePieIndex(index);
    };

    const renderActiveShape = (props) => {
        const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;
        return (
            <g>
                <text x={cx} y={cy} dy={4} textAnchor="middle" fill="#fff" className="text-xs font-mono font-bold">
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

            if (statsRes.ok) setStats(await statsRes.json());
            if (trendRes.ok) setTrendData(await trendRes.json());
            if (invoicesRes.ok) setInvoices(await invoicesRes.json());
            if (productsRes.ok) setTopProducts(await productsRes.json());
            if (customersRes.ok) setTopCustomers(await customersRes.json());
            if (suppliersRes.ok) setTopSuppliers(await suppliersRes.json());
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

    // Financial Summary Pie Data - Clean Colors (Emerald/Amber)
    const financialSummaryData = useMemo(() => {
        if (!stats) return [];
        return [
            { name: 'Satış', value: stats.totalSales || 0, color: '#10b981' }, // Emerald-500
            { name: 'Alış', value: stats.totalPurchases || 0, color: '#f59e0b' } // Amber-500
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

    // Radical Palette for Bars (Emerald, Cyan, Amber, Rose, Indigo - No Purple)
    const barColors = ['#10b981', '#06b6d4', '#f59e0b', '#f43f5e', '#6366f1'];

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="animate-spin text-primary" size={48} />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-full mx-auto space-y-8 animate-fade-in pb-20 bg-background text-text-primary min-h-screen">
            {/* Header - Brutalist / Clean */}
            <div className="flex justify-between items-start mb-8 border-b border-border pb-6">
                <div>
                    <h1 className="text-4xl font-sans font-bold text-white tracking-tight">
                        {companyInfo?.TITLE || companyInfo?.NAME || 'Yönetim Paneli'}
                    </h1>
                    {companyInfo ? (
                        <p className="text-text-secondary mt-1 font-mono text-sm uppercase tracking-wide opacity-70">
                            {companyInfo.ADDR1} • {companyInfo.CITY}
                        </p>
                    ) : (
                        <p className="text-text-secondary mt-1">İşletmenizin genel durumu</p>
                    )}
                </div>

                {/* Period Filter Buttons - Sharp Buttons */}
                <div className="flex bg-surface p-1 border border-border">
                    {['daily', 'weekly', 'monthly', 'yearly'].map(p => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-4 py-1.5 text-xs font-mono font-bold uppercase tracking-wider transition-all ${period === p
                                ? 'bg-primary text-white'
                                : 'text-text-secondary hover:text-white hover:bg-surface-highlight'
                                }`}
                        >
                            {p === 'daily' ? 'GÜNLÜK' : p === 'weekly' ? 'HAFTALIK' : p === 'monthly' ? 'AYLIK' : 'YILLIK'}
                        </button>
                    ))}
                    <button
                        onClick={fetchData}
                        className="p-1.5 ml-1 text-text-secondary hover:text-white transition-colors border-l border-border pl-2"
                        title="Yenile"
                    >
                        <RotateCw size={16} />
                    </button>
                </div>
            </div>

            {/* Stats Cards - Updated Palette */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="TOPLAM SATIŞ"
                    value={stats?.totalSales || 0}
                    trend={12.5}
                    period={period}
                    icon="trending-up"
                    color="emerald"  // Primary money color
                    isCurrency={true}
                />
                <StatCard
                    title="TOPLAM ALIŞ"
                    value={stats?.totalPurchases || 0}
                    trend={-2.4}
                    period={period}
                    icon="shopping-cart"
                    color="amber" // Secondary action color
                    isCurrency={true}
                />
                <StatCard
                    title="SATIŞ FATURASI"
                    value={stats?.salesCount || 0}
                    trend={5.2}
                    period={period}
                    icon="file-text"
                    color="cyan" // Replaces Purple
                />
                <StatCard
                    title="ALIŞ FATURASI"
                    value={stats?.purchaseCount || 0}
                    trend={-0.8}
                    period={period}
                    icon="package"
                    color="rose" // Alert/Cost
                />
            </div>

            {/* Compact Analytics Charts - 4 columns */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                {/* 1. Finansal Özet (Pie) */}
                <div className="bg-surface border border-border p-4">
                    <h3 className="text-xs font-mono font-bold text-text-secondary mb-3 uppercase tracking-wider border-b border-border/50 pb-2">
                        Finansal Dağılım
                    </h3>
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
                                paddingAngle={2}
                                dataKey="value"
                                onMouseEnter={onPieEnter}
                                stroke="none"
                            >
                                {financialSummaryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '2px', fontFamily: 'monospace' }}
                                labelStyle={{ color: '#f8fafc' }}
                                itemStyle={{ color: '#f8fafc' }}
                                formatter={(value) => `₺${(value / 1000).toFixed(1)}k`}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-4 mt-2 font-mono text-[10px] uppercase">
                        {financialSummaryData.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-1.5">
                                <div className="w-2 h-2" style={{ backgroundColor: item.color }}></div>
                                <span className="text-text-secondary tracking-widest">
                                    {item.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. Finansal Trend (Area) */}
                <div className="bg-surface border border-border p-4">
                    <h3 className="text-xs font-mono font-bold text-text-secondary mb-3 uppercase tracking-wider border-b border-border/50 pb-2">
                        Finansal Trend
                    </h3>
                    <ResponsiveContainer width="100%" height={160}>
                        <AreaChart data={formattedTrendData}>
                            <defs>
                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorPurchase" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.4} />
                            <XAxis
                                dataKey="formattedDate"
                                stroke="#64748b"
                                fontSize={9}
                                tickLine={false}
                                axisLine={false}
                                fontFamily="monospace"
                                interval="preserveStartEnd"
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '2px', fontFamily: 'monospace' }}
                                labelStyle={{ color: '#f8fafc' }}
                                itemStyle={{ color: '#f8fafc' }}
                                formatter={(value) => `₺${(value / 1000).toFixed(1)}k`}
                            />
                            <Area type="monotone" dataKey="sales" stroke="#10b981" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2} />
                            <Area type="monotone" dataKey="purchase" stroke="#f59e0b" fillOpacity={1} fill="url(#colorPurchase)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* 3. En Çok Satanlar (Bar) */}
                <div className="bg-surface border border-border p-4">
                    <h3 className="text-xs font-mono font-bold text-text-secondary mb-3 uppercase tracking-wider border-b border-border/50 pb-2">
                        En Çok Satanlar
                    </h3>
                    <ResponsiveContainer width="100%" height={160}>
                        <BarChart data={topProducts} layout="vertical" margin={{ left: 0, right: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} opacity={0.4} />
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="name"
                                type="category"
                                width={80}
                                tick={{ fill: '#94a3b8', fontSize: 9, fontFamily: 'monospace' }}
                                tickFormatter={(value) => value.length > 8 ? value.substring(0, 8) + '..' : value}
                            />
                            <Tooltip
                                cursor={{ fill: '#1e293b' }}
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '2px', fontFamily: 'monospace' }}
                                labelStyle={{ color: '#f8fafc' }}
                                itemStyle={{ color: '#f8fafc' }}
                                formatter={(value) => `₺${(value / 1000).toFixed(0)}k`}
                            />
                            <Bar dataKey="value" barSize={12} radius={[0, 2, 2, 0]}>
                                {topProducts.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* 4. En İyi Müşteriler (Bar) */}
                <div className="bg-surface border border-border p-4">
                    <h3 className="text-xs font-mono font-bold text-text-secondary mb-3 uppercase tracking-wider border-b border-border/50 pb-2">
                        En İyi Müşteriler
                    </h3>
                    <ResponsiveContainer width="100%" height={160}>
                        <BarChart data={topCustomers} layout="vertical" margin={{ left: 0, right: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} opacity={0.4} />
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="name"
                                type="category"
                                width={80}
                                tick={{ fill: '#94a3b8', fontSize: 9, fontFamily: 'monospace' }}
                                tickFormatter={(value) => value.length > 8 ? value.substring(0, 8) + '..' : value}
                            />
                            <Tooltip
                                cursor={{ fill: '#1e293b' }}
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '2px', fontFamily: 'monospace' }}
                                labelStyle={{ color: '#f8fafc' }}
                                itemStyle={{ color: '#f8fafc' }}
                                formatter={(value) => `₺${(value / 1000).toFixed(0)}k`}
                            />
                            <Bar dataKey="value" barSize={12} radius={[0, 2, 2, 0]}>
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

            {/* Modals - Lazy Loaded & Suspended */}
            {selectedInvoice && (
                <Suspense fallback={
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <div className="bg-surface p-4 rounded-xl border border-border flex items-center gap-3">
                            <Loader2 className="animate-spin text-primary" size={24} />
                            <span className="text-white font-mono text-sm">Fatura Detayı Yükleniyor...</span>
                        </div>
                    </div>
                }>
                    <InvoiceDetailModal
                        invoice={selectedInvoice}
                        onClose={() => setSelectedInvoice(null)}
                    />
                </Suspense>
            )}
        </div>
    );
};

export default Dashboard;
