import React, { useState } from 'react';
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

const TopAccountsChart = ({ customersData, suppliersData }) => {
    const [activeTab, setActiveTab] = useState('customers');
    const COLORS = ['#0ea5e9', '#22d3ee', '#34d399', '#a78bfa', '#f472b6'];

    const data = activeTab === 'customers' ? customersData : suppliersData;
    const title = activeTab === 'customers' ? 'En İyi Müşteriler' : 'En Çok Alım Yapılanlar';
    const subtitle = activeTab === 'customers' ? 'Ciro bazında ilk 5 müşteri' : 'Ciro bazında ilk 5 tedarikçi';

    return (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-lg h-[450px] flex flex-col">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-xl font-bold text-white">{title}</h3>
                    <p className="text-slate-400 text-sm">{subtitle}</p>
                </div>
                <div className="flex bg-slate-800 rounded-lg p-1">
                    <button
                        onClick={() => setActiveTab('customers')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeTab === 'customers' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        Müşteriler
                    </button>
                    <button
                        onClick={() => setActiveTab('suppliers')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeTab === 'suppliers' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        Tedarikçiler
                    </button>
                </div>
            </div>

            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="55%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        layout="horizontal"
                        verticalAlign="bottom"
                        align="center"
                        iconType="circle"
                        wrapperStyle={{ paddingTop: "20px" }}
                        formatter={(value) => (
                            <span className="text-slate-300 text-xs ml-1" title={value}>
                                {value.length > 20 ? `${value.substring(0, 20)}...` : value}
                            </span>
                        )}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export default TopAccountsChart;
