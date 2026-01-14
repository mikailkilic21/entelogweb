import React, { useEffect, useState, useRef } from 'react';
import { X, FileText, Calendar, Box, Receipt, Loader2, CreditCard, Printer, Download } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import InvoicePrintTemplate from './InvoicePrintTemplate';

const InvoiceDetailModal = ({ invoice, onClose }) => {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [companyInfo, setCompanyInfo] = useState(null);
    const [generating, setGenerating] = useState(false);
    const printRef = useRef();

    useEffect(() => {
        // Fetch company info
        const fetchCompanyInfo = async () => {
            try {
                const res = await fetch('/api/settings/company');
                if (res.ok) {
                    const data = await res.json();
                    setCompanyInfo(data);
                }
            } catch (error) {
                console.error('Error fetching company info:', error);
            }
        };
        fetchCompanyInfo();
    }, []);

    useEffect(() => {
        if (!invoice?.logicalRef && !invoice?.id) return;

        const fetchDetails = async () => {
            setLoading(true);
            try {
                // Use logicalRef if available, otherwise fallback to id (which might be same)
                const idToUse = invoice.logicalRef || invoice.id;
                const response = await fetch(`/api/invoices/${idToUse}`);
                if (response.ok) {
                    const data = await response.json();
                    setDetails(data);
                }
            } catch (error) {
                console.error('Error fetching invoice details:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [invoice]);

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = async () => {
        if (!printRef.current) return;

        setGenerating(true);
        try {
            const element = printRef.current;
            const opt = {
                margin: 10,
                filename: `fatura_${invoice.ficheNo}_${new Date().toISOString().split('T')[0]}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            await html2pdf().set(opt).from(element).save();
        } catch (error) {
            console.error('PDF generation error:', error);
            alert('PDF oluşturulurken bir hata oluştu.');
        } finally {
            setGenerating(false);
        }
    };

    if (!invoice) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-800 shrink-0 bg-slate-900">
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-lg ${invoice.type === 'Satış' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                            }`}>
                            <Receipt size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                {invoice.ficheNo}
                                <span className={`px-2 py-0.5 rounded text-xs font-medium border ${invoice.type === 'Satış'
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                    }`}>
                                    {invoice.type}
                                </span>
                            </h2>
                            <p className="text-sm text-slate-400 flex items-center gap-2">
                                <Calendar size={14} />
                                {new Date(invoice.date).toLocaleDateString('tr-TR', { dateStyle: 'long' })}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 print:hidden">
                        <button
                            onClick={handlePrint}
                            disabled={loading || !details}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Printer size={16} />
                            Yazdır
                        </button>
                        <button
                            onClick={handleDownloadPDF}
                            disabled={loading || !details || generating}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {generating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                            PDF İndir
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <X size={24} className="text-slate-400" />
                        </button>
                    </div>
                </div>

                <style>{`
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        #invoice-print-template,
                        #invoice-print-template * {
                            visibility: visible;
                        }
                        #invoice-print-template {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                        }
                        @page {
                            size: A4;
                            margin: 0;
                        }
                    }
                `}</style>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-950/30">
                    <div className="flex flex-col gap-6">
                        {/* Customer Info Card */}
                        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cari Hesap</label>
                                <p className="text-lg font-medium text-white mt-1">{invoice.customer}</p>
                                {invoice.gibStatus && (
                                    <span className="inline-block mt-2 px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded border border-blue-500/20">
                                        {invoice.gibStatus}
                                    </span>
                                )}
                            </div>
                            <div className="text-right">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Belge No</label>
                                <p className="text-white font-mono mt-1">{invoice.invoiceNo || '-'}</p>
                            </div>
                        </div>

                        {/* Lines Table */}
                        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                            {loading ? (
                                <div className="p-12 flex justify-center">
                                    <Loader2 className="animate-spin text-blue-500" size={32} />
                                </div>
                            ) : details ? (
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-950 text-slate-400 uppercase text-xs font-semibold">
                                        <tr>
                                            <th className="p-4">Kod</th>
                                            <th className="p-4">Ürün Adı</th>
                                            <th className="p-4 text-center">Miktar</th>
                                            <th className="p-4 text-center">Birim</th>
                                            <th className="p-4 text-right">Birim Fiyat</th>
                                            <th className="p-4 text-right">İskonto</th>
                                            <th className="p-4 text-right">KDV</th>
                                            <th className="p-4 text-right">Tutar</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {details.lines.map((line) => (
                                            <tr key={line.id} className="hover:bg-slate-800/50">
                                                <td className="p-4 font-mono text-slate-400">{line.code}</td>
                                                <td className="p-4 text-white font-medium">{line.name}</td>
                                                <td className="p-4 text-center text-slate-300">{line.quantity}</td>
                                                <td className="p-4 text-center text-slate-400 text-xs">{line.unit || 'ADET'}</td>
                                                <td className="p-4 text-right text-slate-300">
                                                    {line.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                                </td>
                                                <td className="p-4 text-right text-rose-400">
                                                    {line.discount > 0 ? `-${line.discount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺` : '-'}
                                                </td>
                                                <td className="p-4 text-right text-slate-400">
                                                    {(line.vatAmount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                                    <span className="text-xs ml-1 opacity-50">(%{line.vatRate})</span>
                                                </td>
                                                <td className="p-4 text-right text-white font-semibold">
                                                    {line.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-8 text-center text-slate-500">Detay bulunamadı</div>
                            )}
                        </div>

                        {/* Footers */}
                        {!loading && details && (
                            <div className="flex justify-end">
                                <div className="w-72 space-y-3">
                                    <div className="flex justify-between text-slate-400">
                                        <span>Ara Toplam</span>
                                        <span>{details.summary.subTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                                    </div>
                                    <div className="flex justify-between text-slate-400">
                                        <span>İskonto</span>
                                        <span className="text-rose-400">-{details.summary.totalDiscount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                                    </div>
                                    <div className="flex justify-between text-slate-400">
                                        <span>Toplam KDV</span>
                                        <span>{details.summary.totalVat.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                                    </div>
                                    <div className="h-px bg-slate-800 my-2"></div>
                                    <div className="flex justify-between text-white text-lg font-bold">
                                        <span>Genel Toplam</span>
                                        <span className="text-blue-400">{details.summary.grandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Payment Details Section */}
                        {!loading && details && details.payments && details.payments.length > 0 && (
                            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mt-2">
                                <div className="p-4 bg-slate-950 font-semibold text-slate-300 flex items-center gap-2 border-b border-slate-800">
                                    <CreditCard size={18} className="text-emerald-400" />
                                    Ödeme & Tahsilat Detayları
                                </div>
                                <div className="p-4">
                                    <table className="w-full text-left text-sm">
                                        <thead className="text-slate-500 uppercase text-[10px] font-semibold">
                                            <tr>
                                                <th className="pb-2">Tarih</th>
                                                <th className="pb-2">İşlem Türü</th>
                                                <th className="pb-2">Açıklama</th>
                                                <th className="pb-2 text-right">Tutar</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/50">
                                            {details.payments.map((pay, i) => (
                                                <tr key={i}>
                                                    <td className="py-2 text-slate-400">{pay.date}</td>
                                                    <td className="py-2 text-white font-medium">{pay.type}</td>
                                                    <td className="py-2 text-slate-500 text-xs">{pay.description || '-'}</td>
                                                    <td className="py-2 text-right text-emerald-400 font-mono">
                                                        {pay.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                {/* Hidden Print Template */}
                <div className="hidden print:block">
                    <div ref={printRef}>
                        <InvoicePrintTemplate
                            invoice={invoice}
                            details={details}
                            companyInfo={companyInfo}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceDetailModal;
