import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-800 border border-slate-700 p-4 rounded-lg shadow-xl">
                <p className="text-slate-300 font-medium mb-2">{label}</p>
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                        <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-slate-400 capitalize">
                            {entry.name === 'sales' ? 'Satış' : 'Alış'}:
                        </span>
                        <span className="font-bold text-slate-200">
                            {entry.value.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const SalesChart = ({ data, period }) => {

    const formatXAxis = (tickItem) => {
        if (!tickItem) return '';

        if (period === 'daily') {
            const date = new Date(tickItem);
            if (isNaN(date.getTime())) return tickItem;
            return `${date.getDate()}/${date.getMonth() + 1}`;
        }

        if (period === 'weekly') {
            const parts = tickItem.split('-');
            if (parts.length === 2 && !isNaN(parts[1])) return `H${parts[1]}`;
            return tickItem;
        }

        if (period === 'monthly') {
            const parts = tickItem.split('-');
            if (parts.length === 2) {
                const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
                const mIndex = parseInt(parts[1], 10) - 1;
                if (monthNames[mIndex]) return monthNames[mIndex];
                return `${parts[1]}/${parts[0].slice(2)}`;
            }
            return tickItem;
        }

        return tickItem;
    };

    return (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-lg h-[400px]">
            <div className="mb-6">
                <h3 className="text-xl font-bold text-white">Satış ve Alış Trendi</h3>
                <p className="text-slate-400 text-sm">Son Finansal Hareketler</p>
            </div>

            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
                >
                    <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorPurchase" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis
                        dataKey="date"
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                        tickFormatter={formatXAxis}
                        minTickGap={30}
                    />
                    <YAxis
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        dx={-10}
                        tickFormatter={(value) => `₺${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                        type="monotone"
                        dataKey="sales"
                        stroke="#34d399"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorSales)"
                        name="sales"
                    />
                    <Area
                        type="monotone"
                        dataKey="purchase"
                        stroke="#f43f5e"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorPurchase)"
                        name="purchase"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default SalesChart;
