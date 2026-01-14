import React, { useEffect, useState } from 'react';
import { X, FileText, Calendar, Building2, CreditCard, Loader2 } from 'lucide-react';

const CheckDetailModal = ({ payrollId, onClose }) => {
    const [checks, setChecks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!payrollId) return;

        const fetchDetails = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/checks/payroll/${payrollId}`);
                if (res.ok) {
                    setChecks(await res.json());
                }
            } catch (error) {
                console.error('Error fetching check details:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [payrollId]);

    if (!payrollId) return null;

    // Calculate totals
    const totalAmount = checks.reduce((sum, c) => sum + (c.amount || 0), 0);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden shadow-2xl flex flex-col animate-scale-in">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-800 shrink-0 bg-slate-900">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-400">
                            <CreditCard size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Çek/Senet Bordro Detayı</h2>
                            <p className="text-sm text-slate-400 font-mono">#{payrollId}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                        <X size={24} className="text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center p-12">
                            <Loader2 className="animate-spin text-indigo-500" size={32} />
                        </div>
                    ) : checks.length > 0 ? (
                        <div className="space-y-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                                    <span className="text-sm text-slate-400 block mb-1">Toplam Adet</span>
                                    <span className="text-2xl font-bold text-white">{checks.length}</span>
                                </div>
                                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                                    <span className="text-sm text-slate-400 block mb-1">Toplam Tutar</span>
                                    <span className="text-2xl font-bold text-indigo-400">
                                        {totalAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                                    </span>
                                </div>
                            </div>

                            {/* List */}
                            <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-slate-800/80">
                                        <tr>
                                            <th className="text-left p-3 text-sm text-slate-400">Seri No</th>
                                            <th className="text-left p-3 text-sm text-slate-400">Portföy No</th>
                                            <th className="text-left p-3 text-sm text-slate-400">Vade Tarihi</th>
                                            <th className="text-left p-3 text-sm text-slate-400">Banka</th>
                                            <th className="text-right p-3 text-sm text-slate-400">Tutar</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {checks.map((check, idx) => (
                                            <tr key={idx} className="hover:bg-slate-800/40">
                                                <td className="p-3 text-sm text-white font-mono">{check.serialNo || '-'}</td>
                                                <td className="p-3 text-sm text-slate-300">{check.portfolioNo || '-'}</td>
                                                <td className="p-3 text-sm text-slate-300">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar size={14} className="text-slate-500" />
                                                        {check.dueDate ? new Date(check.dueDate).toLocaleDateString('tr-TR') : '-'}
                                                    </div>
                                                </td>
                                                <td className="p-3 text-sm text-slate-300">
                                                    {check.bankName ? (
                                                        <div className="flex items-center gap-2">
                                                            <Building2 size={14} className="text-indigo-400" />
                                                            {check.bankName}
                                                        </div>
                                                    ) : '-'}
                                                </td>
                                                <td className="p-3 text-right text-sm font-bold text-white">
                                                    {check.amount?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="p-12 text-center border border-slate-800 rounded-xl bg-slate-900/50">
                            <FileText size={32} className="mx-auto mb-3 text-slate-600" />
                            <p className="text-slate-400">Bu bordroda kayıtlı çek/senet bulunamadı.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CheckDetailModal;
