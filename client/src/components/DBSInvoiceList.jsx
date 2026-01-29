import React, { useState, useEffect } from 'react';
import { FileText, Calendar, Building2, Search, Loader2, X, Printer } from 'lucide-react';

const DBSInvoiceList = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('all');
    const [company, setCompany] = useState(null);

    // Detail Modal State
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [details, setDetails] = useState([]);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);

    useEffect(() => {
        fetchInvoices();
        fetchCompanySettings();
    }, []);

    const fetchCompanySettings = async () => {
        try {
            const res = await fetch('/api/settings/company');
            if (res.ok) setCompany(await res.json());
        } catch (err) { console.error(err); }
    };

    const fetchInvoices = async () => {
        try {
            const res = await fetch('/api/dbs/invoices');
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setInvoices(data);
                } else {
                    console.error('DBS response is not an array:', data);
                    setInvoices([]);
                }
            }
        } catch (err) {
            console.error('Failed to fetch DBS invoices', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchInvoiceDetails = async (invoice) => {
        setLoadingDetails(true);
        try {
            const { id, dbFirm, dbPeriod } = invoice;
            const queryParams = new URLSearchParams();
            if (dbFirm) queryParams.append('firmNo', dbFirm);
            if (dbPeriod) queryParams.append('periodNo', dbPeriod);

            const res = await fetch(`/api/dbs/invoice/${id}?${queryParams.toString()}`);
            if (res.ok) {
                setDetails(await res.json());
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleRowClick = (invoice) => {
        setSelectedInvoice(invoice);
        setDetails([]);
        setShowDetailModal(true);
        fetchInvoiceDetails(invoice);
    };

    // Print Handler
    const handlePrint = () => {
        window.print();
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('tr-TR');
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
    };

    const getDayLabel = (dayIndex) => {
        if (dayIndex === undefined || dayIndex === null || dayIndex === '') return null;
        const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
        return days[Number(dayIndex)];
    };

    // Date Filter Logic
    const filterInvoicesByDate = (list, type) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return list.filter(inv => {
            const dDate = new Date(inv.dbsDate);
            dDate.setHours(0, 0, 0, 0);

            if (type === 'today') {
                return dDate.getTime() === today.getTime();
            } else if (type === 'week') {
                // Next 7 days
                const nextWeek = new Date(today);
                nextWeek.setDate(today.getDate() + 7);
                return dDate >= today && dDate <= nextWeek;
            } else if (type === 'month') {
                // Next 30 days
                const nextMonth = new Date(today);
                nextMonth.setDate(today.getDate() + 30);
                return dDate >= today && dDate <= nextMonth;
            }
            return true; // 'all' (filtered overlapping 'Today' conditions are fine)
        });
    };

    const countByFilter = (type) => {
        return filterInvoicesByDate(invoices, type).length;
    };

    const filteredInvoices = filterInvoicesByDate(invoices, dateFilter).filter(inv =>
        inv.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.ficheno?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalAmount = filteredInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);

    const getFilterLabel = (type) => {
        switch (type) {
            case 'today': return "Bugünkü Ödemeler";
            case 'week': return "Bu Haftaki Ödemeler";
            case 'month': return "Bu Ayki Ödemeler";
            default: return "Tüm Ödemeler";
        }
    };

    const FilterButton = ({ type, label }) => (
        <button
            onClick={() => setDateFilter(type)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${dateFilter === type
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
        >
            {label}
            <span className={`px-2 py-0.5 rounded text-xs ${dateFilter === type ? 'bg-white/20 text-white' : 'bg-slate-900 text-slate-500'
                }`}>
                {countByFilter(type)}
            </span>
        </button>
    );

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-slate-500" /></div>;

    return (
        <>
            {/* Screen Layout */}
            <div className="space-y-6 print:hidden">
                {/* Filters & Print Button */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex gap-2 pb-2 overflow-x-auto">
                        <FilterButton type="today" label="Bugün" />
                        <FilterButton type="week" label="Bu Hafta" />
                        <FilterButton type="month" label="Bu Ay" />
                        <FilterButton type="all" label="Tümü" />
                    </div>

                    <button
                        onClick={handlePrint}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium flex items-center gap-2 transition-colors border border-slate-700"
                    >
                        <Printer size={16} />
                        Yazdır / PDF
                    </button>
                </div>

                {/* Stats & Search */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl flex items-center gap-4">
                        <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400">
                            <FileText size={24} />
                        </div>
                        <div>
                            <div className="text-sm text-slate-400">Toplam Tutarı ({getFilterLabel(dateFilter)})</div>
                            <div className="text-2xl font-bold text-white font-mono">{formatCurrency(totalAmount)}</div>
                        </div>
                    </div>

                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            type="text"
                            placeholder="Fatura veya cari ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-900/50 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-slate-200 focus:border-indigo-500 outline-none"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-950/50 text-slate-400 uppercase font-medium text-xs">
                            <tr>
                                <th className="px-6 py-4">Fatura Tarihi</th>
                                <th className="px-6 py-4">Fiş No</th>
                                <th className="px-6 py-4">Cari Hesap</th>
                                <th className="px-6 py-4">Dönem</th>
                                <th className="px-6 py-4">Vade Kuralı</th>
                                <th className="px-6 py-4 text-center">DBS Ödeme Tarihi</th>
                                <th className="px-6 py-4 text-right">Tutar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {filteredInvoices.length === 0 ? (
                                <tr><td colSpan="7" className="p-12 text-center text-slate-500">Kayıt bulunamadı.</td></tr>
                            ) : (
                                filteredInvoices.map((inv, idx) => (
                                    <tr
                                        key={`${inv.id}-${inv.sourceYear}` || idx}
                                        onClick={() => handleRowClick(inv)}
                                        className="hover:bg-slate-800/30 transition-colors group cursor-pointer"
                                    >
                                        <td className="px-6 py-3 text-slate-400 font-mono">{formatDate(inv.date)}</td>
                                        <td className="px-6 py-3 text-slate-300 font-mono">{inv.ficheno}</td>
                                        <td className="px-6 py-3 text-slate-200 font-medium">
                                            <div className="flex items-center gap-2">
                                                <Building2 size={14} className="text-slate-600" />
                                                {inv.clientName}
                                            </div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${inv.sourceYear === new Date().getFullYear().toString()
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                }`}>
                                                {inv.sourceYear}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-slate-400 text-xs">
                                            {(inv.configTerm || inv.configDay) ? (
                                                <div className="flex flex-col gap-0.5">
                                                    {inv.configTerm > 0 && <span>+{inv.configTerm} Gün</span>}
                                                    {getDayLabel(inv.configDay) && <span>{getDayLabel(inv.configDay)} Günü</span>}
                                                </div>
                                            ) : <span className="text-slate-600">Varsayılan</span>}
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 font-medium font-mono border border-indigo-500/20">
                                                <Calendar size={14} />
                                                {formatDate(inv.dbsDate)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-right text-slate-200 font-bold font-mono">
                                            {formatCurrency(inv.amount)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Detail Modal */}
                {showDetailModal && selectedInvoice && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
                            {/* Header */}
                            <div className="flex justify-between items-start p-6 border-b border-slate-800">
                                <div>
                                    <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                        <FileText className="text-blue-500" />
                                        {selectedInvoice.ficheno}
                                        <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded ml-2">{selectedInvoice.sourceYear}</span>
                                    </h3>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                                        <span className="flex items-center gap-1.5"><Calendar size={14} /> {formatDate(selectedInvoice.date)}</span>
                                        <span className="flex items-center gap-1.5"><Building2 size={14} /> {selectedInvoice.clientName}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowDetailModal(false)}
                                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Body - Details Table */}
                            <div className="flex-1 overflow-auto p-0">
                                {loadingDetails ? (
                                    <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-500">
                                        <Loader2 className="animate-spin text-blue-500" size={32} />
                                        <p>Detaylar yükleniyor...</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-950/50 text-slate-400 uppercase font-bold text-xs sticky top-0 backdrop-blur-md">
                                            <tr>
                                                <th className="px-6 py-4">Malzeme / Hizmet</th>
                                                <th className="px-6 py-4 text-center">Miktar</th>
                                                <th className="px-6 py-4 text-right">Birim Fiyat</th>
                                                <th className="px-6 py-4 text-right">Net Tutar</th>
                                                <th className="px-6 py-4 text-right">Toplam</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/50">
                                            {details.length === 0 ? (
                                                <tr><td colSpan="5" className="p-8 text-center text-slate-500">Kalem bulunamadı.</td></tr>
                                            ) : details.map((item, idx) => (
                                                <tr key={item.id || idx} className="hover:bg-slate-800/30">
                                                    <td className="px-6 py-3">
                                                        <div className="font-medium text-slate-200">{item.name}</div>
                                                        <div className="text-xs text-slate-500 font-mono mt-0.5">{item.code}</div>
                                                    </td>
                                                    <td className="px-6 py-3 text-center font-mono text-slate-300">
                                                        {item.quantity}
                                                    </td>
                                                    <td className="px-6 py-3 text-right font-mono text-slate-400">
                                                        {formatCurrency(item.price)}
                                                    </td>
                                                    <td className="px-6 py-3 text-right font-mono text-slate-300">
                                                        {formatCurrency(item.netTotal)}
                                                    </td>
                                                    <td className="px-6 py-3 text-right font-mono text-white font-bold">
                                                        {formatCurrency(item.total)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-slate-900/80 border-t border-slate-700 sticky bottom-0">
                                            <tr>
                                                <td colSpan="4" className="px-6 py-4 text-right font-bold text-slate-300">GENEL TOPLAM</td>
                                                <td className="px-6 py-4 text-right font-bold text-white text-lg">
                                                    {formatCurrency(selectedInvoice.amount)}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Print View Layout */}
            <div id="dbs-print-section" className="hidden print:block bg-white text-black p-0 min-h-screen">
                <style type="text/css" media="print">
                    {`
                        @page { size: A4; margin: 10mm; }
                        body * {
                            visibility: hidden;
                        }
                        #dbs-print-section, #dbs-print-section * {
                            visibility: visible;
                        }
                        #dbs-print-section {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                            height: 100%;
                            z-index: 9999;
                            background: white;
                        }
                        .print-exact {
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                    `}
                </style>

                {/* Stylish Header Banner */}
                <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-slate-800 print-exact bg-slate-100 p-6 rounded-xl">
                    <div className="flex items-center gap-5">
                        {company?.logoPath && (
                            <img src={company.logoPath} alt="Logo" className="h-12 w-auto object-contain mix-blend-multiply" />
                        )}
                        <div className="space-y-0.5 border-l-2 border-slate-300 pl-4">
                            <h1 className="text-lg font-bold uppercase tracking-tight text-slate-900">{company?.companyName || 'FİRMA ADI'}</h1>
                            <div className="text-[10px] text-slate-500 leading-tight">
                                {company?.address && <p>{company.address}</p>}
                                <div className="flex gap-3">
                                    {company?.phone && <p>Tel: {company.phone}</p>}
                                    {company?.email && <p>E-posta: {company.email}</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="text-right">
                        <div className="inline-block px-3 py-1 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider rounded mb-1 print-exact">
                            DBS Ödeme Raporu
                        </div>
                        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{getFilterLabel(dateFilter)}</h2>
                        <div className="text-[10px] text-slate-400 mt-1 font-mono">
                            Tarih: {new Date().toLocaleDateString('tr-TR')}
                        </div>
                    </div>
                </div>

                {/* Print Table */}
                <table className="w-full text-xs">
                    <thead>
                        <tr className="border-b border-slate-800 bg-slate-50 print-exact">
                            <th className="text-left py-2 px-2 font-bold uppercase text-slate-700">Fatura Tarihi</th>
                            <th className="text-left py-2 px-2 font-bold uppercase text-slate-700">Fiş No</th>
                            <th className="text-left py-2 px-2 font-bold uppercase text-slate-700">Cari Hesap</th>
                            <th className="text-left py-2 px-2 font-bold uppercase text-slate-700">Dönem</th>
                            <th className="text-left py-2 px-2 font-bold uppercase text-slate-700">Vade Kuralı</th>
                            <th className="text-center py-2 px-2 font-bold uppercase text-slate-700">DBS Vadesi</th>
                            <th className="text-right py-2 px-2 font-bold uppercase text-slate-700">Tutar</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {filteredInvoices.map((inv, idx) => (
                            <tr key={inv.id || idx} className="break-inside-avoid">
                                <td className="py-2 px-2 text-slate-600 font-mono">{formatDate(inv.date)}</td>
                                <td className="py-2 px-2 text-slate-900 font-bold font-mono">{inv.ficheno}</td>
                                <td className="py-2 px-2 text-slate-800">{inv.clientName}</td>
                                <td className="py-2 px-2 text-[10px] text-slate-500">{inv.sourceYear}</td>
                                <td className="py-2 px-2 text-[10px] text-slate-500">
                                    {(inv.configTerm || inv.configDay) ? (
                                        <div className="flex flex-col">
                                            {inv.configTerm > 0 && <span>+{inv.configTerm} Gün</span>}
                                            {getDayLabel(inv.configDay) && <span>{getDayLabel(inv.configDay)}</span>}
                                        </div>
                                    ) : <span>-</span>}
                                </td>
                                <td className="py-2 px-2 text-center text-slate-900 font-medium">{formatDate(inv.dbsDate)}</td>
                                <td className="py-2 px-2 text-right text-slate-900 font-bold font-mono text-sm">{formatCurrency(inv.amount)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="border-t-2 border-slate-800 bg-slate-50 print-exact">
                            <td colSpan="6" className="text-right py-3 px-2 font-bold uppercase text-slate-700 text-sm">GENEL TOPLAM</td>
                            <td className="text-right py-3 px-2 font-bold text-slate-900 text-base">{formatCurrency(totalAmount)}</td>
                        </tr>
                    </tfoot>
                </table>

                <div className="fixed bottom-8 left-0 w-full text-center">
                    <div className="border-t border-slate-200 pt-2 inline-flex gap-8 text-[10px] text-slate-400 uppercase tracking-widest">
                        <span>Entelog DBS Sistemi</span>
                        <span>•</span>
                        <span>{new Date().toLocaleDateString('tr-TR')} {new Date().toLocaleTimeString('tr-TR')}</span>
                    </div>
                </div>
            </div>
        </>
    );
};

export default DBSInvoiceList;
