import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg shadow-xl">
                <p className="text-slate-300 font-medium mb-1">{payload[0].name}</p>
                <p className="font-bold text-white text-lg">
                    {payload[0].value.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                </p>
            </div>
        );
    }
    return null;
};

const TopCustomersChart = ({ data }) => {
    const COLORS = ['#0ea5e9', '#22d3ee', '#34d399', '#a78bfa', '#f472b6'];

    return (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-lg h-[400px]">
            <div className="mb-6">
                <h3 className="text-xl font-bold text-white">En İyi Müşteriler</h3>
                <p className="text-slate-400 text-sm">Ciro bazında ilk 5 müşteri</p>
            </div>

            <ResponsiveContainer width="100%" height="80%">
                <PieChart>
                    <Pie
                        data={data}
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        formatter={(value) => <span className="text-slate-300 text-xs ml-1">{value}</span>}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export default TopCustomersChart;
