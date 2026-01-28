import React, { useState } from 'react';
import { PieChart, Pie, Sector, Cell, ResponsiveContainer, Legend } from 'recharts';

const renderActiveShape = (props) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;

    return (
        <g>
            <text x={cx} y={cy} dy={-10} textAnchor="middle" fill="#fff" className="text-lg font-bold">
                {payload.name.length > 15 ? payload.name.substring(0, 15) + '...' : payload.name}
            </text>
            <text x={cx} y={cy} dy={20} textAnchor="middle" fill="#E2E8F0" className="text-sm font-medium">
                {`%${(percent * 100).toFixed(1)}`}
            </text>
            <text x={cx} y={cy} dy={40} textAnchor="middle" fill="#94a3b8" className="text-xs">
                {value.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })}
            </text>
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius + 8}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
                stroke="#1e293b"
                strokeWidth={2}
            />
            <Sector
                cx={cx}
                cy={cy}
                startAngle={startAngle}
                endAngle={endAngle}
                innerRadius={outerRadius + 12}
                outerRadius={outerRadius + 16}
                fill={fill}
            />
        </g>
    );
};

const StockDistributionChart = ({ data, className, title, subtitle }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    // Enhanced Palette: Emerald, Blue, Violet, Pink, Amber, Cyan, Rose
    const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#06B6D4', '#F43F5E'];

    const onPieEnter = (_, index) => {
        setActiveIndex(index);
    };

    return (
        <div className={`bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-lg flex flex-col ${className || 'h-[500px]'}`}>
            {(title || subtitle) ? (
                <div className="mb-4 flex-none">
                    {title && <h3 className="text-xl font-bold text-white">{title}</h3>}
                    {subtitle && <p className="text-slate-400 text-sm">{subtitle}</p>}
                </div>
            ) : (
                <div className="mb-4 flex-none">
                    <h3 className="text-xl font-bold text-white">Cari Dağılımı</h3>
                    <p className="text-slate-400 text-sm">En çok işlem yapılan cariler</p>
                </div>
            )}

            <div className="flex-1 min-h-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            activeIndex={activeIndex}
                            activeShape={renderActiveShape}
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={110}
                            paddingAngle={3}
                            dataKey="value"
                            onMouseEnter={onPieEnter}
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[index % COLORS.length]}
                                    stroke="rgba(0,0,0,0.2)"
                                    strokeWidth={1}
                                />
                            ))}
                        </Pie>
                        <Legend
                            layout="horizontal"
                            verticalAlign="bottom"
                            align="center"
                            iconType="circle"
                            wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                            formatter={(value) => (
                                <span className="text-slate-300 ml-1 font-medium">
                                    {value.length > 20 ? `${value.substring(0, 20)}...` : value}
                                </span>
                            )}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default StockDistributionChart;
