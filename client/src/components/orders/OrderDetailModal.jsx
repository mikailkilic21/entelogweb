import React, { useState, useEffect } from 'react';
import { X, Printer, Loader2, FileDown } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const OrderDetailModal = ({ order, onClose }) => {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [companyInfo, setCompanyInfo] = useState(null);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const [orderRes, companyRes] = await Promise.all([
                    fetch(`/api/orders/${order.id}`),
                    fetch('/api/settings/company')
                ]);

                if (orderRes.ok) {
                    const data = await orderRes.json();
                    setDetails(data);
                }
                if (companyRes.ok) {
                    const companyData = await companyRes.json();
                    setCompanyInfo(companyData);
                }
            } catch (error) {
                console.error('Error fetching details:', error);
            } finally {
                setLoading(false);
            }
        };

        if (order) {
            fetchDetails();
        }
    }, [order]);

    // Calculate Shipment Status
    const getShipmentStatus = () => {
        if (!details || !details.lines) return null;

        const totalQty = details.lines.reduce((acc, line) => acc + line.quantity, 0);
        const totalShipped = details.lines.reduce((acc, line) => acc + (line.shippedAmount || 0), 0);

        // Logic for S/B/K
        if (totalShipped === 0) return 'S'; // Sevk Bekliyor
        if (totalShipped >= totalQty || (details.header.closed === 1)) return 'K'; // Kapandı
        return 'B'; // Kısmi Sevk
    };

    const status = getShipmentStatus();
    const isClosed = status === 'K';
    const isPartial = status === 'B';

    // PDF Generation
    const generatePDF = async (type) => {
        try {
            if (!details) {
                console.error('Details is missing');
                return;
            }

            const doc = new jsPDF();

            // Helper for browser-safe base64
            const arrayBufferToBase64 = (buffer) => {
                let binary = '';
                const bytes = new Uint8Array(buffer);
                const len = bytes.byteLength;
                for (let i = 0; i < len; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                return window.btoa(binary);
            };

            // --- 1. ASSETS LOADING (Font & Logo) ---
            let logoData = null;
            let logoExtension = 'JPEG';

            try {
                // Parallel fetching of Font and Logo (if exists)
                const promises = [];

                // Font URL - Using a reliable source for Roboto Regular that supports Turkish
                const fontUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf';
                promises.push(fetch(fontUrl).then(res => res.arrayBuffer()).then(buffer => ({ type: 'font', buffer })));

                // Logo URL
                if (companyInfo && companyInfo.logoPath) {
                    promises.push(fetch(companyInfo.logoPath).then(res => {
                        if (!res.ok) throw new Error('Logo fetch failed');
                        const contentType = res.headers.get('content-type');
                        if (contentType) {
                            if (contentType.includes('png')) logoExtension = 'PNG';
                            else if (contentType.includes('jpeg') || contentType.includes('jpg')) logoExtension = 'JPEG';
                        }
                        return res.arrayBuffer();
                    }).then(buffer => ({ type: 'logo', buffer })));
                }

                const results = await Promise.allSettled(promises);

                // Process Results
                results.forEach(result => {
                    if (result.status === 'fulfilled') {
                        if (result.value.type === 'font') {
                            try {
                                const fontBase64 = arrayBufferToBase64(result.value.buffer);
                                doc.addFileToVFS('Roboto-Regular.ttf', fontBase64);
                                doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
                                doc.addFont('Roboto-Regular.ttf', 'Roboto', 'bold');
                                doc.addFont('Roboto-Regular.ttf', 'Roboto', 'italic');
                                doc.setFont('Roboto');
                            } catch (e) {
                                console.error("Font add error:", e);
                            }
                        } else if (result.value.type === 'logo') {
                            logoData = arrayBufferToBase64(result.value.buffer);
                        }
                    } else {
                        console.warn('Asset fetch failed:', result.reason);
                    }
                });

            } catch (assetError) {
                console.warn('Asset loading error:', assetError);
            }

            // Re-apply font just in case
            if (doc.existsFileInVFS('Roboto-Regular.ttf')) {
                doc.setFont('Roboto');
            }

            const formatCurrency = (val, currency = 'TRY') => {
                return val?.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00';
            };

            // --- DESIGN: PREMIUM HEADER BLOCK ---
            // Top Bar Background
            doc.setFillColor(23, 37, 84); // Navy Blue
            const headerHeight = 60; // Increased to fit text below logo
            doc.rect(0, 0, 210, headerHeight, 'F');

            // Set Font for Header
            doc.setFont('Roboto', 'normal');

            // Helper to get image properties (width/height) from base64
            const getImageProperties = (base64) => {
                return new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => {
                        resolve({ width: img.width, height: img.height });
                    };
                    img.onerror = () => {
                        resolve({ width: 0, height: 0 });
                    };
                    img.src = `data:image/${logoExtension.toLowerCase()};base64,${base64}`;
                });
            };

            // Logo OR Placeholder
            let logoBottomY = 35; // Default bottom anchor for text

            if (logoData) {
                try {
                    const imgProps = await getImageProperties(logoData);

                    let imgW = 25; // Slightly smaller base size
                    let imgH = 25;

                    if (imgProps.width > 0 && imgProps.height > 0) {
                        const ratio = imgProps.width / imgProps.height;

                        // Max box
                        const maxW = 40;
                        const maxH = 25; // Limit height to leave room for text

                        if (ratio > 1) { // Landscape
                            imgW = maxW;
                            imgH = maxW / ratio;
                            if (imgH > maxH) {
                                imgH = maxH;
                                imgW = maxH * ratio;
                            }
                        } else { // Portrait or Square
                            imgH = maxH;
                            imgW = maxH * ratio;
                            if (imgW > maxW) {
                                imgW = maxW;
                                imgH = maxW / ratio;
                            }
                        }
                    }

                    // Position: Center horizontally in a left-side column (e.g., width 60)? 
                    // Or left align with margin? User said "below logo" for title.
                    // Let's assume left alignment at x=15.

                    const logoY = 7;
                    doc.addImage(logoData, logoExtension, 15, logoY, imgW, imgH);
                    logoBottomY = logoY + imgH;

                } catch (imgErr) {
                    console.error("AddImage fail", imgErr);
                    // Fallback
                    doc.setFillColor(255, 255, 255);
                    doc.circle(25, 20, 10, 'F');
                    doc.setTextColor(220, 38, 38);
                    doc.text('Y', 22, 23);
                    logoBottomY = 32;
                }
            } else {
                // Logo Placeholder
                doc.setFillColor(255, 255, 255);
                doc.circle(25, 20, 10, 'F');
                doc.setTextColor(220, 38, 38);
                doc.setFontSize(16);
                doc.text('Y', 22, 23);
                logoBottomY = 32;
            }

            // Company Name (White) - Below Logo
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10); // Reduced size further if needed to fit
            doc.setFont('Roboto', 'bold');
            const companyName = companyInfo?.companyName || 'YAKIŞIKLI ELEKTRİK';

            // Allow multiline if too long for the left side? Or just write it.
            // Split into lines if needed or just use max width.
            // Let's print it below logo, left aligned to x=15
            doc.text(companyName, 15, logoBottomY + 5, { maxWidth: 80 });

            // Subtitle / Legal Name - Below Name (optional, or just part of name logic)
            doc.setFont('Roboto', 'normal');
            doc.setFontSize(7);
            doc.setTextColor(200, 200, 200);
            // doc.text('ELEKTRONİK İNŞ. NAK. TİC. LTD. ŞTİ.', 15, logoBottomY + 10); // Often part of the main name


            // Contact Info (Right Side - White)
            // Using a distinct block on the right
            doc.setFontSize(8);
            doc.setTextColor(240, 240, 240);

            const rightX = 200;
            const startY = 12;
            const lineHeight = 4;

            const address = companyInfo?.address || 'BAĞCILAR MH. SUN YAPI B/BLOK NO:199/D';
            doc.text(address, rightX, startY, { align: 'right' });

            const city = companyInfo?.city || 'DİYARBAKIR';
            const town = companyInfo?.town || 'BAĞLAR';
            const cityInfo = `${town} / ${city}`;
            doc.text(cityInfo, rightX, startY + lineHeight, { align: 'right' });

            doc.text(`Tel: ${companyInfo?.phone || '0412 502 18 93'}`, rightX, startY + (lineHeight * 2), { align: 'right' });
            doc.text(`Web: ${companyInfo?.website || 'www.yakisiklielektrik.com.tr'}`, rightX, startY + (lineHeight * 3), { align: 'right' });
            doc.text(`Mail: ${companyInfo?.email || 'yakisikli_elektrik@hotmail.com'}`, rightX, startY + (lineHeight * 4), { align: 'right' });

            if (companyInfo?.taxOffice && companyInfo?.taxNo) {
                doc.text(`${companyInfo.taxOffice} VD - ${companyInfo.taxNo}`, rightX, startY + (lineHeight * 5), { align: 'right' });
            }

            // --- DOCUMENT INFO (Below Header) ---
            doc.setTextColor(0, 0, 0);
            // Changed 'SİPARİŞ FORMU' to 'TEKLİF FORMU' as requested
            const docTitle = order.status === 1 ? 'FİYAT TEKLİFİ' : 'TEKLİF FORMU';

            // Title Box - Adjust Y position because header is taller now (60px)
            const contentStartY = headerHeight + 5; // 65

            doc.setFillColor(245, 245, 245);
            doc.rect(15, contentStartY, 180, 15, 'F');

            doc.setFontSize(14);
            doc.setFont('Roboto', 'bold');
            doc.setTextColor(23, 37, 84); // Navy
            doc.text(docTitle, 105, contentStartY + 9, { align: 'center' });

            // Date & No
            doc.setFontSize(9);
            doc.setFont('Roboto', 'normal');
            doc.setTextColor(80, 80, 80);
            doc.text(`Tarih: ${new Date(details.header.date).toLocaleDateString('tr-TR')}`, 190, contentStartY + 5, { align: 'right' });
            doc.text(`Belge No: ${details.header.ficheNo}`, 190, contentStartY + 9, { align: 'right' });


            // --- CUSTOMER CARD ---
            const customerY = contentStartY + 20; // 85
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.1);
            doc.rect(15, customerY, 180, 20, 'S');

            // "Sayın" Label
            doc.setFillColor(23, 37, 84); // Navy
            doc.rect(15, customerY, 180, 6, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(8);
            doc.setFont('Roboto', 'bold');
            doc.text('MÜŞTERİ BİLGİLERİ', 18, customerY + 4);

            // Value
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(10);
            doc.setFont('Roboto', 'normal');
            doc.text(details.header.customer || '', 18, customerY + 12);
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text(details.header.address || '', 18, customerY + 16);

            // --- TABLE ---
            // Prepare Data
            let tableColumn = [];
            let tableRows = [];

            const getDiscRate = (line) => line.discount && line.quantity && line.price ? ((line.discount / (line.quantity * line.price)) * 100) : 0;
            const getDiscRateVal = (line) => {
                const r = getDiscRate(line);
                return r > 0 ? formatCurrency(r).replace(',00', '') : '';
            };

            const commonHeadStyles = {
                fillColor: [23, 37, 84], // Navy Blue Header
                textColor: 255,
                fontSize: 8,
                halign: 'center',
                valign: 'middle',
                fontStyle: 'bold',
                font: 'Roboto', // Ensures Turkish chars in header
                cellPadding: 3
            };

            const commonBodyStyles = {
                font: 'Roboto', // Ensures Turkish chars in body
                fontSize: 8,
                textColor: 50
            };

            if (type === 1) { // Standard
                tableColumn = [
                    { title: '#', dataKey: 'index' },
                    { title: 'Kod', dataKey: 'code' },
                    { title: 'Ürün / Hizmet', dataKey: 'name' },
                    { title: 'Miktar', dataKey: 'quantity' },
                    { title: 'Birim', dataKey: 'unit' },
                    { title: 'B.Fiyat', dataKey: 'price' },
                    { title: 'İsk%', dataKey: 'discRate' },
                    { title: 'İsk.Tut', dataKey: 'discAmount' },
                    { title: 'Net Tutar', dataKey: 'total' }
                ];
                tableRows = details.lines.map((line, i) => ({
                    index: i + 1,
                    code: line.code,
                    name: line.name,
                    quantity: line.quantity,
                    unit: line.unit,
                    price: formatCurrency(line.price),
                    discRate: getDiscRateVal(line),
                    discAmount: line.discount > 0 ? formatCurrency(line.discount) : '',
                    total: formatCurrency(line.total)
                }));
            } else if (type === 2) { // Net Fiyat
                tableColumn = [
                    { title: '#', dataKey: 'index' },
                    { title: 'Kod', dataKey: 'code' },
                    { title: 'Ürün / Hizmet', dataKey: 'name' },
                    { title: 'Miktar', dataKey: 'quantity' },
                    { title: 'Birim', dataKey: 'unit' },
                    { title: 'Net Fiyat', dataKey: 'netPrice' },
                    { title: 'Toplam', dataKey: 'total' }
                ];
                tableRows = details.lines.map((line, i) => ({
                    index: i + 1,
                    code: line.code,
                    name: line.name,
                    quantity: line.quantity,
                    unit: line.unit,
                    netPrice: formatCurrency(line.netTotal / line.quantity),
                    total: formatCurrency(line.netTotal)
                }));
            } else if (type === 3) { // Dövizli
                tableColumn = [
                    { title: '#', dataKey: 'index' },
                    { title: 'Kod', dataKey: 'code' },
                    { title: 'Ürün / Hizmet', dataKey: 'name' },
                    { title: 'Miktar', dataKey: 'quantity' },
                    { title: 'Birim', dataKey: 'unit' },
                    { title: 'B.Fiyat', dataKey: 'price' },
                    { title: 'Döviz', dataKey: 'currPrice' },
                    { title: 'D.Türü', dataKey: 'currType' },
                    { title: 'Tutar', dataKey: 'total' }
                ];
                tableRows = details.lines.map((line, i) => ({
                    index: i + 1,
                    code: line.code,
                    name: line.name,
                    quantity: line.quantity,
                    unit: line.unit,
                    price: formatCurrency(line.price),
                    currPrice: line.priceUsd ? formatCurrency(line.priceUsd, 'USD') : formatCurrency(line.price / (details.header.currRate || 1), 'USD'),
                    currType: 'USD',
                    total: formatCurrency(line.total)
                }));
            } else { // FX Net
                tableColumn = [
                    { title: '#', dataKey: 'index' },
                    { title: 'Kod', dataKey: 'code' },
                    { title: 'Ürün / Hizmet', dataKey: 'name' },
                    { title: 'Miktar', dataKey: 'quantity' },
                    { title: 'Birim', dataKey: 'unit' },
                    { title: 'Net Döviz', dataKey: 'netCurr' },
                    { title: 'Toplam Döviz', dataKey: 'totalCurr' }
                ];
                tableRows = details.lines.map((line, i) => {
                    const priceUsd = line.priceUsd || (line.price / (details.header.currRate || 1));
                    const netPriceUsd = priceUsd * (1 - ((line.discount / (line.quantity * line.price)) || 0));
                    return {
                        index: i + 1,
                        code: line.code,
                        name: line.name,
                        quantity: line.quantity,
                        unit: line.unit,
                        netCurr: formatCurrency(netPriceUsd, 'USD'),
                        totalCurr: formatCurrency(netPriceUsd * line.quantity, 'USD')
                    };
                });
            }

            autoTable(doc, {
                startY: customerY + 25, // 110
                head: [tableColumn.map(c => c.title)],
                body: tableRows.map(r => tableColumn.map(c => r[c.dataKey])),
                theme: 'striped',
                headStyles: commonHeadStyles,
                bodyStyles: commonBodyStyles, // Use common body styles with font
                styles: {
                    font: 'Roboto', // Global fallback for table
                    cellPadding: 3,
                    lineWidth: 0.1,
                    lineColor: [230, 230, 230]
                },
                columnStyles: {
                    0: { halign: 'center', width: 10 },
                    // Smart width adjustment?
                },
                didDrawPage: (data) => {
                    // Footer logic if pages break?
                }
            });

            // Footer Totals
            const finalY = doc.lastAutoTable.finalY + 10;

            // Draw Summary Box
            const summaryX = 140;
            const summaryW = 55;

            doc.setFillColor(245, 245, 245);
            doc.rect(summaryX, finalY, summaryW, 35, 'F');
            doc.setDrawColor(200, 200, 200);
            doc.rect(summaryX, finalY, summaryW, 35, 'S');

            doc.setFontSize(9);
            // Label
            doc.setFont('Roboto', 'bold');
            doc.text('Ara Toplam:', summaryX + 2, finalY + 6);
            doc.text('İskonto:', summaryX + 2, finalY + 12);
            doc.text('KDV:', summaryX + 2, finalY + 18);
            doc.setFontSize(11);
            doc.text('Genel Toplam:', summaryX + 2, finalY + 28);

            // Value
            doc.setFont('Roboto', 'normal');
            doc.setFontSize(9);
            doc.text(formatCurrency(details.header.grossTotal || details.header.totalVatBase), summaryX + summaryW - 2, finalY + 6, { align: 'right' });
            doc.text(formatCurrency(details.header.totalDiscount), summaryX + summaryW - 2, finalY + 12, { align: 'right' });
            doc.text(formatCurrency(details.header.totalVat), summaryX + summaryW - 2, finalY + 18, { align: 'right' });
            doc.setFontSize(11);
            doc.setFont('Roboto', 'bold');
            doc.text(formatCurrency(details.header.netTotal), summaryX + summaryW - 2, finalY + 28, { align: 'right' });

            // Text Note
            if (details.header.notes && details.header.notes.length > 0) {
                doc.setFontSize(8);
                doc.setFont('Roboto', 'normal');
                doc.setTextColor(100, 100, 100);
                const noteText = details.header.notes.map(n => n.text).join(' ');
                doc.text('Notlar: ' + noteText, 15, finalY + 6, { maxWidth: 100 });
            }

            // Footer Branding
            doc.setFontSize(7);
            doc.setTextColor(150, 150, 150);
            const pageCount = doc.internal.getNumberOfPages();
            doc.text(`Sayfa ${doc.internal.getCurrentPageInfo().pageNumber} / ${pageCount} - Oluşturan: EnteLog`, 105, 290, { align: 'center' });

            doc.save(`Teklif_${details.header.ficheNo}.pdf`);

        } catch (error) {
            console.error('PDF Generation Error:', error);
            alert('PDF oluşturulamadı: ' + error.message);
        }
    };

    if (!order) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={` ${isClosed ? 'grayscale brightness-90' : ''} bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[90vh] rounded-2xl flex flex-col shadow-2xl animate-scale-in transition-all duration-300`}>
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                <span className={isClosed ? 'text-slate-400' : 'text-orange-400'}>#{order.ficheNo}</span>
                                <span className="text-slate-400 text-lg font-normal">Detayları</span>
                            </h2>
                            {status === 'S' && <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded border border-blue-500/30">SEVK BEKLİYOR (S)</span>}
                            {status === 'B' && <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded border border-yellow-500/30">KISMI SEVK (B)</span>}
                            {status === 'K' && <span className="px-2 py-1 bg-slate-600/50 text-slate-300 text-xs font-bold rounded border border-slate-500/30">KAPANDI (K)</span>}
                        </div>
                        <p className="text-slate-400 text-sm mt-1">{order.customer}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="animate-spin text-orange-500" size={48} />
                        </div>
                    ) : details ? (
                        <div className="space-y-8">
                            {/* Actions - PDF Buttons */}
                            <div className="flex flex-wrap gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
                                <div className="text-sm font-medium text-slate-400 w-full mb-2 flex items-center gap-2">
                                    <Printer size={16} />
                                    <span>Teklif Formu Yazdır:</span>
                                </div>
                                {/* RESTORED ALL BUTTONS */}
                                <button onClick={() => generatePDF(1)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-sm transition-all active:scale-95">
                                    <FileDown size={16} /> Standart
                                </button>
                                <button onClick={() => generatePDF(2)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white text-sm transition-all active:scale-95">
                                    <FileDown size={16} /> Net Fiyat
                                </button>
                                <button onClick={() => generatePDF(3)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white text-sm transition-all active:scale-95">
                                    <FileDown size={16} /> Dövizli
                                </button>
                                <button onClick={() => generatePDF(4)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white text-sm transition-all active:scale-95">
                                    <FileDown size={16} /> Dövizli Net
                                </button>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                    <h4 className="text-xs uppercase text-slate-500 font-bold mb-1">Tarih</h4>
                                    <p className="text-lg text-white font-medium">{new Date(details.header.date).toLocaleDateString()}</p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                    <h4 className="text-xs uppercase text-slate-500 font-bold mb-1">Belge No</h4>
                                    <p className="text-lg text-white font-medium">{details.header.documentNo || '-'}</p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                    <h4 className="text-xs uppercase text-slate-500 font-bold mb-1">Cari Kodu</h4>
                                    <p className="text-lg text-white font-medium">{details.header.customerCode}</p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                    <h4 className="text-xs uppercase text-slate-500 font-bold mb-1">Ödeme Durumu</h4>
                                    <span className="text-emerald-400 font-medium">Açık Hesap</span>
                                </div>
                            </div>

                            {/* Lines Table w/ Discount Column */}
                            <div className="bg-white/5 rounded-xl border border-white/5 overflow-hidden">
                                <table className="w-full text-left bg-transparent">
                                    <thead className="bg-black/20 text-slate-400 uppercase text-xs">
                                        <tr>
                                            <th className="p-4">Kod</th>
                                            <th className="p-4">Ürün Adı</th>
                                            <th className="p-4 text-center">Miktar</th>
                                            {isPartial && <th className="p-4 text-center text-yellow-400">Sevk</th>}
                                            {isPartial && <th className="p-4 text-center text-blue-400">Kalan</th>}

                                            <th className="p-4 text-center">Birim</th>
                                            <th className="p-4 text-right">B.Fiyat</th>
                                            <th className="p-4 text-center">İsk (%)</th>
                                            <th className="p-4 text-right">Tutar</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {details.lines.map((line, idx) => (
                                            <tr key={idx} className="hover:bg-white/5">
                                                <td className="p-4 text-slate-400 font-mono text-xs">{line.code}</td>
                                                <td className="p-4 text-white font-medium">{line.name}</td>
                                                <td className="p-4 text-center text-slate-300">
                                                    <span className="bg-white/10 px-2 py-1 rounded">{line.quantity}</span>
                                                </td>
                                                {/* Partial Shipment Columns */}
                                                {isPartial && (
                                                    <td className="p-4 text-center text-yellow-400 font-medium bg-yellow-500/5">
                                                        {line.shippedAmount}
                                                    </td>
                                                )}
                                                {isPartial && (
                                                    <td className="p-4 text-center text-blue-400 font-medium bg-blue-500/5">
                                                        {line.quantity - (line.shippedAmount || 0)}
                                                    </td>
                                                )}

                                                <td className="p-4 text-center text-slate-400 text-sm">{line.unit}</td>
                                                <td className="p-4 text-right text-slate-300">
                                                    {line.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                                </td>
                                                {/* Discount Column */}
                                                <td className="p-4 text-center text-rose-300">
                                                    {line.discount && line.quantity && line.price ?
                                                        `%${((line.discount / (line.quantity * line.price)) * 100).toFixed(0)}`
                                                        : '-'}
                                                </td>
                                                <td className="p-4 text-right font-bold text-white">
                                                    {line.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-black/20">
                                        <tr>
                                            <td colSpan={isPartial ? 8 : 6} className="p-4 text-right text-slate-400 font-medium">Alt Toplam</td>
                                            <td className="p-4 text-right text-slate-300 font-bold">
                                                {details.header.grossTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                            </td>
                                        </tr>
                                        <tr>
                                            <td colSpan={isPartial ? 8 : 6} className="p-4 text-right text-slate-400 font-medium">İskonto</td>
                                            <td className="p-4 text-right text-rose-400 font-bold">
                                                -{details.header.totalDiscount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                            </td>
                                        </tr>
                                        <tr>
                                            <td colSpan={isPartial ? 8 : 6} className="p-4 text-right text-slate-400 font-medium">KDV</td>
                                            <td className="p-4 text-right text-blue-400 font-bold">
                                                {details.header.totalVat.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                            </td>
                                        </tr>
                                        <tr className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-t border-orange-500/20">
                                            <td colSpan={isPartial ? 8 : 6} className="p-4 text-right text-white font-bold text-lg">GENEL TOPLAM</td>
                                            <td className="p-4 text-right text-orange-400 font-bold text-xl">
                                                {details.header.netTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-slate-500 py-10">Sipariş detayı bulunamadı.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderDetailModal;
