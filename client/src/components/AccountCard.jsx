import React from 'react';
import { Building2, Phone, MapPin, TrendingUp, TrendingDown } from 'lucide-react';

const AccountCard = ({ account, onClick }) => {
    const isCustomer = account.cardType === 1 || (account.cardType === 0 && account.balance >= 0);
    const isPositiveBalance = account.balance >= 0;

    return (
        <div
            onClick={() => onClick(account)}
            className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-blue-500/50 transition-all cursor-pointer hover:shadow-lg hover:shadow-blue-500/10 group"
        >
            {/* Header with name and type badge */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <Building2 size={18} className="text-slate-400" />
                        <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                            {account.name}
                        </h3>
                    </div>
                    <p className="text-sm text-slate-500">Kod: {account.code}</p>
                </div>
                <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${isCustomer
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-purple-500/20 text-purple-400'
                        }`}
                >
                    {isCustomer ? 'Müşteri' : 'Tedarikçi'}
                </span>
            </div>

            {/* Contact Info */}
            <div className="space-y-2 mb-4">
                {account.phone1 && (
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Phone size={14} />
                        <span>{account.phone1}</span>
                    </div>
                )}
                {(account.address1 || account.address2) && (
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                        <MapPin size={14} />
                        <span className="truncate">
                            {[account.address1, account.address2].filter(Boolean).join(', ')}
                        </span>
                    </div>
                )}
            </div>

            {/* Balance */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <span className="text-sm text-slate-400">Bakiye</span>
                <div className="flex items-center gap-2">
                    {isPositiveBalance ? (
                        <TrendingUp size={16} className="text-green-400" />
                    ) : (
                        <TrendingDown size={16} className="text-red-400" />
                    )}
                    <span
                        className={`text-lg font-bold ${isPositiveBalance ? 'text-green-400' : 'text-red-400'
                            }`}
                    >
                        {Math.abs(account.balance).toLocaleString('tr-TR', {
                            style: 'currency',
                            currency: 'TRY'
                        })}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default AccountCard;
