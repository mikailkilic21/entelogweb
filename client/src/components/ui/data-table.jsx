import React from 'react';

export function DataTable({ columns, data, onRowClick }) {
    if (!data) return null;

    return (
        <div className="w-full overflow-auto">
            <table className="w-full caption-bottom text-sm text-left">
                <thead className="[&_tr]:border-b bg-slate-900/80 border-slate-700 shadow-sm sticky top-0 z-10 backdrop-blur-md">
                    <tr className="border-b border-slate-700 transition-colors hover:bg-white/5 data-[state=selected]:bg-slate-800">
                        {columns.map((col, i) => (
                            <th key={i} className="h-12 px-4 align-middle font-bold text-slate-400 [&:has([role=checkbox])]:pr-0 uppercase text-xs tracking-wider">
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0 bg-transparent text-slate-300">
                    {data.length > 0 ? (
                        data.map((row, i) => (
                            <tr
                                key={i}
                                onClick={() => onRowClick && onRowClick(row)}
                                className={`border-b border-slate-800 transition-colors hover:bg-blue-500/10 data-[state=selected]:bg-slate-800 even:bg-slate-800/30 ${onRowClick ? 'cursor-pointer' : ''}`}
                            >
                                {columns.map((col, j) => (
                                    <td key={j} className="p-4 align-middle [&:has([role=checkbox])]:pr-0">
                                        {col.cell ? col.cell({ row: { original: row } }) : row[col.accessorKey]}
                                    </td>
                                ))}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={columns.length} className="h-24 text-center">
                                Veri bulunamadı.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
