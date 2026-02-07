import React from 'react';
import { Box, Package } from 'lucide-react';

const ProductRow = React.memo(({ product, onClick }) => {
    return (
        <tr
            onClick={() => onClick(product.id)}
            className="hover:bg-slate-800/40 transition-colors cursor-pointer group border-b border-slate-800/50"
        >
            <td className="p-4 text-sm font-mono text-slate-400 group-hover:text-emerald-400 transition-colors">
                {product.code}
            </td>
            <td className="p-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-800/50 text-slate-400">
                        <Box size={16} />
                    </div>
                    <div>
                        <span className="text-sm font-medium text-white block">{product.name}</span>
                        {product.brand && <span className="text-xs text-slate-500">{product.brand}</span>}
                    </div>
                </div>
            </td>
            <td className="p-4 text-right">
                <div className="flex flex-col items-end gap-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${product.realStock > 0
                        ? 'bg-purple-500/20 text-purple-400'
                        : product.realStock < 0
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-slate-700 text-slate-400'
                        }`}>
                        {product.realStock?.toLocaleString('tr-TR')}
                    </span>
                    {(product.transitStock > 0 || product.reservedStock > 0) && (
                        <div className="flex gap-2 text-[10px]">
                            {product.transitStock > 0 && (
                                <span className="text-amber-500 font-medium">
                                    Yolda: {product.transitStock.toLocaleString('tr-TR')}
                                </span>
                            )}
                            {product.reservedStock > 0 && (
                                <span className="text-slate-500">
                                    Rez: {product.reservedStock.toLocaleString('tr-TR')}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </td>
            <td className="p-4 text-sm text-slate-400 hidden md:table-cell">
                {product.brand || '-'}
            </td>
            <td className="p-4 text-right text-sm font-medium text-emerald-400 font-mono">
                {product.salesAmount > 0 ? `${product.salesAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺` : '-'}
            </td>
            <td className="p-4 text-right text-sm text-slate-300 font-mono">
                {product.salesQuantity > 0 ? `${product.salesQuantity.toLocaleString('tr-TR')} ${product.unit || ''}` : '-'}
            </td>
        </tr>
    );
});

ProductRow.displayName = 'ProductRow';

export default ProductRow;
