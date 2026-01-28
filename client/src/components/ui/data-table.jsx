import React from 'react';

export function DataTable({ columns, data }) {
    if (!data) return null;

    return (
        <div className="w-full overflow-auto">
            <table className="w-full caption-bottom text-sm text-left">
                <thead className="[&_tr]:border-b bg-slate-50">
                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        {columns.map((col, i) => (
                            <th key={i} className="h-12 px-4 align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                    {data.length > 0 ? (
                        data.map((row, i) => (
                            <tr key={i} className="border-b transition-colors hover:bg-slate-50 data-[state=selected]:bg-muted">
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
