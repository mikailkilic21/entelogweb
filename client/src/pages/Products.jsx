import React, { useState, useEffect } from 'react';
import ProductDetailModal from '../components/ProductDetailModal';
import TopProductsChart from '../components/TopProductsChart';
import StockDistributionChart from '../components/StockDistributionChart';
import { Package, Search, Loader2, RefreshCw, AlertTriangle, CheckCircle, Box, Warehouse } from 'lucide-react';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProductId, setSelectedProductId] = useState(null);
    const [warehouses, setWarehouses] = useState([]);
    const [selectedWarehouse, setSelectedWarehouse] = useState(null);

    const [sortBy, setSortBy] = useState('quantity'); // 'quantity' or 'amount'

    const fetchData = async () => {
        setLoading(true);
        try {
            const searchParam = searchTerm ? `&search=${searchTerm}` : '';
            const warehouseParam = selectedWarehouse !== null ? `&warehouse=${selectedWarehouse}` : '';
            const sortParam = `?limit=50&sortBy=${sortBy}`; // Default limit 50 as requested
            const [productsRes, statsRes] = await Promise.all([
                fetch(`/api/products${sortParam}${searchParam}${warehouseParam}`),
                fetch('/api/products/stats')
            ]);

            if (productsRes.ok) {
                const data = await productsRes.json();
                setProducts(Array.isArray(data) ? data : []);
            }
            if (statsRes.ok) {
                const data = await statsRes.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Fetch Warehouses once
        fetch('/api/products/warehouses')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setWarehouses(data);
            })
            .catch(err => console.error('Error fetching warehouses:', err));
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, sortBy, selectedWarehouse]);

    if (loading && !products.length) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="animate-spin text-blue-500" size={48} />
            </div>
        );
    }

    return (
        <div className="p-6 w-full space-y-8 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                        Stok Yönetimi
                    </h1>
                    <p className="text-slate-400 mt-2">Ürün ve malzeme stoklarını takip edin</p>
                </div>
                <button
                    onClick={fetchData}
                    className="p-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white transition-all shadow-lg shadow-emerald-500/30 active:scale-95"
                >
                    <RefreshCw size={20} />
                </button>
            </div>

            {/* Top Section: Checks & Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Summary Cards + Main Chart */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {stats && (
                            <>
                                <div className="bg-gradient-to-br from-indigo-600/20 to-indigo-600/5 border border-indigo-500/30 rounded-xl p-6 flex flex-col justify-between h-32">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Package className="text-indigo-400" size={24} />
                                        <span className="text-sm text-slate-300">Toplam Kart</span>
                                    </div>
                                    <p className="text-3xl font-bold text-white">{stats.totalProducts || 0}</p>
                                </div>

                                <div className="bg-gradient-to-br from-emerald-600/20 to-emerald-600/5 border border-emerald-500/30 rounded-xl p-6 flex flex-col justify-between h-32">
                                    <div className="flex items-center gap-3 mb-2">
                                        <CheckCircle className="text-emerald-400" size={24} />
                                        <span className="text-sm text-slate-300">Stoktaki Ürünler</span>
                                    </div>
                                    <p className="text-3xl font-bold text-white">{stats.productsInStock || 0}</p>
                                </div>

                                <div className="bg-gradient-to-br from-amber-600/20 to-amber-600/5 border border-amber-500/30 rounded-xl p-6 flex flex-col justify-between h-32">
                                    <div className="flex items-center gap-3 mb-2">
                                        <AlertTriangle className="text-amber-400" size={24} />
                                        <span className="text-sm text-slate-300">Negatif Stok</span>
                                    </div>
                                    <p className="text-3xl font-bold text-white">{stats.criticalStock || 0}</p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Main Bar Chart with Header Controls - En Çok Satanlar */}
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-lg">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-white">
                                    {sortBy === 'amount' ? 'En Yüksek Ciro' : 'En Çok Satanlar (Adet)'}
                                </h3>
                                <p className="text-slate-400 text-sm">
                                    {sortBy === 'amount' ? 'Ciro bazında ilk 5 ürün' : 'Satış adedi bazında ilk 5 ürün'}
                                </p>
                            </div>
                            <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
                                <button
                                    onClick={() => setSortBy('quantity')}
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${sortBy === 'quantity'
                                        ? 'bg-emerald-600 text-white shadow-lg'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-700'
                                        }`}
                                >
                                    Adet
                                </button>
                                <button
                                    onClick={() => setSortBy('amount')}
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${sortBy === 'amount'
                                        ? 'bg-emerald-600 text-white shadow-lg'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-700'
                                        }`}
                                >
                                    Tutar
                                </button>
                            </div>
                        </div>

                        <div className="h-[300px]">
                            {stats && (
                                <TopProductsChart
                                    data={sortBy === 'amount' ? (stats.topByAmount || []) : (stats.topByQuantity || [])}
                                    title=""
                                    subtitle=""
                                    className="h-full !p-0 !bg-transparent !border-none !shadow-none"
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Pie Chart + General Overview */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Pie Chart: Stock Distribution by Account */}
                    {stats && <StockDistributionChart data={stats.topAccounts || []} className="h-[540px]" />}


                </div>
            </div>

            {/* Search and Sort Controls */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center pt-4">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Ürün kodu veya adı ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
                    />
                </div>

                {/* Warehouse Filter */}
                <div className="relative w-full md:w-64">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <Warehouse size={18} />
                    </div>
                    <select
                        value={selectedWarehouse !== null ? selectedWarehouse : ''}
                        onChange={(e) => setSelectedWarehouse(e.target.value !== '' ? Number(e.target.value) : null)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-800 rounded-lg text-white appearance-none focus:outline-none focus:border-emerald-500/50 transition-colors cursor-pointer"
                    >
                        <option value="">Tüm Ambarlar</option>
                        {warehouses.map(w => (
                            <option key={w.id} value={w.id}>{w.name} (#{w.number})</option>
                        ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                </div>

                <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700 w-full md:w-auto overflow-x-auto">
                    <button
                        onClick={() => setSortBy('stock')}
                        className={`flex-1 md:flex-none px-6 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 whitespace-nowrap ${sortBy === 'stock'
                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                            : 'text-slate-400 hover:text-white hover:bg-slate-700'
                            }`}
                    >
                        <Package size={16} />
                        Gerçek Stok
                    </button>
                    <button
                        onClick={() => setSortBy('quantity')}
                        className={`flex-1 md:flex-none px-6 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 whitespace-nowrap ${sortBy === 'quantity'
                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                            : 'text-slate-400 hover:text-white hover:bg-slate-700'
                            }`}
                    >
                        <Box size={16} />
                        Satış Miktarı
                    </button>
                    <button
                        onClick={() => setSortBy('amount')}
                        className={`flex-1 md:flex-none px-6 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 whitespace-nowrap ${sortBy === 'amount'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                            : 'text-slate-400 hover:text-white hover:bg-slate-700'
                            }`}
                    >
                        <CheckCircle size={16} />
                        Satış Tutarı
                    </button>
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-800/80 border-b border-slate-700">
                                <th className="text-left p-4 text-sm font-medium text-slate-400 uppercase tracking-wider">Kod</th>
                                <th className="text-left p-4 text-sm font-medium text-slate-400 uppercase tracking-wider">Ürün Adı</th>
                                <th className="text-right p-4 text-sm font-medium text-slate-400 uppercase tracking-wider">Gerçek Stok</th>
                                <th className="text-left p-4 text-sm font-medium text-slate-400 uppercase tracking-wider">Marka</th>
                                <th className="text-right p-4 text-sm font-medium text-slate-400 uppercase tracking-wider">Satış Tutarı</th>
                                <th className="text-right p-4 text-sm font-medium text-slate-400 uppercase tracking-wider">Satış Miktarı</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {products.length > 0 ? (
                                products.map((product) => (
                                    <tr
                                        key={product.id}
                                        onClick={() => setSelectedProductId(product.id)}
                                        className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                                    >
                                        <td className="p-4 text-sm font-mono text-slate-400 group-hover:text-emerald-400 transition-colors">
                                            {product.code}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-slate-800/50 text-slate-400">
                                                    <Box size={16} />
                                                </div>
                                                <span className="text-sm font-medium text-white">{product.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex flex-col items-end gap-1">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${product.realStock > 0
                                                    ? 'bg-purple-500/20 text-purple-400'
                                                    : product.realStock < 0
                                                        ? 'bg-red-500/20 text-red-400'
                                                        : 'bg-slate-700 text-slate-400'
                                                    }`}>
                                                    {product.realStock.toLocaleString('tr-TR')}
                                                </span>
                                                {product.transitStock > 0 && (
                                                    <span className="text-[10px] text-amber-500 font-medium">
                                                        Yolda: {product.transitStock.toLocaleString('tr-TR')}
                                                    </span>
                                                )}
                                                {product.reservedStock > 0 && (
                                                    <span className="text-[10px] text-slate-500">
                                                        Rez: {product.reservedStock.toLocaleString('tr-TR')}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-slate-400">
                                            {product.brand || '-'}
                                        </td>
                                        <td className="p-4 text-right text-sm font-medium text-emerald-400 font-mono">
                                            {product.salesAmount > 0 ? `${product.salesAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺` : '-'}
                                        </td>
                                        <td className="p-4 text-right text-sm text-slate-300 font-mono">
                                            {product.salesQuantity > 0 ? product.salesQuantity.toLocaleString('tr-TR') : '-'} {product.unit}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="p-12 text-center text-slate-500">
                                        <Package size={48} className="mx-auto mb-4 opacity-20" />
                                        <p className="text-lg">Kayıt bulunamadı</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail Modal */}
            {selectedProductId && (
                <ProductDetailModal
                    productId={selectedProductId}
                    selectedWarehouse={selectedWarehouse}
                    onClose={() => setSelectedProductId(null)}
                />
            )}
        </div>
    );
};

export default Products;
