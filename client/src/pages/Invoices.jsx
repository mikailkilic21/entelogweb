import React, { useState, useEffect } from 'react';
import InvoiceList from '../components/InvoiceList';
import InvoiceDetailModal from '../components/InvoiceDetailModal';
import StatCard from '../components/StatCard';
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
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
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

            {/* Date Filters (Moved Up) */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
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

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <StatCard
                        title={`Toplam Satış ${dateFilter === 'daily' ? '(Gün)' : dateFilter === 'weekly' ? '(Hafta)' : dateFilter === 'monthly' ? '(Ay)' : dateFilter === 'yearly' ? '(Yıl)' : ''}`}
                        value={stats.totalSales?.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                        type="sales"
                    />
                    <StatCard
                        title={`Toplam Alım ${dateFilter === 'daily' ? '(Gün)' : dateFilter === 'weekly' ? '(Hafta)' : dateFilter === 'monthly' ? '(Ay)' : dateFilter === 'yearly' ? '(Yıl)' : ''}`}
                        value={stats.totalPurchases?.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                        type="expense"
                    />
                    <StatCard
                        title="Günlük Satış"
                        value={stats.dailySales?.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                        type="sales"
                    />
                    <StatCard
                        title={`Fatura Sayısı ${dateFilter === 'daily' ? '(Gün)' : dateFilter === 'weekly' ? '(Hafta)' : dateFilter === 'monthly' ? '(Ay)' : dateFilter === 'yearly' ? '(Yıl)' : ''}`}
                        value={`${stats.salesCount || 0} Satış / ${stats.purchaseCount || 0} Alım`}
                        type="info"
                    />
                </div>
            )}



            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
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
            </div>

            {/* List */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-blue-500" size={48} />
                </div>
            ) : (
                <InvoiceList
                    invoices={invoices}
                    onInvoiceClick={setSelectedInvoice}
                />
            )}

            {/* Modal */}
            {selectedInvoice && (
                <InvoiceDetailModal
                    invoice={selectedInvoice}
                    onClose={() => setSelectedInvoice(null)}
                />
            )}
        </div>
    );
};

export default Invoices;
