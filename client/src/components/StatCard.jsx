import React from 'react';
import { ArrowUpRight, ArrowDownRight, TrendingUp, ShoppingCart, FileText, Package, DollarSign, Briefcase, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';

const StatCard = ({ title, value, trend, period, icon, color = 'blue', isCurrency = false }) => {
    // Icon mapping
    const icons = {
        'trending-up': TrendingUp,
        'shopping-cart': ShoppingCart,
        'file-text': FileText,
        'package': Package,
        'dollar-sign': DollarSign,
        'briefcase': Briefcase,
        'check-circle': CheckCircle,
        'refresh-cw': RefreshCw,
        'alert-circle': AlertCircle
    };
    const IconComponent = icons[icon] || DollarSign;

    // Color mapping for backgrounds/accents
    const colors = {
        green: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
        orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    };
    const colorClass = colors[color] || colors.blue;

    // Format value
    const formattedValue = React.useMemo(() => {
        if (value === undefined || value === null) return '-';

        let val = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(val)) return value;

        if (isCurrency) {
            return val.toLocaleString('tr-TR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        }
        return val.toLocaleString('tr-TR');
    }, [value, isCurrency]);

    return (
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl hover:shadow-2xl transition-all duration-300 group">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${colorClass} transition-colors`}>
                    <IconComponent size={24} />
                </div>
                {trend !== undefined && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${trend >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                        {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        <span>{Math.abs(trend)}%</span>
                    </div>
                )}
            </div>

            <div>
                <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">
                    {formattedValue}
                    {isCurrency && <span className="text-sm font-normal text-slate-500 ml-1">₺</span>}
                </h3>
            </div>
        </div>
    );
};

export default StatCard;
