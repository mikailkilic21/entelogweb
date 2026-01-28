import React, { useState, useEffect } from 'react';
import InvoiceList from '../components/InvoiceList';
import InvoiceDetailModal from '../components/InvoiceDetailModal';
import StatCard from '../components/StatCard';
import TopProductsChart from '../components/TopProductsChart';
import StockDistributionChart from '../components/StockDistributionChart';
import { Search, RotateCw, Loader2, Filter } from 'lucide-react';

const Invoices = () => {
    const [invoices, setInvoices] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'sales', 'purchase'
    const [dateFilter, setDateFilter] = useState('yearly'); // 'daily', 'weekly', 'monthly', 'yearly', 'custom'
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [search, setSearch] = useState('');
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [pieChartTab, setPieChartTab] = useState('purchase'); // 'purchase', 'sales'

    const fetchData = async () => {
        setLoading(true);
        try {
            // Build query params
            const params = new URLSearchParams();
            if (activeTab === 'sales') params.append('type', 'sales');
            if (activeTab === 'purchase') params.append('type', 'purchase');
            if (search) params.append('search', search);

            if (dateFilter === 'custom') {
                if (customStartDate) params.append('startDate', customStartDate);
                if (customEndDate) params.append('endDate', customEndDate);
            } else {
                params.append('period', dateFilter);
            }

            params.append('limit', '50');

            const [invoicesRes, statsRes] = await Promise.all([
                fetch(`/api/invoices?${params.toString()}`),
                fetch(`/api/invoices/stats?${params.toString()}`)
            ]);

            if (invoicesRes.ok) {
                const data = await invoicesRes.json();
                setInvoices(data);
            }
            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        if (!invoices.length) return;

        // Create CSV content
        const headers = ['Tarih', 'Fiş No', 'Cari', 'Türü', 'Tutar', 'Durum'];
        const csvContent = [
            headers.join(','),
            ...invoices.map(inv => [
                inv.date,
                inv.ficheNo,
                `"${inv.customer}"`, // Quote to handle commas
                inv.type,
                inv.amount,
                inv.paymentStatus
            ].join(','))
        ].join('\n');

        // Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `faturalar_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 500);
        return () => clearTimeout(timer);
    }, [activeTab, search, dateFilter, customStartDate, customEndDate]);

    return (
        <div className="p-8 w-full space-y-8 animate-fade-in pb-20">
            {/* Header & Global Filters */}
            <div className="flex flex-col gap-6 mb-8">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            Faturalar
                        </h1>
                        <p className="text-slate-400 mt-2">Satış ve alım faturalarını yönetin</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleExport}
                            className="p-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-white transition-all active:scale-95 flex items-center gap-2"
                            title="Excel'e Aktar"
                        >
                            <Filter size={20} className="md:hidden" />
                            <span className="hidden md:inline">Excel</span>
                        </button>
                        <button
                            onClick={fetchData}
                            className="p-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition-all shadow-lg shadow-blue-500/30 active:scale-95"
                        >
                            <RotateCw size={20} />
                        </button>
                    </div>
                </div>

                {/* Global Date Filters */}
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex bg-slate-900/50 p-1 rounded-lg border border-slate-800">
                        {[
                            { id: 'daily', label: 'Günlük' },
                            { id: 'weekly', label: 'Haftalık' },
                            { id: 'monthly', label: 'Aylık' },
                            { id: 'yearly', label: 'Yıllık' }
                        ].map(period => (
                            <button
                                key={period.id}
                                onClick={() => setDateFilter(period.id)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${dateFilter === period.id
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                    : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                {period.label}
                            </button>
                        ))}
                        <button
                            onClick={() => setDateFilter('custom')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${dateFilter === 'custom'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            Özel Tarih
                        </button>
                    </div>

                    {dateFilter === 'custom' && (
                        <div className="flex items-center gap-2 bg-slate-900/50 p-1 px-3 rounded-lg border border-slate-800 animate-fade-in-right">
                            <input
                                type="date"
                                value={customStartDate}
                                onChange={(e) => setCustomStartDate(e.target.value)}
                                className="bg-transparent text-white px-2 py-1 outline-none text-sm placeholder-slate-500"
                            />
                            <span className="text-slate-500">-</span>
                            <input
                                type="date"
                                value={customEndDate}
                                onChange={(e) => setCustomEndDate(e.target.value)}
                                className="bg-transparent text-white px-2 py-1 outline-none text-sm placeholder-slate-500"
                            />
                        </div>
                    )}
                </div>
            </div>
            {/* Top Section: Charts & Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Summary Cards + Main Chart */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Summary Cards */}
                    {stats && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-gradient-to-br from-emerald-600/20 to-emerald-600/5 border border-emerald-500/30 rounded-xl p-6 flex flex-col justify-between h-32">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-emerald-500/20 rounded-lg">
                                        <RotateCw className="text-emerald-400" size={20} />
                                    </div>
                                    <span className="text-sm text-slate-300">Toplam Satış</span>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">
                                        {stats.totalSales?.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                                    </p>
                                    <p className="text-xs text-emerald-400 mt-1">
                                        {stats.salesCount} Adet Fatura
                                    </p>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-rose-600/20 to-rose-600/5 border border-rose-500/30 rounded-xl p-6 flex flex-col justify-between h-32">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-rose-500/20 rounded-lg">
                                        <RotateCw className="text-rose-400" size={20} />
                                    </div>
                                    <span className="text-sm text-slate-300">Toplam Alış</span>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">
                                        {stats.totalPurchases?.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                                    </p>
                                    <p className="text-xs text-rose-400 mt-1">
                                        {stats.purchaseCount} Adet Fatura
                                    </p>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-blue-600/20 to-blue-600/5 border border-blue-500/30 rounded-xl p-6 flex flex-col justify-between h-32">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-blue-500/20 rounded-lg">
                                        <Filter className="text-blue-400" size={20} />
                                    </div>
                                    <span className="text-sm text-slate-300">Net Bakiye</span>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">
                                        {(stats.totalSales - stats.totalPurchases)?.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                                    </p>
                                    <p className="text-xs text-blue-400 mt-1">
                                        Günlük Satış: {stats.dailySales?.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Main Bar Chart - Top Customers */}
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-lg">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-white">En Yüksek Ciro Yapan Müşteriler</h3>
                                <p className="text-slate-400 text-sm">
                                    Ciro bazında ilk 5 müşteri
                                </p>
                            </div>
                        </div>

                        <div className="h-[300px]">
                            {stats && (
                                <TopProductsChart
                                    data={stats.topCustomers || []}
                                    title=""
                                    subtitle=""
                                    className="h-full !p-0 !bg-transparent !border-none !shadow-none"
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Pie Chart - Top Suppliers */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Pie Chart */}
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-lg flex flex-col h-[540px]">
                        <div className="flex justify-between items-center mb-4 px-1">
                            <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
                                <button
                                    onClick={() => setPieChartTab('purchase')}
                                    className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${pieChartTab === 'purchase'
                                        ? 'bg-rose-600 text-white shadow-lg'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-700'
                                        }`}
                                >
                                    Alım
                                </button>
                                <button
                                    onClick={() => setPieChartTab('sales')}
                                    className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${pieChartTab === 'sales'
                                        ? 'bg-emerald-600 text-white shadow-lg'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-700'
                                        }`}
                                >
                                    Satış
                                </button>
                            </div>
                        </div>
                        {stats && (
                            <div className="flex-1 -mx-6 -mb-6">
                                <StockDistributionChart
                                    data={pieChartTab === 'purchase' ? (stats.topSuppliers || []) : (stats.topCustomers || [])}
                                    title={pieChartTab === 'purchase' ? "En Çok Alım Yapılanlar" : "En Çok Satış Yapılanlar"}
                                    subtitle={pieChartTab === 'purchase' ? "Tedarikçi bazlı dağılım" : "Müşteri bazlı dağılım"}
                                    className="h-full !p-0 !bg-transparent !border-none !shadow-none"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div >



            {/* Filters & Search */}
            < div className="flex flex-col md:flex-row gap-4 items-center justify-between" >
                <div className="flex bg-slate-900/50 p-1 rounded-lg border border-slate-800">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`px-6 py-2 rounded-md font-medium transition-all ${activeTab === 'all'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Tümü
                    </button>
                    <button
                        onClick={() => setActiveTab('sales')}
                        className={`px-6 py-2 rounded-md font-medium transition-all ${activeTab === 'sales'
                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Satış
                    </button>
                    <button
                        onClick={() => setActiveTab('purchase')}
                        className={`px-6 py-2 rounded-md font-medium transition-all ${activeTab === 'purchase'
                            ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/30'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Alım
                    </button>
                </div>

                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                    <input
                        type="text"
                        placeholder="Fatura No veya Cari Adı ara..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                    />
                </div>
            </div >

            {/* List */}
            {
                loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-blue-500" size={48} />
                    </div>
                ) : (
                    <InvoiceList
                        invoices={invoices}
                        onInvoiceClick={setSelectedInvoice}
                    />
                )
            }

            {/* Modal */}
            {
                selectedInvoice && (
                    <InvoiceDetailModal
                        invoice={selectedInvoice}
                        onClose={() => setSelectedInvoice(null)}
                    />
                )
            }
        </div >
    );
};

export default Invoices;
