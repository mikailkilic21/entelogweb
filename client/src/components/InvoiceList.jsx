import React from 'react';
import { FileText, ArrowUp, ArrowDown } from 'lucide-react';

const InvoiceList = ({ invoices, onInvoiceClick }) => {
    return (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-lg">
            <div className="p-6 border-b border-white/10">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FileText className="text-blue-400" />
                    Son Stok Fişleri
                </h2>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-white/5 text-slate-400 uppercase text-xs">
                        <tr>
                            <th className="p-4">Tarih</th>
                            <th className="p-4">Fiş No</th>
                            <th className="p-4">Cari</th>
                            <th className="p-4">Türü</th>
                            <th className="p-4">GIB Durumu</th>
                            <th className="p-4">Ödeme</th>
                            <th className="p-4 text-right">Tutar</th>
                            <th className="p-4 text-center">Durum</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {invoices.map((invoice, index) => (
                            <tr
                                key={index}
                                onClick={() => onInvoiceClick && onInvoiceClick(invoice)}
                                className="hover:bg-white/5 transition-colors cursor-pointer group"
                            >
                                <td className="p-4 text-slate-300">{invoice.date}</td>
                                <td className="p-4 font-mono text-slate-400 text-sm group-hover:text-blue-400 transition-colors">{invoice.ficheNo}</td>
                                <td className="p-4 font-medium text-white">
                                    <span className="hover:text-blue-400 cursor-pointer border-b border-dashed border-slate-600 hover:border-blue-400 transition-colors" title="Cari Detayına Git">
                                        {invoice.customer}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${invoice.type === 'Alış'
                                        ? 'bg-rose-500/20 text-rose-400'
                                        : invoice.type === 'Satış'
                                            ? 'bg-emerald-500/20 text-emerald-400'
                                            : 'bg-blue-500/20 text-blue-400'
                                        }`}>
                                        {invoice.type}
                                    </span>
                                </td>
                                <td className="p-4">
                                    {invoice.gibStatus && (
                                        <span className={`px-2 py-1 rounded text-[10px] font-medium border ${invoice.gibStatus.includes('e-Fatura') ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                                            invoice.gibStatus.includes('e-Arşiv') ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                                'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                            }`}>
                                            {invoice.gibStatus}
                                        </span>
                                    )}
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-[10px] font-medium border ${invoice.paymentStatus === 'Kapalı'
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                        : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                        }`}>
                                        {invoice.paymentStatus || 'Açık'}
                                    </span>
                                </td>
                                <td className="p-4 text-right font-bold text-slate-200">
                                    {invoice.amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                                </td>
                                <td className="p-4 text-center">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 mx-auto shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default InvoiceList;
