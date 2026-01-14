import React, { useMemo } from 'react';

const InvoicePrintTemplate = ({ invoice, details, companyInfo }) => {
    if (!details) return null;

    const formattedDate = useMemo(() => {
        try {
            return new Date(invoice.date).toLocaleDateString('tr-TR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            });
        } catch (e) {
            return invoice.date;
        }
    }, [invoice.date]);

    return (
        <div id="invoice-print-template" style={{
            fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
            backgroundColor: '#ffffff',
            color: '#000000',
            width: '100%', // Genişliği %100 yapıp dışarıdan kontrol edelim
            maxWidth: '210mm',
            margin: '0 auto',
            fontSize: '8pt', // Fontu biraz küçültelim
            lineHeight: '1.2',
            position: 'relative',
        }}>
            {/* Vibrant Header Strip */}
            <div style={{
                backgroundColor: '#0044CC', // Parlak, derin mavi
                height: '12px',
                width: '100%'
            }}></div>

            <div style={{ padding: '20px 25px' }}>
                {/* Header Area */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                    <div style={{ width: '55%' }}>
                        {companyInfo?.logoPath ? (
                            <img
                                src={companyInfo.logoPath}
                                alt="Logo"
                                style={{ height: '45px', objectFit: 'contain', marginBottom: '8px' }}
                            />
                        ) : (
                            <h1 style={{ fontSize: '20pt', fontWeight: '800', color: '#0044CC', margin: '0 0 4px 0' }}>
                                {companyInfo?.companyName || 'FİRMA ADI'}
                            </h1>
                        )}
                        <div style={{ fontSize: '7.5pt', color: '#1a1a1a' }}>
                            {companyInfo?.address && <div style={{ marginBottom: '2px' }}>{companyInfo.address}</div>}
                            <div style={{ fontWeight: '600', marginBottom: '2px' }}>
                                {companyInfo?.phone && <span style={{ marginRight: '10px' }}>📞 {companyInfo.phone}</span>}
                                {companyInfo?.email && <span>✉️ {companyInfo.email}</span>}
                            </div>
                            {companyInfo?.taxOffice && companyInfo?.taxNo && (
                                <div>
                                    {companyInfo.taxOffice} VD. - VKN: {companyInfo.taxNo}
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ textAlign: 'right', width: '40%' }}>
                        <div style={{
                            fontSize: '24pt',
                            fontWeight: '900',
                            color: '#e0e0e0',
                            lineHeight: '0.8',
                            marginBottom: '8px',
                            letterSpacing: '2px'
                        }}>
                            FATURA
                        </div>
                        <table style={{ width: '100%', fontSize: '8pt', borderCollapse: 'collapse' }}>
                            <tbody>
                                <tr>
                                    <td style={{ textAlign: 'right', color: '#666', paddingBottom: '2px' }}>Tarih:</td>
                                    <td style={{ textAlign: 'right', fontWeight: '700', paddingLeft: '8px' }}>{formattedDate}</td>
                                </tr>
                                <tr>
                                    <td style={{ textAlign: 'right', color: '#666', paddingBottom: '2px' }}>Fatura No:</td>
                                    <td style={{ textAlign: 'right', fontWeight: '700', paddingLeft: '8px' }}>{invoice.invoiceNo || '-'}</td>
                                </tr>
                                <tr>
                                    <td style={{ textAlign: 'right', color: '#666' }}>Fiş No:</td>
                                    <td style={{ textAlign: 'right', fontWeight: '700', paddingLeft: '8px' }}>{invoice.ficheNo}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Customer Info Box - Vivid */}
                <div style={{
                    backgroundColor: '#F0F5FF', // Çok açık mavi arka plan
                    borderLeft: '4px solid #0044CC', // Parlak mavi çizgi
                    padding: '10px 12px',
                    marginBottom: '15px',
                    borderRadius: '0 4px 4px 0'
                }}>
                    <div style={{ fontSize: '6.5pt', fontWeight: '700', color: '#0044CC', textTransform: 'uppercase', marginBottom: '3px', letterSpacing: '0.5px' }}>
                        SAYIN / MÜŞTERİ
                    </div>
                    <div style={{ fontSize: '10pt', fontWeight: '700', color: '#000000' }}>
                        {invoice.customer}
                    </div>
                </div>

                {/* Items Table - Clean & Compact */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#0044CC', color: 'white' }}>
                            <th style={{ padding: '6px 8px', textAlign: 'left', fontSize: '7.5pt', fontWeight: '600' }}>HİZMET / ÜRÜN</th>
                            <th style={{ padding: '6px 4px', textAlign: 'center', fontSize: '7.5pt', fontWeight: '600' }}>MİKTAR</th>
                            <th style={{ padding: '6px 4px', textAlign: 'right', fontSize: '7.5pt', fontWeight: '600' }}>BİRİM FİYAT</th>
                            <th style={{ padding: '6px 4px', textAlign: 'right', fontSize: '7.5pt', fontWeight: '600' }}>İSKONTO</th>
                            <th style={{ padding: '6px 4px', textAlign: 'right', fontSize: '7.5pt', fontWeight: '600' }}>KDV</th>
                            <th style={{ padding: '6px 8px', textAlign: 'right', fontSize: '7.5pt', fontWeight: '600' }}>TUTAR</th>
                        </tr>
                    </thead>
                    <tbody>
                        {details.lines.map((line, index) => (
                            <tr key={index} style={{ borderBottom: '1px solid #e0e0e0' }}>
                                <td style={{ padding: '6px 8px' }}>
                                    <div style={{ fontWeight: '600', color: '#000', fontSize: '8pt' }}>{line.name}</div>
                                    <div style={{ fontSize: '6.5pt', color: '#555', fontFamily: 'monospace' }}>{line.code}</div>
                                </td>
                                <td style={{ padding: '6px 4px', textAlign: 'center', fontWeight: '600', fontSize: '8pt' }}>{line.quantity} <span style={{ fontSize: '6.5pt', fontWeight: '400', color: '#555' }}>{line.unit}</span></td>
                                <td style={{ padding: '6px 4px', textAlign: 'right', fontSize: '8pt' }}>{line.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                                <td style={{ padding: '6px 4px', textAlign: 'right', color: '#cc0000', fontSize: '8pt' }}>
                                    {line.discount > 0 ? `-${line.discount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}` : '-'}
                                </td>
                                <td style={{ padding: '6px 4px', textAlign: 'right', fontSize: '7.5pt', color: '#444' }}>
                                    {(line.vatAmount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} <span style={{ fontSize: '6.5pt' }}>(%{line.vatRate})</span>
                                </td>
                                <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: '700', color: '#000', fontSize: '8.5pt' }}>
                                    {line.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Footer / Totals Section */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '5px' }}>
                    <div style={{ width: '220px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid #f0f0f0' }}>
                            <span style={{ fontSize: '8pt', color: '#555' }}>Ara Toplam</span>
                            <span style={{ fontWeight: '600', fontSize: '8.5pt' }}>{details.summary.subTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                        </div>
                        {details.summary.totalDiscount > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid #f0f0f0', color: '#cc0000' }}>
                                <span style={{ fontSize: '8pt' }}>Toplam İskonto</span>
                                <span style={{ fontWeight: '600', fontSize: '8.5pt' }}>-{details.summary.totalDiscount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid #f0f0f0' }}>
                            <span style={{ fontSize: '8pt', color: '#555' }}>Toplam KDV</span>
                            <span style={{ fontWeight: '600', fontSize: '8.5pt' }}>{details.summary.totalVat.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                        </div>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '8px 10px',
                            marginTop: '8px',
                            backgroundColor: '#0044CC',
                            color: 'white',
                            borderRadius: '4px'
                        }}>
                            <span style={{ fontSize: '10pt', fontWeight: '600' }}>TOPLAM</span>
                            <span style={{ fontSize: '11pt', fontWeight: '800' }}>
                                {details.summary.grandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                            </span>
                        </div>
                    </div>
                </div>

                {/* Amount in Words */}
                <div style={{ marginTop: '15px', padding: '8px', backgroundColor: '#F0F5FF', borderRadius: '4px', fontSize: '7.5pt', color: '#333' }}>
                    <strong>Yalnız:</strong> {details.summary.grandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} Türk Lirası tahsil edilmiştir.
                </div>
            </div>

            {/* Bottom Fixed Footer */}
            <div style={{
                position: 'absolute',
                bottom: '0',
                left: '0',
                width: '100%',
                backgroundColor: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                padding: '15px 30px',
                textAlign: 'center',
                fontSize: '8pt',
                color: '#64748b'
            }}>
                <div style={{ fontWeight: '600', color: '#1e3a8a', marginBottom: '3px' }}>
                    {companyInfo?.companyName || 'ENTELOG Yazılım Çözümleri A.Ş.'}
                </div>
                <div>
                    {companyInfo?.address} {companyInfo?.phone && `• ${companyInfo.phone}`} {companyInfo?.email && `• ${companyInfo.email}`}
                </div>
            </div>
        </div>
    );
};

export default InvoicePrintTemplate;
