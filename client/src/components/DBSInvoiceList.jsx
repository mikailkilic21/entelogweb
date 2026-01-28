import React, { useState, useEffect } from 'react';
import { FileText, Calendar, Building2, Search, Loader2, ArrowRight } from 'lucide-react';

const DBSInvoiceList = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            const res = await fetch('/api/dbs/invoices');
            if (res.ok) {
                setInvoices(await res.json());
            }
        } catch (err) {
            console.error('Failed to fetch DBS invoices', err);
        } finally {
            setLoading(false);
        }
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

    const filteredInvoices = invoices.filter(inv =>
        inv.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.ficheno?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalAmount = filteredInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-slate-500" /></div>;

    return (
        <div className="space-y-6">
            {/* Stats & Search */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl flex items-center gap-4">
                    <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400">
                        <FileText size={24} />
                    </div>
                    <div>
                        <div className="text-sm text-slate-400">Toplam DBS Tutarı</div>
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
                            <th className="px-6 py-4">Vade Kuralı</th>
                            <th className="px-6 py-4 text-center">DBS Ödeme Tarihi</th>
                            <th className="px-6 py-4 text-right">Tutar</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {filteredInvoices.length === 0 ? (
                            <tr><td colSpan="6" className="p-12 text-center text-slate-500">Kayıt bulunamadı.</td></tr>
                        ) : (
                            filteredInvoices.map((inv, idx) => (
                                <tr key={inv.id || idx} className="hover:bg-slate-800/30 transition-colors group">
                                    <td className="px-6 py-3 text-slate-400 font-mono">{formatDate(inv.date)}</td>
                                    <td className="px-6 py-3 text-slate-300 font-mono">{inv.ficheno}</td>
                                    <td className="px-6 py-3 text-slate-200 font-medium">
                                        <div className="flex items-center gap-2">
                                            <Building2 size={14} className="text-slate-600" />
                                            {inv.clientName}
                                        </div>
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
        </div>
    );
};

export default DBSInvoiceList;
