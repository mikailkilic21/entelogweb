import React from 'react';
import { X, Calendar, Wallet, Receipt, AlignLeft, Tag, Hash, Building2, User } from 'lucide-react';

const FinanceDetailModal = ({ isOpen, onClose, transaction }) => {
    if (!isOpen || !transaction) return null;

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            weekday: 'long'
        });
    };

    const formatCurrency = (val) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val || 0);

    // Determine type specific styling
    const isPositive = (transaction.trcode === 70 || transaction.trcode === 3);
    const themeColor = isPositive ? 'emerald' : 'rose';
    const ThemeIcon = isPositive ? Wallet : Receipt;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="relative p-6 pb-8 bg-slate-800/50 border-b border-slate-700">
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} />
                    </button>

                    <div className="flex flex-col items-center text-center space-y-2">
                        <div className={`p-4 rounded-2xl bg-${themeColor}-500/10 text-${themeColor}-400 mb-2 shadow-lg shadow-${themeColor}-900/20`}>
                            <ThemeIcon size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-white uppercase tracking-wide">{transaction.type}</h2>
                        <div className={`text-3xl font-black text-${themeColor}-400`}>
                            {transaction.sign === 1 && !isPositive ? '-' : ''}
                            {formatCurrency(transaction.amount)}
                        </div>
                        <div className="flex items-center text-slate-400 text-sm bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                            <Calendar size={14} className="mr-2" />
                            {formatDate(transaction.date)}
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">

                    {/* Client / Supplier */}
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 flex items-start gap-4">
                        <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg shrink-0">
                            <User size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-bold uppercase mb-0.5">Cari Hesap</p>
                            <p className="text-white font-medium">{transaction.clientName || 'İsimsiz Cari'}</p>
                        </div>
                    </div>

                    {/* Bank Account */}
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 flex items-start gap-4">
                        <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg shrink-0">
                            <Building2 size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-bold uppercase mb-0.5">Banka Hesabı</p>
                            <p className="text-white font-medium">{transaction.bankAccount || '-'}</p>
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-800/30 p-3 rounded-xl border border-slate-700/30">
                            <div className="flex items-center gap-2 mb-1 text-slate-500">
                                <AlignLeft size={14} />
                                <span className="text-xs font-bold uppercase">Açıklama</span>
                            </div>
                            <p className="text-slate-300 text-sm truncate" title={transaction.description}>{transaction.description || '-'}</p>
                        </div>

                        <div className="bg-slate-800/30 p-3 rounded-xl border border-slate-700/30">
                            <div className="flex items-center gap-2 mb-1 text-slate-500">
                                <Hash size={14} />
                                <span className="text-xs font-bold uppercase">Fiş No</span>
                            </div>
                            <p className="text-slate-300 text-sm font-mono">{transaction.ficheNo || '-'}</p>
                        </div>

                        {transaction.speCode && (
                            <div className="bg-slate-800/30 p-3 rounded-xl border border-slate-700/30 col-span-2">
                                <div className="flex items-center gap-2 mb-1 text-slate-500">
                                    <Tag size={14} />
                                    <span className="text-xs font-bold uppercase">Özel Kod</span>
                                </div>
                                <p className="text-slate-300 text-sm">{transaction.speCode}</p>
                            </div>
                        )}
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-800/50 border-t border-slate-700 text-center">
                    <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                        İşlem ID: {transaction.id} • TRCODE: {transaction.trcode}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default FinanceDetailModal;
