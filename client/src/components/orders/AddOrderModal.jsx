import React, { useState, useEffect } from 'react';
import { X, Search, Plus, Trash2, Save, Loader2, Calendar, FileText, User, ImageOff } from 'lucide-react';

const AddOrderModal = ({ onClose, onSave, onDelete, editOrder, isCopy }) => {
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Create new order modal or Edit?
    const isEdit = !!editOrder && !isCopy;

    // Header State
    const [header, setHeader] = useState({
        date: new Date().toISOString().split('T')[0],
        ficheNo: '',
        documentNo: '',
        note: '',
        customer: null,
        generalDiscount: 0,
        status: 1
    });

    // Lines State
    const [lines, setLines] = useState([]);

    useEffect(() => {
        if (editOrder) {
            // Pre-fill for edit or copy
            // Calculate initial general discount (Total Discount - Sum of Line Discounts)
            let initialGeneralDiscount = editOrder.totalDiscount || 0;
            if (editOrder.lines) {
                const totalLineDisc = editOrder.lines.reduce((acc, l) => {
                    const price = l.price || 0;
                    const qty = l.quantity || 0;
                    const discRate = l.discountRate || l.discount || 0;
                    const gross = price * qty;
                    return acc + (gross * (discRate / 100));
                }, 0);
                // If totalDiscount is provided, it's usually the sum. 
                // So General = Total - LineDiscounts
                initialGeneralDiscount = Math.max(0, (editOrder.totalDiscount || 0) - totalLineDisc);
            }

            setHeader({
                date: isCopy ? new Date().toISOString().split('T')[0] : editOrder.date,
                ficheNo: isCopy ? '' : editOrder.ficheNo,
                documentNo: isCopy ? '' : (editOrder.documentNo || ''),
                note: editOrder.note1 || '',
                customer: { name: editOrder.accountName || editOrder.customer, code: editOrder.accountCode },
                generalDiscount: initialGeneralDiscount,
                status: isCopy ? 1 : (editOrder.status || 1)
            });

            if (editOrder.lines) {
                setLines(editOrder.lines.map(l => ({
                    ...l,
                    discountRate: l.discountRate || 0,
                    total: l.total || 0,
                    vatRate: l.vatRate || 20
                })));
            } else {
                const fetchDetails = async () => {
                    const res = await fetch(`/api/orders/${editOrder.id}`);
                    if (res.ok) {
                        const heavyData = await res.json();
                        setLines(heavyData.lines.map(l => ({
                            code: l.code,
                            name: l.name,
                            quantity: l.quantity,
                            unit: l.unit,
                            price: l.price,
                            discountRate: l.discount || 0,
                            vatRate: l.vatRate || 20,
                            total: l.total
                        })));
                    }
                };
                fetchDetails();
            }
        }
    }, [editOrder, isCopy]);

    // Customer Search State
    const [customerSearch, setCustomerSearch] = useState('');
    const [customerResults, setCustomerResults] = useState([]);
    const [showCustomerResults, setShowCustomerResults] = useState(false);
    const [loadingCustomers, setLoadingCustomers] = useState(false);

    // Product Search State
    const [productSearch, setProductSearch] = useState('');
    const [productResults, setProductResults] = useState([]);
    const [showProductResults, setShowProductResults] = useState(false);
    const [loadingProducts, setLoadingProducts] = useState(false);

    // --- Search Handlers ---
    useEffect(() => {
        if (!customerSearch) {
            setCustomerResults([]);
            return;
        }
        const timer = setTimeout(async () => {
            setLoadingCustomers(true);
            try {
                const res = await fetch(`/api/accounts?search=${customerSearch}&limit=5`);
                if (res.ok) {
                    const data = await res.json();
                    setCustomerResults(data);
                    setShowCustomerResults(true);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingCustomers(false);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [customerSearch]);

    useEffect(() => {
        if (!productSearch) {
            setProductResults([]);
            return;
        }
        const timer = setTimeout(async () => {
            setLoadingProducts(true);
            try {
                const res = await fetch(`/api/products?search=${productSearch}&limit=5`);
                if (res.ok) {
                    const data = await res.json();
                    setProductResults(data);
                    setShowProductResults(true);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingProducts(false);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [productSearch]);

    // --- Line Management ---
    const addLine = (product) => {
        setLines([...lines, {
            code: product.code,
            name: product.name,
            quantity: 1,
            unit: product.unit || 'ADET',
            price: product.avgPrice || 0, // USE ACTIVE PRICE (From avgPrice for now)
            discountRate: 0, // Row Discount (%)
            total: (product.avgPrice || 0) * 1
        }]);
        setProductSearch('');
        setShowProductResults(false);
    };

    const updateLine = (index, field, value) => {
        const newLines = [...lines];
        const line = newLines[index];

        if (field === 'quantity') line.quantity = parseFloat(value) || 0;
        if (field === 'price') line.price = parseFloat(value) || 0;
        if (field === 'discountRate') line.discountRate = parseFloat(value) || 0;

        // Recalculate total: (Qty * Price) * (1 - Disc/100)
        const grossAmount = line.quantity * line.price;
        const discountAmount = grossAmount * (line.discountRate / 100);
        line.total = grossAmount - discountAmount;

        setLines(newLines);
    };

    const removeLine = (index) => {
        setLines(lines.filter((_, i) => i !== index));
    };

    // --- Totals ---
    const calculateTotals = () => {
        let subTotal = 0; // Ara Toplam (Sum of line nets)
        let totalLineDiscount = 0;

        lines.forEach(line => {
            subTotal += line.total;
            totalLineDiscount += (line.quantity * line.price) - line.total;
        });

        // Apply General Discount on SubTotal
        const generalDiscount = parseFloat(header.generalDiscount) || 0;
        const vatBase = Math.max(0, subTotal - generalDiscount);

        const vatTotal = vatBase * 0.20; // 20% VAT
        const netTotal = vatBase + vatTotal;

        // Gross including line discounts is tricky terminology. 
        // Let's call "GrossTotal" the final Net Total for the object compatibility.
        // But for display we need breakdown.

        return {
            subTotal,
            totalLineDiscount,
            generalDiscount,
            vatBase,
            vatTotal,
            netTotal
        };
    };

    const totals = calculateTotals();

    // --- Save ---
    const handleSave = async () => {
        if (!header.customer) {
            alert('Lütfen bir müşteri seçiniz.');
            return;
        }
        if (lines.length === 0) {
            alert('Lütfen en az bir ürün ekleyiniz.');
            return;
        }

        setSubmitting(true);
        try {
            const orderData = {
                ...header,
                id: isCopy ? undefined : editOrder?.id,
                lines,
                netTotal: totals.netTotal,
                grossTotal: totals.subTotal,
                totalDiscount: totals.totalLineDiscount + totals.generalDiscount,
                totalVat: totals.vatTotal
            };

            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });

            if (res.ok) {
                const newOrder = await res.json();
                if (onSave) onSave(newOrder);
                onClose();
            } else {
                const errorData = await res.json();
                alert(`Sipariş kaydedilirken bir hata oluştu: ${errorData.message || res.statusText}`);
            }
        } catch (err) {
            console.error("Error saving order:", err);
            alert('Sipariş kaydedilirken beklenmeyen bir hata oluştu.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-5xl max-h-[90vh] rounded-2xl flex flex-col shadow-2xl animate-scale-in">

                {/* Header Title */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-900/50 rounded-t-2xl">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <FileText className="text-orange-500" />
                        {isEdit ? 'Siparişi Düzenle' : 'Yeni Sipariş Fişi'}
                    </h2>

                    <div className="flex gap-2">
                        {/* Status Toggle */}
                        <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                            <button
                                onClick={() => setHeader({ ...header, status: 1 })}
                                className={`px-3 py-1 rounded text-sm font-medium transition-all ${header.status === 1 ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white'}`}
                            >
                                Öneri
                            </button>
                            <button
                                onClick={() => setHeader({ ...header, status: 4 })}
                                className={`px-3 py-1 rounded text-sm font-medium transition-all ${header.status === 4 ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
                            >
                                Onaylı
                            </button>
                        </div>

                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Form Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* 1. Header Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Customer Search */}
                        <div className="relative z-20">
                            <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Müşteri (Cari)</label>
                            {header.customer ? (
                                <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
                                            <User size={18} />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-white">{header.customer.name}</div>
                                            <div className="text-xs text-blue-300">{header.customer.code}</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setHeader({ ...header, customer: null })}
                                        className="text-slate-400 hover:text-white"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Cari adı veya kodu ara..."
                                        value={customerSearch}
                                        onChange={(e) => setCustomerSearch(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:border-orange-500 focus:outline-none"
                                    />
                                    {showCustomerResults && customerResults.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-50">
                                            {customerResults.map(c => (
                                                <button
                                                    key={c.id}
                                                    onClick={() => {
                                                        setHeader({ ...header, customer: c });
                                                        setCustomerSearch('');
                                                        setShowCustomerResults(false);
                                                    }}
                                                    className="w-full text-left p-3 hover:bg-slate-700 border-b border-slate-700/50 last:border-0 flex justify-between group"
                                                >
                                                    <span className="text-white font-medium group-hover:text-orange-400 transition-colors">{c.name}</span>
                                                    <span className="text-slate-500 text-xs font-mono">{c.code}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Date */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Tarih</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                <input
                                    type="date"
                                    value={header.date}
                                    onChange={(e) => setHeader({ ...header, date: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:border-orange-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* Fiche No */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Fiş No (Opsiyonel)</label>
                            <input
                                type="text"
                                placeholder="Otomatik Üretilecek"
                                value={header.ficheNo}
                                onChange={(e) => setHeader({ ...header, ficheNo: e.target.value })}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-orange-500 focus:outline-none font-mono text-sm"
                            />
                        </div>
                    </div>

                    {/* Note */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Açıklama / Not</label>
                        <input
                            type="text"
                            placeholder="Sipariş notu..."
                            value={header.note}
                            onChange={(e) => setHeader({ ...header, note: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-orange-500 focus:outline-none"
                        />
                    </div>

                    {/* 2. Product Search & Add */}
                    <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50 pt-2 pb-6">
                        <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Ürün Ekle</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Ürün adı veya kodu ara..."
                                value={productSearch}
                                onChange={(e) => setProductSearch(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                            />
                            {loadingProducts && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <Loader2 className="animate-spin text-emerald-500" size={16} />
                                </div>
                            )}
                            {showProductResults && productResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 max-h-72 overflow-y-auto">
                                    {productResults.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => addLine(p)}
                                            className="w-full text-left p-3 hover:bg-slate-700 border-b border-slate-700/50 last:border-0 flex items-center gap-3 group"
                                        >
                                            {/* Product Image Thumbnail */}
                                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-900 border border-slate-700 flex-shrink-0 flex items-center justify-center">
                                                <img
                                                    src={`/api/products/image/${encodeURIComponent(p.code)}`}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.nextSibling.style.display = 'flex';
                                                    }}
                                                />
                                                <div style={{ display: 'none' }} className="items-center justify-center w-full h-full">
                                                    <ImageOff size={16} className="text-slate-600" />
                                                </div>
                                            </div>
                                            {/* Product Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="text-white font-medium group-hover:text-emerald-400 transition-colors truncate">{p.name}</div>
                                                <div className="text-slate-500 text-xs font-mono">{p.code}</div>
                                            </div>
                                            {/* Stock & Add */}
                                            <div className="flex items-center gap-3 flex-shrink-0">
                                                <div className="text-right">
                                                    <div className="text-xs text-slate-400">Stok</div>
                                                    <div className={`text-sm font-medium ${p.stockLevel > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                        {p.stockLevel} {p.unit}
                                                    </div>
                                                </div>
                                                <Plus size={18} className="text-slate-600 group-hover:text-white" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 3. Lines Table */}
                    <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden min-h-[200px]">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900 text-slate-400 uppercase text-xs font-semibold">
                                <tr>
                                    <th className="p-4">#</th>
                                    <th className="p-4">Ürün</th>
                                    <th className="p-4 text-center">Miktar</th>
                                    <th className="p-4">Birim</th>
                                    <th className="p-4 text-right">B.Fiyat</th>
                                    <th className="p-4 text-center">İsk (%)</th>
                                    <th className="p-4 text-center">KDV (%)</th>
                                    <th className="p-4 text-right">Tutar</th>
                                    <th className="p-4 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {lines.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" className="p-10 text-center text-slate-500">
                                            Henüz ürün eklenmedi.
                                        </td>
                                    </tr>
                                ) : (
                                    lines.map((line, index) => (
                                        <tr key={index} className="hover:bg-slate-800 transition-colors group">
                                            <td className="p-4 text-slate-500 text-xs font-mono">{index + 1}</td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-7 h-7 rounded overflow-hidden bg-slate-900 border border-slate-700 flex-shrink-0 flex items-center justify-center">
                                                        <img
                                                            src={`/api/products/image/${encodeURIComponent(line.code)}`}
                                                            alt=""
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                                e.target.nextSibling.style.display = 'flex';
                                                            }}
                                                        />
                                                        <div style={{ display: 'none' }} className="items-center justify-center w-full h-full">
                                                            <ImageOff size={12} className="text-slate-700" />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-white">{line.name}</div>
                                                        <div className="text-xs text-slate-500 font-mono">{line.code}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={line.quantity}
                                                    onChange={(e) => updateLine(index, 'quantity', e.target.value)}
                                                    className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center text-white focus:border-orange-500 focus:outline-none"
                                                />
                                            </td>
                                            <td className="p-4 text-center text-xs text-slate-400">{line.unit}</td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={line.price}
                                                        onChange={(e) => updateLine(index, 'price', e.target.value)}
                                                        className="w-24 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-right text-white focus:border-orange-500 focus:outline-none"
                                                    />
                                                    <span className="text-slate-500 text-xs">₺</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={line.discountRate}
                                                    onChange={(e) => updateLine(index, 'discountRate', e.target.value)}
                                                    className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center text-rose-300 focus:border-rose-500 focus:outline-none"
                                                    placeholder="0"
                                                />
                                            </td>
                                            <td className="p-4 text-center">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={line.vatRate || 20}
                                                    onChange={(e) => updateLine(index, 'vatRate', e.target.value)}
                                                    className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center text-blue-300 focus:border-blue-500 focus:outline-none"
                                                />
                                            </td>
                                            <td className="p-4 text-right font-medium text-emerald-400">
                                                {line.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                            </td>
                                            <td className="p-4 text-center">
                                                <button
                                                    onClick={() => removeLine(index)}
                                                    className="p-1 text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                </div>

                {/* Footer Totals & Actions */}
                <div className="p-6 border-t border-white/10 bg-slate-900/50 flex flex-col md:flex-row justify-between items-center gap-6 rounded-b-2xl">
                    <div className="text-xs text-slate-500">
                        * Bu sipariş geçici olarak sisteme kaydedilecek ve test için kullanılacaktır.
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex flex-col gap-1 text-right">
                            <div className="flex justify-end gap-2 items-center text-xs text-slate-400">
                                <span>Ara Toplam:</span>
                                <span className="font-medium text-slate-300 w-24">{totals.subTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-end gap-2 items-center text-xs text-rose-400">
                                <span>Genel İsk. (% {totals.subTotal > 0 ? ((header.generalDiscount / totals.subTotal) * 100).toFixed(2) : '0.00'}):</span>
                                <div className="w-24">
                                    <input
                                        type="number"
                                        className="w-full bg-slate-800 border border-rose-900/50 rounded px-1 py-0.5 text-right text-rose-400 text-xs focus:outline-none focus:border-rose-500"
                                        placeholder="0"
                                        value={header.generalDiscount}
                                        onChange={(e) => setHeader({ ...header, generalDiscount: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 items-center text-xs text-rose-300/80">
                                <span>Toplam İskonto:</span>
                                <span className="font-medium w-24">{(totals.totalLineDiscount + totals.generalDiscount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-end gap-2 items-center text-xs text-blue-400">
                                <span>KDV:</span>
                                <span className="font-medium w-24">{totals.vatTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                            </div>

                            <div className="flex justify-end gap-2 items-center mt-2 pt-2 border-t border-white/10">
                                <span className="text-sm font-bold text-white">Genel Toplam:</span>
                                <span className="text-xl font-bold text-orange-400 w-24">{totals.netTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                            </div>
                        </div>

                        {/* Delete Button (Only for Edit) */}
                        {isEdit && onDelete && (
                            <button
                                onClick={() => onDelete(editOrder.id)}
                                className="bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-200 border border-red-500/30 px-4 py-3 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 h-fit"
                            >
                                <Trash2 size={20} />
                            </button>
                        )}

                        <button
                            onClick={handleSave}
                            disabled={submitting}
                            className="bg-orange-600 hover:bg-orange-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-orange-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed h-fit"
                        >
                            {submitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                            {isEdit ? 'Güncelle' : 'Siparişi Kaydet'}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AddOrderModal;
