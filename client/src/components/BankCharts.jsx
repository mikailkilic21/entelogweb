import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { TrendingUp, PieChart as PieIcon, BarChart3 } from 'lucide-react';

const BankCharts = ({ stats, banks, dailyMovements }) => {
    // 1. Chart Data: Bank Balances (Pie)
    // Filter out 0 balances and sort by balance descending
    const activeBanks = banks
        .filter(b => b.balance > 0)
        .sort((a, b) => b.balance - a.balance);

    // Take top 4 and group rest as 'Diğer'
    const topBanks = activeBanks.slice(0, 4);
    const otherBalance = activeBanks.slice(4).reduce((sum, b) => sum + b.balance, 0);

    const pieData = [
        ...topBanks.map(b => ({ name: b.bankName, value: b.balance })),
        ...(otherBalance > 0 ? [{ name: 'Diğer', value: otherBalance }] : [])
    ];

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#64748b'];

    // 2. Chart Data: 7-Day Flow (Area)
    const areaData = dailyMovements ? dailyMovements.map(m => ({
        name: new Date(m.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
        Giriş: m.incoming,
        Çıkış: m.outgoing
    })) : [];

    // 3. Chart Data: Volume Breakdown (Bar)
    const barData = [
        { name: 'POS', value: stats.totalPOS, fill: '#10b981' }, // Emerald
        { name: 'Havale Giriş', value: stats.totalHavaleIncoming, fill: '#34d399' }, // Emerald Light
        { name: 'Firma KK', value: stats.totalFirmCC, fill: '#f43f5e' }, // Rose
        { name: 'Havale Çıkış', value: stats.totalHavaleOutgoing, fill: '#fb7185' } // Rose Light
    ];

    const formatCurrency = (val) => new Intl.NumberFormat('tr-TR', { notation: 'compact', compactDisplay: 'short', maximumFractionDigits: 1 }).format(val);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

            {/* Chart 1: Likidite Dağılımı */}
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-blue-500/30 transition-all">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                        <PieIcon size={20} />
                    </div>
                    <h3 className="text-slate-300 font-bold text-sm uppercase tracking-wider">Likidite Dağılımı</h3>
                </div>
                <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={70}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
                                itemStyle={{ color: '#fff' }}
                                formatter={(value) => formatCurrency(value)}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                    {pieData.map((entry, index) => (
                        <div key={index} className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                            <span className="text-[10px] text-slate-400 truncate max-w-[80px]">{entry.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chart 2: 7 Günlük Nakit Akışı */}
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                        <TrendingUp size={20} />
                    </div>
                    <h3 className="text-slate-300 font-bold text-sm uppercase tracking-wider">7 Günlük Nakit Akışı</h3>
                </div>
                <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={areaData}>
                            <defs>
                                <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} vertical={false} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px' }}
                                labelStyle={{ color: '#f1f5f9' }}
                                itemStyle={{ color: '#f1f5f9' }}
                            />
                            <Area type="monotone" dataKey="Giriş" stroke="#10b981" fillOpacity={1} fill="url(#colorIn)" strokeWidth={2} />
                            <Area type="monotone" dataKey="Çıkış" stroke="#f43f5e" fillOpacity={1} fill="url(#colorOut)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Chart 3: İşlem Hacmi */}
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-purple-500/30 transition-all">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                        <BarChart3 size={20} />
                    </div>
                    <h3 className="text-slate-300 font-bold text-sm uppercase tracking-wider">İşlem Hacmi (TL)</h3>
                </div>
                <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} horizontal={false} />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
                                labelStyle={{ color: '#f1f5f9' }}
                                itemStyle={{ color: '#f1f5f9' }}
                                cursor={{ fill: '#334155', opacity: 0.2 }}
                                formatter={(value) => formatCurrency(value)}
                            />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                                {barData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

        </div>
    );
};

export default BankCharts;
