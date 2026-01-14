import React, { useState, useEffect } from 'react';
import ProductDetailModal from '../components/ProductDetailModal';
import { Package, Search, Loader2, RefreshCw, AlertTriangle, CheckCircle, Box } from 'lucide-react';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProductId, setSelectedProductId] = useState(null);

    const [sortBy, setSortBy] = useState('quantity'); // 'quantity' or 'amount'

    const fetchData = async () => {
        setLoading(true);
        try {
            const searchParam = searchTerm ? `&search=${searchTerm}` : '';
            const sortParam = `?limit=50&sortBy=${sortBy}`; // Default limit 50 as requested
            const [productsRes, statsRes] = await Promise.all([
                fetch(`/api/products${sortParam}${searchParam}`),
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
        const timer = setTimeout(() => {
            fetchData();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, sortBy]);

    if (loading && !products.length) {
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

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-indigo-600/20 to-indigo-600/5 border border-indigo-500/30 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Package className="text-indigo-400" size={24} />
                            <span className="text-sm text-slate-300">Toplam Kart</span>
                        </div>
                        <p className="text-3xl font-bold text-white">{stats.totalProducts || 0}</p>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-600/20 to-emerald-600/5 border border-emerald-500/30 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <CheckCircle className="text-emerald-400" size={24} />
                            <span className="text-sm text-slate-300">Stoktaki Ürünler</span>
                        </div>
                        <p className="text-3xl font-bold text-white">{stats.productsInStock || 0}</p>
                    </div>

                    <div className="bg-gradient-to-br from-amber-600/20 to-amber-600/5 border border-amber-500/30 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <AlertTriangle className="text-amber-400" size={24} />
                            <span className="text-sm text-slate-300">Kritik Stok (&lt;0)</span>
                        </div>
                        <p className="text-3xl font-bold text-white">{stats.criticalStock || 0}</p>
                    </div>
                </div>
            )}

            {/* Search and Sort Controls */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
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

                {/* Sorting Options */}
                <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
                    <button
                        onClick={() => setSortBy('quantity')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${sortBy === 'quantity'
                                ? 'bg-emerald-600 text-white shadow-lg'
                                : 'text-slate-400 hover:text-white hover:bg-slate-700'
                            }`}
                    >
                        Satış Miktarına Göre
                    </button>
                    <button
                        onClick={() => setSortBy('amount')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${sortBy === 'amount'
                                ? 'bg-emerald-600 text-white shadow-lg'
                                : 'text-slate-400 hover:text-white hover:bg-slate-700'
                            }`}
                    >
                        Satış Tutarına Göre
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
                                <th className="text-left p-4 text-sm font-medium text-slate-400 uppercase tracking-wider">Marka</th>
                                <th className="text-right p-4 text-sm font-medium text-slate-400 uppercase tracking-wider">Satış Tutarı</th>
                                <th className="text-right p-4 text-sm font-medium text-slate-400 uppercase tracking-wider">Satış Miktarı</th>
                                <th className="text-right p-4 text-sm font-medium text-slate-400 uppercase tracking-wider">Fiili Stok</th>
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
                                        <td className="p-4 text-sm text-slate-400">
                                            {product.brand || '-'}
                                        </td>
                                        <td className="p-4 text-right text-sm font-medium text-emerald-400 font-mono">
                                            {product.salesAmount > 0 ? `${product.salesAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺` : '-'}
                                        </td>
                                        <td className="p-4 text-right text-sm text-slate-300 font-mono">
                                            {product.salesQuantity > 0 ? product.salesQuantity.toLocaleString('tr-TR') : '-'} {product.unit}
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${product.stockLevel > 0
                                                ? 'bg-blue-500/20 text-blue-400'
                                                : product.stockLevel < 0
                                                    ? 'bg-red-500/20 text-red-400'
                                                    : 'bg-slate-700 text-slate-400'
                                                }`}>
                                                {product.stockLevel.toLocaleString('tr-TR')}
                                            </span>
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
                    onClose={() => setSelectedProductId(null)}
                />
            )}
        </div>
    );
};

export default Products;
