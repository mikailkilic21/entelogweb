import React, { useEffect, useState, useRef } from 'react';
import { X, Building2, Phone, Mail, MapPin, FileText, Calendar, TrendingUp, TrendingDown, Loader2, ChevronDown, ChevronRight, Package, Box, Download, FileSpreadsheet } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import * as XLSX from 'xlsx';
import InvoiceDetailModal from './InvoiceDetailModal';
import CheckDetailModal from './CheckDetailModal';
import PurchasedProductsReportTemplate from './PurchasedProductsReportTemplate';

const AccountDetailModal = ({ accountId, onClose }) => {
    const [account, setAccount] = useState(null);
    const [pendingOrders, setPendingOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [selectedPayroll, setSelectedPayroll] = useState(null);
    const [activeTab, setActiveTab] = useState('summary'); // 'summary', 'transactions', 'orders', 'products'
    const [turnover, setTurnover] = useState(null);
    const [loadingTurnover, setLoadingTurnover] = useState(false);
    const [topProducts, setTopProducts] = useState(null);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [companyInfo, setCompanyInfo] = useState(null);
    const [generatingReport, setGeneratingReport] = useState(false);
    const [generatingExcel, setGeneratingExcel] = useState(false);
    const [allProducts, setAllProducts] = useState(null);
    const reportRef = useRef();

    useEffect(() => {
        if (!accountId) return;

        const fetchAccountDetails = async () => {
            setLoading(true);
            try {
                const [accountRes, ordersRes, companyRes] = await Promise.all([
                    fetch(`/api/accounts/${accountId}`),
                    fetch(`/api/accounts/${accountId}/orders`),
                    fetch('/api/settings/company')
                ]);

                if (accountRes.ok) {
                    setAccount(await accountRes.json());
                }
                if (ordersRes.ok) {
                    setPendingOrders(await ordersRes.json());
                }
                if (companyRes.ok) {
                    setCompanyInfo(await companyRes.json());
                }
            } catch (error) {
                console.error('Error fetching details:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAccountDetails();
        // Reset turnover and products on open
        setTurnover(null);
        setTopProducts(null);
        setAllProducts(null);
    }, [accountId]);

    const fetchTurnover = async () => {
        setLoadingTurnover(true);
        try {
            const res = await fetch(`/api/accounts/${accountId}/turnover`);
            if (res.ok) {
                setTurnover(await res.json());
            }
        } catch (error) {
            console.error('Error fetching turnover:', error);
        } finally {
            setLoadingTurnover(false);
        }
    };

    const fetchTopProducts = async () => {
        if (topProducts) return; // Don't fetch if already loaded
        setLoadingProducts(true);
        try {
            const res = await fetch(`/api/accounts/${accountId}/top-purchased-products`);
            if (res.ok) {
                setTopProducts(await res.json());
            }
        } catch (error) {
            console.error('Error fetching top products:', error);
        } finally {
            setLoadingProducts(false);
        }
    };

    const fetchAllProductsIfNeeded = async () => {
        if (allProducts) return allProducts;

        try {
            const res = await fetch(`/api/accounts/${accountId}/top-purchased-products?limit=all`);
            if (res.ok) {
                const data = await res.json();
                setAllProducts(data);
                return data;
            }
        } catch (error) {
            console.error('Error fetching all products:', error);
        }
        return null;
    };

    const handleDownloadReport = async () => {
        setGeneratingReport(true);
        try {
            const data = await fetchAllProductsIfNeeded();
            if (data) {
                // Wait for render
                setTimeout(async () => {
                    if (reportRef.current) {
                        const element = reportRef.current;
                        const opt = {
                            margin: 10,
                            filename: `${account?.code}_SatinAlinanUrunler_${new Date().toISOString().split('T')[0]}.pdf`,
                            image: { type: 'jpeg', quality: 0.98 },
                            html2canvas: { scale: 2, useCORS: true },
                            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                        };
                        await html2pdf().set(opt).from(element).save();
                    }
                    setGeneratingReport(false);
                }, 500); // Slight delay to ensure React renders the hidden component
            } else {
                setGeneratingReport(false);
            }
        } catch (error) {
            console.error('Report generation error:', error);
            setGeneratingReport(false);
        }
    };

    const handleDownloadExcel = async () => {
        setGeneratingExcel(true);
        try {
            const data = await fetchAllProductsIfNeeded();

            if (data) {
                // Format Data for Excel
                const excelRows = data.map((item, index) => ({
                    "Sıra": index + 1,
                    "Ürün Kodu": item.productCode,
                    "Ürün Adı": item.productName,
                    "Miktar": item.totalQuantity,
                    "Birim": item.unit || '',
                    "Toplam Tutar": item.totalAmount
                }));

                // Create Worksheet
                const worksheet = XLSX.utils.json_to_sheet(excelRows);

                // Auto-width columns
                const wscols = [
                    { wch: 6 },  // Sira
                    { wch: 20 }, // Urun Kodu
                    { wch: 40 }, // Urun Adi
                    { wch: 12 }, // Miktar
                    { wch: 10 }, // Birim
                    { wch: 15 }  // Tutar
                ];
                worksheet['!cols'] = wscols;

                // Create Workbook
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, "En Çok Alınan Ürünler");

                // Generate Filename
                const dateStr = new Date().toISOString().split('T')[0];
                const safeAccountCode = account?.code?.replace(/[^a-z0-9]/gi, '_') || 'Cari';
                XLSX.writeFile(workbook, `${safeAccountCode}_SatinAlinanUrunler_${dateStr}.xlsx`);
            }
        } catch (error) {
            console.error('Excel generation error:', error);
        } finally {
            setGeneratingExcel(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'products') {
            fetchTopProducts();
        }
    }, [activeTab]);


    if (!accountId) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-800 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-lg ${account?.cardType === 1 ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'
                            }`}>
                            <Building2 size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                {loading ? 'Yükleniyor...' : account?.name}
                            </h2>
                            <p className="text-sm text-slate-400">{account?.code}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X size={24} className="text-slate-400" />
                    </button>
                </div>


                {/* Tabs */}
                <div className="flex border-b border-slate-800 px-6 shrink-0 bg-slate-900/50 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('summary')}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${activeTab === 'summary'
                            ? 'border-blue-500 text-blue-400'
                            : 'border-transparent text-slate-400 hover:text-white'
                            }`}
                    >
                        Özet & İletişim
                    </button>
                    <button
                        onClick={() => setActiveTab('transactions')}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${activeTab === 'transactions'
                            ? 'border-blue-500 text-blue-400'
                            : 'border-transparent text-slate-400 hover:text-white'
                            }`}
                    >
                        Hareketler (Ekstre)
                    </button>
                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${activeTab === 'orders'
                            ? 'border-blue-500 text-blue-400'
                            : 'border-transparent text-slate-400 hover:text-white'
                            }`}
                    >
                        Bekleyen Siparişler
                        {pendingOrders.length > 0 && (
                            <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-400">
                                {pendingOrders.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${activeTab === 'products'
                            ? 'border-blue-500 text-blue-400'
                            : 'border-transparent text-slate-400 hover:text-white'
                            }`}
                    >
                        En Çok Alınan Ürünler
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center p-20">
                            <Loader2 className="animate-spin text-blue-500" size={48} />
                        </div>
                    ) : account ? (
                        <>
                            {/* Summary View */}
                            {activeTab === 'summary' && (
                                <div className="space-y-6 animate-fade-in">
                                    {/* Balance Card */}
                                    <div className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-xl p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-slate-300 mb-1">Güncel Bakiye</p>
                                                <div className="flex items-center gap-2">
                                                    {account.balance >= 0 ? (
                                                        <TrendingUp size={24} className="text-green-400" />
                                                    ) : (
                                                        <TrendingDown size={24} className="text-red-400" />
                                                    )}
                                                    <span
                                                        className={`text-4xl font-bold ${account.balance >= 0 ? 'text-green-400' : 'text-red-400'
                                                            }`}
                                                    >
                                                        {Math.abs(account.balance).toLocaleString('tr-TR', {
                                                            style: 'currency',
                                                            currency: 'TRY'
                                                        })}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-500 mt-2">
                                                    {account.balance >= 0 ? 'Alacaklı' : 'Borçlu'}
                                                </p>
                                            </div>
                                            <div className="p-4 bg-blue-500/10 rounded-full">
                                                <FileText size={32} className="text-blue-400" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Turnover Section */}
                                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                                    <TrendingUp size={20} className="text-blue-400" />
                                                    Ciro Bilgisi
                                                </h3>
                                                <p className="text-sm text-slate-400 mt-1">
                                                    Net Satınalma (KDV Hariç) ve Fiş Adedi
                                                </p>

                                            </div>

                                            {!turnover ? (
                                                <button
                                                    onClick={() => {
                                                        setLoadingTurnover(true);
                                                        fetch(`/api/accounts/${accountId}/turnover`)
                                                            .then(res => res.json())
                                                            .then(data => setTurnover(data))
                                                            .catch(err => console.error(err))
                                                            .finally(() => setLoadingTurnover(false));
                                                    }}
                                                    disabled={loadingTurnover}
                                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                                                >
                                                    {loadingTurnover ? <Loader2 className="animate-spin" size={18} /> : null}
                                                    {loadingTurnover ? 'Hesaplanıyor...' : 'Ciro Hesapla'}
                                                </button>
                                            ) : (
                                                <div className="text-right">
                                                    <div className="text-2xl font-bold text-white">
                                                        {turnover.totalTurnover?.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                                                    </div>
                                                    <div className="text-sm text-slate-400">
                                                        {turnover.invoiceCount} Adet Fatura
                                                    </div>

                                                </div>
                                            )}
                                        </div>
                                    </div>


                                    {/* Info Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4 bg-slate-900/50 p-6 rounded-xl border border-slate-800">
                                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                                <Building2 size={20} className="text-blue-400" />
                                                Firma Bilgileri
                                            </h3>
                                            <div>
                                                <label className="text-sm text-slate-400">Vergi No / Dairesi</label>
                                                <p className="text-white">
                                                    {account.taxNumber || '-'}{account.taxOffice && ` / ${account.taxOffice}`}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="text-sm text-slate-400">Cari Kodu</label>
                                                <p className="text-white font-mono">{account.code}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4 bg-slate-900/50 p-6 rounded-xl border border-slate-800">
                                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                                <MapPin size={20} className="text-purple-400" />
                                                İletişim Bilgileri
                                            </h3>
                                            <div className="flex items-start gap-3">
                                                <Phone size={18} className="text-slate-400 mt-0.5" />
                                                <div>
                                                    <label className="text-sm text-slate-400 block">Telefon</label>
                                                    <p className="text-white">{account.phone1 || '-'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <Mail size={18} className="text-slate-400 mt-0.5" />
                                                <div>
                                                    <label className="text-sm text-slate-400 block">E-posta</label>
                                                    <p className="text-white">{account.email || '-'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <MapPin size={18} className="text-slate-400 mt-0.5" />
                                                <div>
                                                    <label className="text-sm text-slate-400 block">Adres</label>
                                                    <p className="text-white">
                                                        {[account.address1, account.town, account.city]
                                                            .filter(Boolean)
                                                            .join(', ')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Transactions Tab */}
                            {activeTab === 'transactions' && (
                                <div className="space-y-4 animate-fade-in">
                                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                                        <table className="w-full">
                                            <thead className="bg-slate-800/80">
                                                <tr>
                                                    <th className="text-left p-4 text-sm font-medium text-slate-400">Tarih</th>
                                                    <th className="text-left p-4 text-sm font-medium text-slate-400">Fiş No</th>
                                                    <th className="text-left p-4 text-sm font-medium text-slate-400">Açıklama</th>
                                                    <th className="text-left p-4 text-sm font-medium text-slate-400">Tip</th>
                                                    <th className="text-right p-4 text-sm font-medium text-slate-400">Tutar</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800">
                                                {account.transactions?.map((transaction) => {
                                                    // Check if transaction is likely an invoice to prioritize sourceRef
                                                    const isInvoice = [37, 38, 8, 1, 2].includes(transaction.trcode) || transaction.moduleNr === 4;
                                                    // Use sourceRef if available (especially for invoices), otherwise fallback to ID (though API might not find it if it's not in invoice table)
                                                    const targetId = transaction.sourceRef || transaction.id;

                                                    return (
                                                        <tr
                                                            key={transaction.id}
                                                            className="hover:bg-slate-800/60 transition-colors cursor-pointer"
                                                            onClick={() => {
                                                                // Check for Check/Promissory Note
                                                                const isCheck = transaction.type.includes('Çek') || transaction.type.includes('Senet');

                                                                if (isCheck && transaction.sourceRef) {
                                                                    setSelectedPayroll(transaction.sourceRef);
                                                                    return;
                                                                }

                                                                setSelectedInvoice({
                                                                    id: targetId,
                                                                    ficheNo: transaction.invoiceNo,
                                                                    customer: account.name,
                                                                    type: transaction.type,
                                                                    date: transaction.date,
                                                                    amount: transaction.amount
                                                                });
                                                            }}
                                                        >
                                                            <td className="p-4 text-sm text-slate-300">
                                                                {new Date(transaction.date).toLocaleDateString('tr-TR')}
                                                            </td>
                                                            <td className="p-4 text-sm text-white font-mono">
                                                                {transaction.invoiceNo}
                                                            </td>
                                                            <td className="p-4 text-sm text-slate-400 truncate max-w-[200px]">
                                                                {transaction.description || '-'}
                                                            </td>
                                                            <td className="p-4">
                                                                <span className={`px-2 py-1 rounded text-xs font-medium ${transaction.type.includes('Satış')
                                                                    ? 'bg-green-500/20 text-green-400'
                                                                    : 'bg-blue-500/20 text-blue-400'
                                                                    }`}>
                                                                    {transaction.type}
                                                                </span>
                                                            </td>
                                                            <td className="p-4 text-sm text-right text-white font-medium">
                                                                {transaction.amount.toLocaleString('tr-TR', {
                                                                    style: 'currency',
                                                                    currency: 'TRY'
                                                                })}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                        {(!account.transactions || account.transactions.length === 0) && (
                                            <div className="p-8 text-center text-slate-500">
                                                İşlem bulunamadı
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Pending Orders Tab */}
                            {activeTab === 'orders' && (
                                <OrdersAccordion orders={pendingOrders} />
                            )}

                            {/* Top Products Tab */}
                            {activeTab === 'products' && (
                                <div className="space-y-4 animate-fade-in">
                                    <div className="flex justify-between items-center bg-slate-900/50 border border-slate-800 rounded-t-xl p-4">
                                        <h3 className="text-sm font-semibold text-slate-300">Bu Firmadan En Çok Alınan 5 Ürün</h3>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleDownloadExcel}
                                                disabled={generatingExcel}
                                                className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-medium rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                                            >
                                                {generatingExcel ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
                                                {generatingExcel ? 'Hazırlanıyor...' : 'Excel İndir'}
                                            </button>
                                            <button
                                                onClick={handleDownloadReport}
                                                disabled={generatingReport}
                                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                                            >
                                                {generatingReport ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                                                {generatingReport ? 'PDF İndir' : 'PDF İndir'}
                                            </button>
                                        </div>
                                    </div>

                                    {loadingProducts ? (
                                        <div className="flex justify-center p-12 bg-slate-900/50 border-x border-b border-slate-800 rounded-b-xl">
                                            <Loader2 className="animate-spin text-blue-400" size={32} />
                                        </div>
                                    ) : topProducts && topProducts.length > 0 ? (
                                        <div className="bg-slate-900/50 border-x border-b border-slate-800 rounded-b-xl overflow-hidden">
                                            <table className="w-full">
                                                <thead className="bg-slate-800/50">
                                                    <tr>
                                                        <th className="text-left p-4 text-xs font-medium text-slate-400 uppercase">Ürün Adı</th>
                                                        <th className="text-right p-4 text-xs font-medium text-slate-400 uppercase">Toplam Miktar</th>
                                                        <th className="text-right p-4 text-xs font-medium text-slate-400 uppercase">Toplam Tutar</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-800/50">
                                                    {topProducts.map((product, index) => (
                                                        <tr key={index} className="hover:bg-slate-800/20 transition-colors">
                                                            <td className="p-4 text-sm font-medium text-white flex items-center gap-3">
                                                                <div className="p-2 rounded bg-slate-800 text-blue-400">
                                                                    {index + 1}
                                                                </div>
                                                                <div>
                                                                    <div className="text-slate-200">{product.productName}</div>
                                                                    <div className="text-xs text-slate-400 font-mono">{product.productCode}</div>
                                                                </div>
                                                            </td>
                                                            <td className="p-4 text-right text-sm text-slate-300">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <Box size={14} className="text-slate-500" />
                                                                    {product.totalQuantity.toLocaleString('tr-TR')} {product.unit}
                                                                </div>
                                                            </td>
                                                            <td className="p-4 text-right text-sm font-bold text-white">
                                                                {product.totalAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="p-12 text-center text-slate-500 bg-slate-900/50 rounded-b-xl border-x border-b border-slate-800">
                                            <Package size={48} className="mx-auto mb-4 opacity-20" />
                                            <p>Kayıtlı satınalma verisi bulunamadı.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-20 text-slate-500">
                            <p>Hesap bilgileri yüklenemedi</p>
                        </div>
                    )}
                </div>

                {/* Hidden Report Template for PDF Generation */}
                <div style={{ position: 'absolute', left: '-10000px', top: 0 }}>
                    <div ref={reportRef}>
                        <PurchasedProductsReportTemplate
                            products={allProducts}
                            account={account}
                            companyInfo={companyInfo}
                        />
                    </div>
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

export default AccountDetailModal;

const OrdersAccordion = ({ orders }) => {
    const [openOrders, setOpenOrders] = useState({});

    const toggleOrder = (orderNo) => {
        setOpenOrders(prev => ({ ...prev, [orderNo]: !prev[orderNo] }));
    };

    // Group orders by Order No
    const groupedOrders = React.useMemo(() => {
        const groups = {};
        orders.forEach(order => {
            if (!groups[order.orderNo]) {
                groups[order.orderNo] = {
                    orderNo: order.orderNo,
                    documentNo: order.documentNo,
                    date: order.date,
                    total: 0,
                    items: []
                };
            }
            groups[order.orderNo].items.push(order);
            groups[order.orderNo].total += (order.price || 0) * (order.quantity || 0);
        });
        return Object.values(groups).sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [orders]);

    if (orders.length === 0) {
        return (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
                <div className="inline-block p-4 rounded-full bg-slate-800/50 mb-3">
                    <FileText size={32} className="text-slate-600" />
                </div>
                <p className="text-slate-400">Bekleyen sipariş bulunmuyor</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-fade-in">
            {groupedOrders.map((group) => (
                <div key={group.orderNo} className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                    {/* Accordion Header */}
                    <button
                        onClick={() => toggleOrder(group.orderNo)}
                        className="w-full flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 transition-colors"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg transition-transform duration-200 ${openOrders[group.orderNo] ? 'rotate-90 bg-blue-500/20 text-blue-400' : 'bg-slate-700/50 text-slate-400'}`}>
                                <ChevronRight size={20} />
                            </div>
                            <div className="text-left">
                                <div className="text-white font-mono font-medium flex items-center gap-2">
                                    {group.orderNo}
                                    {group.documentNo && (
                                        <span className="text-xs bg-slate-700 px-2 py-0.5 rounded text-slate-300 font-sans">
                                            {group.documentNo}
                                        </span>
                                    )}
                                </div>
                                <div className="text-sm text-slate-400">{new Date(group.date).toLocaleDateString('tr-TR')}</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-slate-400">Toplam Tutar</div>
                            <div className="text-white font-bold">
                                {group.total.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                            </div>
                        </div>
                    </button>

                    {/* Accordion Content */}
                    {openOrders[group.orderNo] && (
                        <div className="border-t border-slate-800">
                            <table className="w-full">
                                <thead className="bg-slate-800/30">
                                    <tr>
                                        <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase">Ürün</th>
                                        <th className="text-center p-3 text-xs font-medium text-slate-500 uppercase">Miktar</th>
                                        <th className="text-right p-3 text-xs font-medium text-slate-500 uppercase">Birim Fiyat</th>
                                        <th className="text-right p-3 text-xs font-medium text-slate-500 uppercase">Tutar</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {group.items.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-800/20">
                                            <td className="p-3 text-sm text-white">
                                                {item.productName}
                                            </td>
                                            <td className="p-3 text-center text-sm text-slate-300 font-medium">
                                                {item.quantity} <span className="text-xs text-slate-500 ml-1">{item.unit || 'ADET'}</span>
                                            </td>
                                            <td className="p-3 text-right text-sm text-slate-400">
                                                {item.price?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                            </td>
                                            <td className="p-3 text-right text-sm text-white font-medium">
                                                {((item.price || 0) * (item.quantity || 0)).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};
