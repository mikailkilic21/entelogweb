import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg shadow-xl">
                <p className="text-slate-300 font-medium mb-1">{payload[0].payload.name}</p>
                <p className="font-bold text-white text-lg">
                    {payload[0].value.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                </p>
            </div>
        );
    }
    return null;
};

const TopProductsChart = ({ data }) => {
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316'];

    return (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-lg h-[400px] flex flex-col">
            <div className="mb-4 flex-none">
                <h3 className="text-xl font-bold text-white">En Çok Satanlar</h3>
                <p className="text-slate-400 text-sm">Ciro bazında ilk 5 ürün</p>
            </div>

            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        layout="vertical"
                        data={data}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        barSize={30}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
                        <XAxis type="number" hide />
                        <YAxis
                            dataKey="name"
                            type="category"
                            width={100}
                            tick={{ fill: '#94a3b8', fontSize: 11 }}
                            tickFormatter={(value) => value.length > 12 ? value.substring(0, 12) + '...' : value}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default TopProductsChart;
