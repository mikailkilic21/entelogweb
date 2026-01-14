import React, { useEffect, useState } from 'react';
import { X, Package, Box, RefreshCw, Loader2, ArrowRightLeft, User, FileText, ChevronRight } from 'lucide-react';
import InvoiceDetailModal from './InvoiceDetailModal';

const ProductDetailModal = ({ productId, onClose }) => {
    const [product, setProduct] = useState(null);
    const [pendingOrders, setPendingOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [activeTab, setActiveTab] = useState('summary'); // 'summary', 'transactions', 'orders'

    useEffect(() => {
        if (!productId) return;

        const fetchDetails = async () => {
            setLoading(true);
            try {
                const [productRes, ordersRes] = await Promise.all([
                    fetch(`/api/products/${productId}`),
                    fetch(`/api/products/${productId}/orders`)
                ]);

                if (productRes.ok) {
                    setProduct(await productRes.json());
                }
                if (ordersRes.ok) {
                    setPendingOrders(await ordersRes.json());
                }
            } catch (error) {
                console.error('Error fetching product details:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [productId]);

    if (!productId) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-800 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400">
                            <Package size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                {loading ? 'Yükleniyor...' : product?.name}
                            </h2>
                            <p className="text-sm text-slate-400 font-mono">{product?.code}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                        <X size={24} className="text-slate-400" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-800 px-6 shrink-0 bg-slate-900/50">
                    <button
                        onClick={() => setActiveTab('summary')}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-all ${activeTab === 'summary' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-white'}`}
                    >
                        Özet & Stok
                    </button>
                    <button
                        onClick={() => setActiveTab('transactions')}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-all ${activeTab === 'transactions' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-white'}`}
                    >
                        Hareketler
                    </button>
                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-all ${activeTab === 'orders' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-white'}`}
                    >
                        Bekleyen Siparişler
                        {pendingOrders.length > 0 && (
                            <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-400">
                                {pendingOrders.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center p-20">
                            <Loader2 className="animate-spin text-emerald-500" size={48} />
                        </div>
                    ) : product ? (
                        <>
                            {/* Summary View */}
                            {activeTab === 'summary' && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
                                            <h3 className="text-lg font-semibold text-white mb-4">Ürün Bilgileri</h3>
                                            <div className="space-y-3">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-400">Marka (Specode)</span>
                                                    <span className="text-white">{product.brand || '-'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-400">Birim</span>
                                                    <span className="text-white">{product.unit || '-'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-400">KDV</span>
                                                    <span className="text-white">%{product.vat}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-400">Üretici Kodu</span>
                                                    <span className="text-white">{product.producerCode || '-'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
                                            <h3 className="text-lg font-semibold text-white mb-4">Ambar Stokları</h3>
                                            {product.warehouses?.length > 0 ? (
                                                <div className="space-y-3">
                                                    {product.warehouses.map((wh, idx) => (
                                                        <div key={idx} className="flex justify-between items-center p-2 hover:bg-slate-800/50 rounded">
                                                            <div className="flex items-center gap-2">
                                                                <Box size={16} className="text-slate-500" />
                                                                <span className="text-slate-300">Ambar #{wh.warehouse}</span>
                                                            </div>
                                                            <span className={`font-mono font-bold ${wh.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                                {wh.amount.toLocaleString()}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-slate-500">Ambar bilgisi yok</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Transactions View */}
                            {activeTab === 'transactions' && (
                                <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden animate-fade-in">
                                    <table className="w-full">
                                        <thead className="bg-slate-800/80">
                                            <tr>
                                                <th className="text-left p-3 text-sm text-slate-400">Tarih</th>
                                                <th className="text-left p-3 text-sm text-slate-400">Cari Hesap</th>
                                                <th className="text-left p-3 text-sm text-slate-400">Fiş No</th>
                                                <th className="text-left p-3 text-sm text-slate-400">İşlem</th>
                                                <th className="text-center p-3 text-sm text-slate-400">Miktar</th>
                                                <th className="text-right p-3 text-sm text-slate-400">Fiyat</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800">
                                            {product.transactions?.map((tr, idx) => (
                                                <tr
                                                    key={idx}
                                                    className={`hover:bg-slate-800/60 transition-colors ${tr.invoiceId ? 'cursor-pointer' : ''}`}
                                                    onClick={() => {
                                                        if (tr.invoiceId) {
                                                            setSelectedInvoice({
                                                                id: tr.invoiceId,
                                                                ficheNo: tr.ficheNo,
                                                                customer: tr.accountName,
                                                                type: tr.type,
                                                                date: tr.date,
                                                                paymentStatus: 'Kapalı',
                                                                amount: tr.total || 0
                                                            });
                                                        }
                                                    }}
                                                >
                                                    <td className="p-3 text-sm text-slate-300">{new Date(tr.date).toLocaleDateString('tr-TR')}</td>
                                                    <td className="p-3">
                                                        {tr.accountName ? (
                                                            <div className="flex items-center gap-2">
                                                                <User size={14} className="text-indigo-400" />
                                                                <span className="text-sm text-indigo-300">{tr.accountName}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-slate-500">-</span>
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-sm text-slate-300 opacity-75">{tr.ficheNo || '-'}</td>
                                                    <td className="p-3">
                                                        <span className={`text-xs px-2 py-1 rounded ${tr.type === 'Satış' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                                            {tr.type}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-center text-sm font-bold text-white">
                                                        {tr.quantity}
                                                    </td>
                                                    <td className="p-3 text-right text-sm text-slate-400">
                                                        {tr.price?.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Pending Orders View (Approved) */}
                            {activeTab === 'orders' && (
                                <div className="space-y-4 animate-fade-in">
                                    {pendingOrders.length > 0 ? (
                                        <>
                                            <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                                                        <Package size={20} />
                                                    </div>
                                                    <span className="text-emerald-200 font-medium">Toplam Bekleyen Sipariş Miktarı</span>
                                                </div>
                                                <span className="text-2xl font-bold text-emerald-400">
                                                    {pendingOrders.reduce((acc, order) => acc + (Number(order.quantity) || 0), 0).toLocaleString('tr-TR')}
                                                </span>
                                            </div>

                                            <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                                                <table className="w-full">
                                                    <thead className="bg-slate-800/80">
                                                        <tr>
                                                            <th className="text-left p-4 text-sm text-slate-400">Tarih</th>
                                                            <th className="text-left p-4 text-sm text-slate-400">Cari Hesap</th>
                                                            <th className="text-left p-4 text-sm text-slate-400">Sipariş No</th>
                                                            <th className="text-right p-4 text-sm text-slate-400">Miktar</th>
                                                            <th className="text-right p-4 text-sm text-slate-400">Durum</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-800">
                                                        {pendingOrders.map((order, idx) => (
                                                            <tr key={idx} className="hover:bg-slate-800/40">
                                                                <td className="p-4 text-sm text-slate-300">
                                                                    {new Date(order.date).toLocaleDateString('tr-TR')}
                                                                </td>
                                                                <td className="p-4">
                                                                    <div className="flex items-center gap-2">
                                                                        <User size={16} className="text-indigo-400" />
                                                                        <span className="text-sm font-medium text-indigo-300">
                                                                            {order.accountName}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="p-4">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-sm text-white font-mono">{order.orderNo}</span>
                                                                        {order.documentNo && (
                                                                            <span className="text-xs bg-slate-700 px-1.5 rounded text-slate-400">{order.documentNo}</span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="p-4 text-right text-sm text-white font-bold">
                                                                    {order.quantity} <span className="text-xs font-normal text-slate-500">{order.unit}</span>
                                                                </td>
                                                                <td className="p-4 text-right">
                                                                    <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-1 rounded">
                                                                        Onaylı
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="p-12 text-center border border-slate-800 rounded-xl bg-slate-900/50">
                                            <FileText size={32} className="mx-auto mb-3 text-slate-600" />
                                            <p className="text-slate-400">Bu ürünü bekleyen onaylı sipariş bulunmuyor.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-20 text-slate-500">Veri yok</div>
                    )}
                </div>
            </div>

            {selectedInvoice && (
                <div className="fixed inset-0 z-[60]">
                    <InvoiceDetailModal
                        invoice={selectedInvoice}
                        onClose={() => setSelectedInvoice(null)}
                    />
                </div>
            )}
        </div>
    );
};

export default ProductDetailModal;
