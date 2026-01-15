import React, { useState, useEffect } from 'react';
import { Search, RotateCw, Loader2, Filter, FileText, CheckCircle, Clock, XCircle } from 'lucide-react';
import OrderDetailModal from '../components/orders/OrderDetailModal'; // This will be created next
import StatCard from '../components/StatCard'; // Reusing StatCard

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'proposal', 'approved'
    const [shipmentStatusFilter, setShipmentStatusFilter] = useState(''); // 'S', 'B', 'K'
    const [dateFilter, setDateFilter] = useState('yearly');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [search, setSearch] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter !== 'all') params.append('status', statusFilter);

            // Add shipment status filter only if Approved is selected
            if (statusFilter === 'approved' && shipmentStatusFilter) {
                params.append('shipmentStatus', shipmentStatusFilter);
            }

            if (search) params.append('search', search);

            if (dateFilter === 'custom') {
                if (customStartDate) params.append('startDate', customStartDate);
                if (customEndDate) params.append('endDate', customEndDate);
            } else {
                params.append('period', dateFilter);
            }

            params.append('limit', '50');

            const res = await fetch(`/api/orders?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setOrders(data);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 500);
        return () => clearTimeout(timer);
    }, [statusFilter, shipmentStatusFilter, search, dateFilter, customStartDate, customEndDate]);

    // Reset shipment filter when switching away from approved
    useEffect(() => {
        if (statusFilter !== 'approved') {
            setShipmentStatusFilter('');
        }
    }, [statusFilter]);

    // Calculate quick stats from loaded data (or fetch from API if we implement getOrderStats)
    const stats = {
        totalAmount: orders.reduce((acc, o) => acc + (o.amount || 0), 0),
        count: orders.length,
        proposalCount: orders.filter(o => o.status === 1).length,
        approvedCount: orders.filter(o => o.status === 4).length
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                        Siparişler
                    </h1>
                    <p className="text-slate-400 mt-2">Satış siparişlerini ve teklifleri yönetin</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchData}
                        className="p-3 bg-orange-600 hover:bg-orange-500 rounded-lg text-white transition-all shadow-lg shadow-orange-500/30 active:scale-95"
                    >
                        <RotateCw size={20} />
                    </button>
                </div>
            </div>

            {/* Date Filters */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
                <div className="flex bg-slate-900/50 p-1 rounded-lg border border-slate-800">
                    {['daily', 'weekly', 'monthly', 'yearly'].map(period => (
                        <button
                            key={period}
                            onClick={() => setDateFilter(period)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${dateFilter === period
                                ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/30'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            {period === 'daily' ? 'Günlük' : period === 'weekly' ? 'Haftalık' : period === 'monthly' ? 'Aylık' : 'Yıllık'}
                        </button>
                    ))}
                    <button
                        onClick={() => setDateFilter('custom')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${dateFilter === 'custom'
                            ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/30'
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

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                    title="Toplam Tutar"
                    value={stats.totalAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                    type="sales"
                />
                <StatCard
                    title="Toplam Sipariş"
                    value={stats.count}
                    type="info"
                />
                <StatCard
                    title="Öneri (Teklif)"
                    value={stats.proposalCount}
                    type="warning"
                />
                <StatCard
                    title="Onaylı Sipariş"
                    value={stats.approvedCount}
                    type="success"
                />
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-col gap-2">
                    <div className="flex bg-slate-900/50 p-1 rounded-lg border border-slate-800">
                        <button
                            onClick={() => setStatusFilter('all')}
                            className={`px-6 py-2 rounded-md font-medium transition-all ${statusFilter === 'all'
                                ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/30'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            Tümü
                        </button>
                        <button
                            onClick={() => setStatusFilter('proposal')}
                            className={`px-6 py-2 rounded-md font-medium transition-all ${statusFilter === 'proposal'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            Öneri
                        </button>
                        <button
                            onClick={() => setStatusFilter('approved')}
                            className={`px-6 py-2 rounded-md font-medium transition-all ${statusFilter === 'approved'
                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            Onaylı
                        </button>
                    </div>

                    {/* Sub-filters for Approved Status */}
                    {statusFilter === 'approved' && (
                        <div className="flex bg-slate-900/30 p-1 rounded-lg border border-slate-800 animate-slide-in-top w-fit">
                            <button
                                onClick={() => setShipmentStatusFilter('')}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${shipmentStatusFilter === ''
                                    ? 'bg-slate-700 text-white'
                                    : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                Hepsi
                            </button>
                            <button
                                onClick={() => setShipmentStatusFilter('S')}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${shipmentStatusFilter === 'S'
                                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                    : 'text-slate-400 hover:text-blue-400'
                                    }`}
                            >
                                Sevk Bekliyor
                            </button>
                            <button
                                onClick={() => setShipmentStatusFilter('B')}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${shipmentStatusFilter === 'B'
                                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                    : 'text-slate-400 hover:text-yellow-400'
                                    }`}
                            >
                                Kısmi Sevk
                            </button>
                            <button
                                onClick={() => setShipmentStatusFilter('K')}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${shipmentStatusFilter === 'K'
                                    ? 'bg-slate-500/30 text-slate-300 border border-slate-500/30'
                                    : 'text-slate-400 hover:text-slate-300'
                                    }`}
                            >
                                Kapandı
                            </button>
                        </div>
                    )}
                </div>

                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                    <input
                        type="text"
                        placeholder="Fiş No veya Cari Adı ara..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all"
                    />
                </div>
            </div>

            {/* Orders List Table */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-lg">
                <div className="p-6 border-b border-white/10">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <FileText className="text-orange-400" />
                        Sipariş Listesi
                    </h2>
                </div>
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-orange-500" size={48} />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-white/5 text-slate-400 uppercase text-xs">
                                <tr>
                                    <th className="p-4">Tarih</th>
                                    <th className="p-4">Fiş No</th>
                                    <th className="p-4">Belge No</th>
                                    <th className="p-4">Cari</th>
                                    <th className="p-4">Tutar</th>
                                    <th className="p-4 text-center">Durum</th>
                                    <th className="p-4 text-center">Sevk Durumu</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {orders.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="p-8 text-center text-slate-500">
                                            Kayıt bulunamadı.
                                        </td>
                                    </tr>
                                ) : (
                                    orders.map((order, index) => (
                                        <tr
                                            key={index}
                                            onClick={() => setSelectedOrder(order)}
                                            className="hover:bg-white/5 transition-colors cursor-pointer group"
                                        >
                                            <td className="p-4 text-slate-300">{order.date}</td>
                                            <td className="p-4 font-mono text-slate-400 text-sm group-hover:text-orange-400 transition-colors">{order.ficheNo}</td>
                                            <td className="p-4 text-slate-400 text-sm">{order.documentNo || '-'}</td>
                                            <td className="p-4 font-medium text-white">
                                                {order.customer}
                                            </td>
                                            <td className="p-4 font-bold text-slate-200">
                                                {order.amount?.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${order.status === 1
                                                    ? 'bg-blue-500/20 text-blue-400'
                                                    : order.status === 4
                                                        ? 'bg-emerald-500/20 text-emerald-400'
                                                        : 'bg-slate-500/20 text-slate-400'
                                                    }`}>
                                                    {order.statusText}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                {order.status === 4 && order.shipmentStatus === 'S' && <span className="px-2 py-1 rounded-sm text-[10px] uppercase font-bold bg-blue-500/20 text-blue-400">Bekliyor</span>}
                                                {order.status === 4 && order.shipmentStatus === 'B' && <span className="px-2 py-1 rounded-sm text-[10px] uppercase font-bold bg-yellow-500/20 text-yellow-400">Kısmi Sevk</span>}
                                                {order.status === 4 && order.shipmentStatus === 'K' && <span className="px-2 py-1 rounded-sm text-[10px] uppercase font-bold bg-slate-500/30 text-slate-400">Kapandı</span>}
                                                {order.status !== 4 && <span className="text-slate-600">-</span>}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selectedOrder && (
                <OrderDetailModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                />
            )}
        </div>
    );
};

export default Orders;
