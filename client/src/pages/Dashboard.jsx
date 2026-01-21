import React, { useState, useEffect, useMemo, useCallback } from 'react';
import StatCard from '../components/StatCard';
import InvoiceList from '../components/InvoiceList';
import SalesChart from '../components/SalesChart';
import TopProductsChart from '../components/TopProductsChart';
import TopAccountsChart from '../components/TopAccountsChart';
import { LayoutDashboard, Loader2, RefreshCw } from 'lucide-react';

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
                console.log(`✅ Stats loaded for ${period}:`, data);
                setStats(data);
            }
            if (trendRes.ok) {
                const data = await trendRes.json();
                setTrendData(data);
            }
            if (invoicesRes.ok) {
                const data = await invoicesRes.json();
                if (Array.isArray(data)) {
                    console.log(`✅ ${data.length} invoices loaded for ${period}`);
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



    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="animate-spin text-blue-500" size={48} />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        {companyInfo?.TITLE || companyInfo?.NAME || 'Yönetim Paneli'}
                    </h1>
                    {companyInfo ? (
                        <div className="mt-2 text-slate-400 text-sm space-y-1">
                            {/* Address Line - Only show if data exists */}
                            {(companyInfo.STREET || companyInfo.TOWN || companyInfo.CITY) && (
                                <p>
                                    {[companyInfo.STREET, companyInfo.TOWN, companyInfo.CITY].filter(Boolean).join(' / ')}
                                </p>
                            )}
                            {/* Tax info removed as requested */}
                        </div>
                    ) : (
                        <p className="text-slate-400 mt-2">Finansal durum özeti ve son hareketler</p>
                    )}
                </div>

                {/* Period Selector + Refresh Button */}
                <div className="flex gap-2 items-center">

                    {/* Period Buttons */}
                    <div className="flex bg-slate-800/50 rounded-lg p-1 gap-1">
                        {[
                            { value: 'daily', label: 'Günlük' },
                            { value: 'weekly', label: 'Haftalık' },
                            { value: 'monthly', label: 'Aylık' },
                            { value: 'yearly', label: 'Yıllık' }
                        ].map((item) => (
                            <button
                                key={item.value}
                                onClick={() => {
                                    console.log(`🔄 Period changed to: ${item.value}`);
                                    setPeriod(item.value);
                                }}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${period === item.value
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                    }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>

                    {/* Refresh Button */}
                    <button
                        onClick={fetchData}
                        className="p-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition-all shadow-lg shadow-blue-500/30 active:scale-95"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Toplam Satış"
                    value={stats?.totalSales?.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                    type="sales"
                />
                <StatCard
                    title="Toplam Alış"
                    value={stats?.totalPurchases?.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                    type="purchase"
                />
                <StatCard
                    title="Fiş Sayısı"
                    value={stats?.totalCount}
                    type="other"
                />
                <StatCard
                    title="Toplam KDV"
                    value={stats?.totalVat?.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                    type="tax"
                />
            </div>

            {/* Main Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <SalesChart data={trendData} period={period} />
                </div>
                <div className="lg:col-span-1">
                    <TopAccountsChart customersData={topCustomers} suppliersData={topSuppliers} />
                </div>
            </div>

            {/* Invoice List (Moved Up) */}
            <div className="grid grid-cols-1 gap-6">
                <InvoiceList invoices={invoices} onInvoiceClick={setSelectedInvoice} />
            </div>

            {/* Secondary Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-3">
                    <TopProductsChart data={topProducts} />
                </div>
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
