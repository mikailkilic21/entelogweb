import React, { useState, useEffect } from 'react';
import { Search, RotateCw, Loader2, Filter, FileText, CheckCircle, Clock, XCircle, Upload } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import OrderDetailModal from '../components/orders/OrderDetailModal';
import AddOrderModal from '../components/orders/AddOrderModal';
import DiscountUploadModal from '../components/orders/DiscountUploadModal';
import StatCard from '../components/StatCard';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [allOrders, setAllOrders] = useState([]); // For charts - unfiltered
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false); // State for Add Modal
    const [isCopyMode, setIsCopyMode] = useState(false); // NEW: Copy mode state
    const [showDiscountModal, setShowDiscountModal] = useState(false); // NEW: Discount Upload Modal
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'proposal', 'approved'
    const [shipmentStatusFilter, setShipmentStatusFilter] = useState(''); // 'S', 'B', 'K'
    const [dateFilter, setDateFilter] = useState('yearly');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [search, setSearch] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [chartView1, setChartView1] = useState('count'); // 'count' or 'amount'
    const [chartView2, setChartView2] = useState('count'); // 'count' or 'amount'

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();

            // Special handling for Web Orders (Local)
            if (statusFilter === 'web') {
                params.append('source', 'local');
                // We don't append specific status here to see ALL local orders
            } else {
                if (statusFilter !== 'all') params.append('status', statusFilter);
            }

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
                // Map backend field names to frontend expected names
                const mappedData = data.map(order => ({
                    ...order,
                    customer: order.accountName || '-',
                    amount: order.netTotal || order.grossTotal || 0,
                    statusText: order.status === 1 ? 'Öneri' : order.status === 4 ? 'Onaylı' : 'Diğer'
                }));
                setOrders(mappedData);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch all orders for charts (unfiltered)
    const fetchAllOrders = async () => {
        try {
            const params = new URLSearchParams();
            params.append('period', 'yearly');
            params.append('limit', '1000');

            const res = await fetch(`/api/orders?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                const mappedData = data.map(order => ({
                    ...order,
                    customer: order.accountName || '-',
                    amount: order.netTotal || order.grossTotal || 0,
                    statusText: order.status === 1 ? 'Öneri' : order.status === 4 ? 'Onaylı' : 'Diğer'
                }));
                // Filter local orders here if needed or separate
                setAllOrders(mappedData);
            }
        } catch (error) {
            console.error('Error fetching all orders:', error);
        }
    };

    useEffect(() => {
        fetchAllOrders(); // Fetch all orders once on mount
    }, []);

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

    // Filter out 2025 carryover orders from allOrders
    let filteredOrders = allOrders.filter(o => o.date !== '2026-01-01');

    // Apply date filter to stats
    const now = new Date();
    if (dateFilter === 'daily') {
        const today = now.toISOString().split('T')[0];
        filteredOrders = filteredOrders.filter(o => o.date === today);
    } else if (dateFilter === 'weekly') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filteredOrders = filteredOrders.filter(o => new Date(o.date) >= weekAgo);
    } else if (dateFilter === 'monthly') {
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        filteredOrders = filteredOrders.filter(o => new Date(o.date) >= monthAgo);
    } else if (dateFilter === 'yearly') {
        const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        filteredOrders = filteredOrders.filter(o => new Date(o.date) >= yearAgo);
    } else if (dateFilter === 'custom' && customStartDate && customEndDate) {
        filteredOrders = filteredOrders.filter(o => {
            const orderDate = new Date(o.date);
            return orderDate >= new Date(customStartDate) && orderDate <= new Date(customEndDate);
        });
    }

    // Calculate quick stats from filtered orders
    const stats = {
        totalAmount: filteredOrders.reduce((acc, o) => acc + (o.amount || 0), 0),
        count: filteredOrders.length,
        proposalCount: filteredOrders.filter(o => o.status === 1).length,
        approvedCount: filteredOrders.filter(o => o.status === 4).length
    };

    // Chart data calculations (using allOrders - unfiltered, excluding 2025 carryover)

    const allStats = {
        proposalCount: filteredOrders.filter(o => o.status === 1).length,
        approvedCount: filteredOrders.filter(o => o.status === 4).length,
        proposalAmount: filteredOrders.filter(o => o.status === 1).reduce((acc, o) => acc + (o.amount || 0), 0) / 1000,
        approvedAmount: filteredOrders.filter(o => o.status === 4).reduce((acc, o) => acc + (o.amount || 0), 0) / 1000
    };

    const statusChartData = chartView1 === 'count' ? [
        { name: 'Öneri', value: allStats.proposalCount, color: '#f59e0b' },
        { name: 'Onaylı', value: allStats.approvedCount, color: '#8b5cf6' }
    ] : [
        { name: 'Öneri', value: allStats.proposalAmount, color: '#f59e0b' },
        { name: 'Onaylı', value: allStats.approvedAmount, color: '#8b5cf6' }
    ];

    const amountByStatusData = chartView2 === 'count' ? [
        { name: 'Öneri', value: allStats.proposalCount, color: '#06b6d4' },
        { name: 'Onaylı', value: allStats.approvedCount, color: '#ec4899' }
    ] : [
        { name: 'Öneri', value: allStats.proposalAmount, color: '#06b6d4' },
        { name: 'Onaylı', value: allStats.approvedAmount, color: '#ec4899' }
    ];

    // Monthly trend data (last 6 months from allOrders)
    const getMonthlyTrend = () => {
        const monthsData = {};
        const now = new Date();

        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthsData[monthKey] = { öneri: 0, onaylı: 0 };
        }


        allOrders.forEach(order => {
            // Skip 2025 carryover orders (01.01.2026)
            if (order.date && order.date !== '2026-01-01') {
                const orderMonth = order.date.substring(0, 7);
                if (monthsData[orderMonth]) {
                    if (order.status === 1) monthsData[orderMonth].öneri++;
                    if (order.status === 4) monthsData[orderMonth].onaylı++;
                }
            }
        });

        return Object.keys(monthsData).map(month => ({
            ay: month.substring(5, 7) + '/' + month.substring(2, 4),
            Öneri: monthsData[month].öneri,
            Onaylı: monthsData[month].onaylı
        }));
    };

    const monthlyTrendData = getMonthlyTrend();

    // Top customers by order count (excluding 2025 carryover)
    const getTopCustomers = () => {
        const customerMap = {};
        const colors = ['#14b8a6', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899'];

        allOrders.forEach(order => {
            // Skip 2025 carryover orders
            if (order.date === '2026-01-01') return;

            const customer = order.customer || 'Bilinmeyen';
            if (customer !== '-' && customer !== 'Bilinmeyen') {
                if (!customerMap[customer]) {
                    customerMap[customer] = { count: 0, amount: 0 };
                }
                customerMap[customer].count++;
                customerMap[customer].amount += order.amount || 0;
            }
        });

        return Object.entries(customerMap)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 5)
            .map(([name, data], index) => ({
                name: name.length > 25 ? name.substring(0, 25) + '...' : name,
                sipariş: data.count,
                color: colors[index]
            }));
    };

    const topCustomersData = getTopCustomers();

    // Top products - need to fetch from order items via API
    const [topProductsData, setTopProductsData] = React.useState([]);

    React.useEffect(() => {
        // Fetch top products from backend
        const fetchTopProducts = async () => {
            try {
                const res = await fetch('/api/orders/top-products?limit=5');
                if (res.ok) {
                    const data = await res.json();
                    const colors = ['#f97316', '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b'];
                    const formattedData = data.map((item, index) => ({
                        name: item.name.length > 25 ? item.name.substring(0, 25) + '...' : item.name,
                        sipariş: item.count,
                        color: colors[index]
                    }));
                    setTopProductsData(formattedData);
                } else {
                    // Fallback to empty array if endpoint doesn't exist yet
                    setTopProductsData([]);
                }
            } catch (error) {
                console.error('Error fetching top products:', error);
                setTopProductsData([]);
            }
        };

        if (allOrders.length > 0) {
            fetchTopProducts();
        }
    }, [allOrders]);

    return (
        <div className="p-8 max-w-full mx-auto space-y-8 animate-fade-in pb-20">
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
                        onClick={() => {
                            setShowAddModal(true);
                            setIsCopyMode(false);
                        }}
                        className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white transition-all shadow-lg shadow-emerald-500/30 active:scale-95 font-medium flex items-center gap-2"
                    >
                        <span>+ Yeni Sipariş</span>
                    </button>
                    <button
                        onClick={() => setShowDiscountModal(true)}
                        className="px-4 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition-all shadow-lg shadow-blue-500/30 active:scale-95 font-medium flex items-center gap-2"
                        title="İskonto PDF Yükle"
                    >
                        <Upload size={18} />
                    </button>
                    <button
                        onClick={fetchData}
                        className="p-3 bg-orange-600 hover:bg-orange-500 rounded-lg text-white transition-all shadow-lg shadow-orange-500/30 active:scale-95"
                    >
                        <RotateCw size={20} />
                    </button>
                </div>
            </div>

            {/* Date Filter Buttons - At the top */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setDateFilter('daily')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${dateFilter === 'daily'
                        ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/30'
                        : 'bg-slate-900/50 border border-slate-800 text-slate-400 hover:text-white hover:border-orange-500/50'
                        }`}
                >
                    Günlük
                </button>
                <button
                    onClick={() => setDateFilter('weekly')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${dateFilter === 'weekly'
                        ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/30'
                        : 'bg-slate-900/50 border border-slate-800 text-slate-400 hover:text-white hover:border-orange-500/50'
                        }`}
                >
                    Haftalık
                </button>
                <button
                    onClick={() => setDateFilter('monthly')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${dateFilter === 'monthly'
                        ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/30'
                        : 'bg-slate-900/50 border border-slate-800 text-slate-400 hover:text-white hover:border-orange-500/50'
                        }`}
                >
                    Aylık
                </button>
                <button
                    onClick={() => setDateFilter('yearly')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${dateFilter === 'yearly'
                        ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/30'
                        : 'bg-slate-900/50 border border-slate-800 text-slate-400 hover:text-white hover:border-orange-500/50'
                        }`}
                >
                    Yıllık
                </button>
                <button
                    onClick={() => setDateFilter('custom')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${dateFilter === 'custom'
                        ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/30'
                        : 'bg-slate-900/50 border border-slate-800 text-slate-400 hover:text-white hover:border-orange-500/50'
                        }`}
                >
                    Özel Tarih
                </button>
                {dateFilter === 'custom' && (
                    <div className="flex gap-2 items-center ml-4">
                        <input
                            type="date"
                            value={customStartDate}
                            onChange={(e) => setCustomStartDate(e.target.value)}
                            className="px-2 py-1 text-sm bg-slate-900/50 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-orange-500"
                        />
                        <span className="text-slate-400 text-sm">-</span>
                        <input
                            type="date"
                            value={customEndDate}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                            className="px-2 py-1 text-sm bg-slate-900/50 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-orange-500"
                        />
                    </div>
                )}
            </div>

            {/* Analytics Charts - 4 in one row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">

                {/* Order Status Distribution - Pie Chart with Toggle */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 backdrop-blur-xl">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-xs font-semibold text-slate-400">Sipariş Dağılımı</h3>
                        <div className="flex bg-slate-950 rounded-lg p-0.5 border border-slate-800">
                            <button
                                onClick={() => setChartView1('count')}
                                className={`px-2 py-1 rounded text-[9px] font-medium transition-all ${chartView1 === 'count'
                                    ? 'bg-slate-700 text-white'
                                    : 'text-slate-500 hover:text-slate-300'
                                    }`}
                            >
                                Adet
                            </button>
                            <button
                                onClick={() => setChartView1('amount')}
                                className={`px-2 py-1 rounded text-[9px] font-medium transition-all ${chartView1 === 'amount'
                                    ? 'bg-slate-700 text-white'
                                    : 'text-slate-500 hover:text-slate-300'
                                    }`}
                            >
                                Tutar
                            </button>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                            <Pie
                                data={statusChartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={35}
                                outerRadius={60}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {statusChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                labelStyle={{ color: '#f1f5f9' }}
                                formatter={(value) => chartView1 === 'amount' ? `${value.toFixed(0)} bin ₺` : value}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-2 mt-1">
                        {statusChartData.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                                <span className="text-[9px] text-slate-400">
                                    {item.name}: {chartView1 === 'amount' ? `${item.value.toFixed(0)}k` : item.value}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Monthly Trend - Line Chart */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 backdrop-blur-xl">
                    <h3 className="text-xs font-semibold text-slate-400 mb-3">Aylık Trend (Son 6 Ay)</h3>
                    <ResponsiveContainer width="100%" height={180}>
                        <LineChart data={monthlyTrendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="ay" stroke="#94a3b8" tick={{ fontSize: 9 }} />
                            <YAxis stroke="#94a3b8" tick={{ fontSize: 9 }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                labelStyle={{ color: '#f1f5f9' }}
                            />
                            <Legend wrapperStyle={{ fontSize: '9px' }} />
                            <Line type="monotone" dataKey="Öneri" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2 }} />
                            <Line type="monotone" dataKey="Onaylı" stroke="#10b981" strokeWidth={2} dot={{ r: 2 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Top Customers */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 backdrop-blur-xl">
                    <h3 className="text-xs font-semibold text-slate-400 mb-3">En Çok Sipariş Veren Müşteriler</h3>
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={topCustomersData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 9 }} />
                            <YAxis dataKey="name" type="category" stroke="#94a3b8" tick={{ fontSize: 8 }} width={80} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                labelStyle={{ color: '#f1f5f9' }}
                            />
                            <Bar dataKey="sipariş" radius={[0, 8, 8, 0]}>
                                {topCustomersData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Top Products */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 backdrop-blur-xl">
                    <h3 className="text-xs font-semibold text-slate-400 mb-3">En Çok Sipariş Edilen Malzemeler</h3>
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={topProductsData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 9 }} />
                            <YAxis dataKey="name" type="category" stroke="#94a3b8" tick={{ fontSize: 8 }} width={80} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                labelStyle={{ color: '#f1f5f9' }}
                            />
                            <Bar dataKey="sipariş" radius={[0, 8, 8, 0]}>
                                {topProductsData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
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
                        <button
                            onClick={() => setStatusFilter('web')}
                            className={`px-6 py-2 rounded-md font-medium transition-all ${statusFilter === 'web'
                                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                                : 'text-slate-400 hover:text-purple-400'
                                }`}
                        >
                            Web Siparişleri
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
                                onClick={() => setShipmentStatusFilter('waiting')}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${shipmentStatusFilter === 'waiting'
                                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                    : 'text-slate-400 hover:text-blue-400'
                                    }`}
                            >
                                Sevk Bekliyor
                            </button>
                            <button
                                onClick={() => setShipmentStatusFilter('partial')}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${shipmentStatusFilter === 'partial'
                                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                    : 'text-slate-400 hover:text-yellow-400'
                                    }`}
                            >
                                Kısmi Sevk
                            </button>
                            <button
                                onClick={() => setShipmentStatusFilter('closed')}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${shipmentStatusFilter === 'closed'
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
                                    <th className="p-4 text-center">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {orders.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="p-8 text-center text-slate-500">
                                            Kayıt bulunamadı.
                                        </td>
                                    </tr>
                                ) : (
                                    orders.map((order, index) => (
                                        <tr
                                            key={index}
                                            onClick={() => {
                                                // If it is a local order mock, allow editing
                                                if (order.isLocal) {
                                                    setShowAddModal(order); // Pass order object to trigger edit mode
                                                    setIsCopyMode(false);
                                                } else {
                                                    setSelectedOrder(order); // Standard view for SQL orders
                                                }
                                            }}
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
                                                    {order.status === 1 ? 'Öneri' : order.status === 4 ? 'Onaylı' : 'Diğer'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                {order.status === 4 ? (
                                                    order.shipmentStatus === 'waiting' || order.shipmentStatus === 'S' ? (
                                                        <span className="px-2 py-1 rounded-sm text-[10px] uppercase font-bold bg-blue-500/20 text-blue-400">Sevk Bekliyor</span>
                                                    ) : order.shipmentStatus === 'partial' || order.shipmentStatus === 'B' ? (
                                                        <span className="px-2 py-1 rounded-sm text-[10px] uppercase font-bold bg-yellow-500/20 text-yellow-400">Kısmi Sevk</span>
                                                    ) : order.shipmentStatus === 'closed' || order.shipmentStatus === 'K' ? (
                                                        <span className="px-2 py-1 rounded-sm text-[10px] uppercase font-bold bg-slate-500/30 text-slate-400">Kapandı</span>
                                                    ) : (
                                                        <span className="text-slate-600">-</span>
                                                    )
                                                ) : (
                                                    <span className="text-slate-600">-</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-center">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Stop row click
                                                        setShowAddModal(order);
                                                        setIsCopyMode(true);
                                                    }}
                                                    className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-emerald-400 transition-colors"
                                                    title="Siparişi Kopyala"
                                                >
                                                    <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded border border-slate-700">
                                                        <span className="text-xs">Kopyala</span>
                                                    </div>
                                                </button>
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
            {
                selectedOrder && (
                    <OrderDetailModal
                        order={selectedOrder}
                        onClose={() => setSelectedOrder(null)}
                    />
                )
            }

            {/* Add Order Modal (Used for both ADD and EDIT and COPY) */}
            {showAddModal && (
                <AddOrderModal
                    // If showAddModal is an object (order), pass it as 'editOrder'. If boolean true, it's new.
                    editOrder={typeof showAddModal === 'object' ? showAddModal : null}
                    isCopy={isCopyMode} // PASS isCopy FLAG
                    onClose={() => {
                        setShowAddModal(false);
                        setIsCopyMode(false);
                    }}
                    onSave={() => {
                        fetchData();
                        fetchAllOrders(); // Update charts too
                        setSelectedOrder(null); // Close detail modal if open
                        setShowAddModal(false);
                        setIsCopyMode(false);
                    }}
                    onDelete={async (orderId) => {
                        if (confirm('Bu siparişi silmek istediğinize emin misiniz?')) {
                            try {
                                const res = await fetch(`/api/orders/${orderId}`, { method: 'DELETE' }); // Backend delete route needed
                                if (res.ok) {
                                    fetchData();
                                    fetchAllOrders();
                                    setShowAddModal(false);
                                    setSelectedOrder(null);
                                } else {
                                    alert('Silinirken hata oluştu');
                                }
                            } catch (e) {
                                console.error('Delete error', e);
                            }
                        }
                    }}
                />
            )}

            {/* Discount Upload Modal */}
            {showDiscountModal && (
                <DiscountUploadModal
                    onClose={() => setShowDiscountModal(false)}
                />
            )}
        </div>
    );
};

export default Orders;
