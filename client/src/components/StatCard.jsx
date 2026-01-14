import React from 'react';
import { ArrowUpRight, ArrowDownRight, DollarSign } from 'lucide-react';

const StatCard = ({ title, value, type, trend }) => {
    const isPositive = type === 'sales' || type === 'increase';

    return (
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 group">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
                    <h3 className="text-3xl font-bold text-white group-hover:scale-105 transition-transform origin-left">
                        {value}
                    </h3>
                </div>
                <div className={`p-3 rounded-lg ${isPositive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                    {isPositive ? <ArrowUpRight size={24} /> : <ArrowDownRight size={24} />}
                </div>
            </div>
        </div>
    );
};

export default StatCard;
