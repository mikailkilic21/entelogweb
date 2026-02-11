import React from 'react';

const PurchasedProductsReportTemplate = ({ products, account, companyInfo }) => {
    if (!products || !account) return null;

    const printDate = new Date().toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });

    return (
        <div id="purchased-products-report-template" style={{
            fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
            backgroundColor: '#ffffff',
            color: '#000000',
            width: '100%',
            maxWidth: '210mm',
            margin: '0 auto',
            fontSize: '9pt',
            lineHeight: '1.4',
            position: 'relative',
            padding: '20px'
        }}>
            {/* Header */}
            <div style={{ borderBottom: '2px solid #0044CC', paddingBottom: '10px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1 style={{ fontSize: '18pt', fontWeight: 'bold', color: '#0044CC', margin: 0 }}>
                            {companyInfo?.companyName || 'FİRMA ADI'}
                        </h1>
                        <div style={{ fontSize: '8pt', color: '#555', marginTop: '5px' }}>
                            {companyInfo?.address}<br />
                            {companyInfo?.phone && `Tel: ${companyInfo.phone}`}
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <h2 style={{ fontSize: '14pt', fontWeight: 'bold', margin: 0 }}>SATIN ALINAN ÜRÜNLER RAPORU</h2>
                        <div style={{ fontSize: '9pt', marginTop: '5px' }}>Rapor Tarihi: {printDate}</div>
                    </div>
                </div>
            </div>

            {/* Account Info */}
            <div style={{ backgroundColor: '#f0f5ff', padding: '10px', borderRadius: '4px', marginBottom: '20px', borderLeft: '4px solid #0044CC' }}>
                <div style={{ fontSize: '8pt', color: '#0044CC', fontWeight: 'bold', textTransform: 'uppercase' }}>CARİ HESAP BİLGİLERİ</div>
                <div style={{ fontSize: '12pt', fontWeight: 'bold', marginTop: '2px' }}>{account.name}</div>
                <div style={{ fontSize: '9pt', color: '#333' }}>{account.code}</div>
                <div style={{ fontSize: '9pt', color: '#333' }}>
                    {account.taxNumber ? `Vergi No: ${account.taxNumber}` : ''}
                    {account.taxOffice ? ` / ${account.taxOffice}` : ''}
                </div>
            </div>

            {/* Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt' }}>
                <thead>
                    <tr style={{ backgroundColor: '#0044CC', color: 'white' }}>
                        <th style={{ padding: '8px', textAlign: 'left', width: '50px' }}>SIRA</th>
                        <th style={{ padding: '8px', textAlign: 'left' }}>ÜRÜN KODU</th>
                        <th style={{ padding: '8px', textAlign: 'left' }}>ÜRÜN ADI</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>MİKTAR</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>TOPLAM TUTAR</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map((product, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid #eee', backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                            <td style={{ padding: '8px', textAlign: 'left', fontWeight: 'bold' }}>{index + 1}</td>
                            <td style={{ padding: '8px', textAlign: 'left', fontFamily: 'monospace' }}>{product.productCode}</td>
                            <td style={{ padding: '8px', textAlign: 'left' }}>{product.productName}</td>
                            <td style={{ padding: '8px', textAlign: 'right' }}>
                                {product.totalQuantity.toLocaleString('tr-TR')} {product.unit}
                            </td>
                            <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>
                                {product.totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                            </td>
                        </tr>
                    ))}
                    {products.length === 0 && (
                        <tr>
                            <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#777' }}>Kayıt bulunamadı.</td>
                        </tr>
                    )}
                </tbody>
                <tfoot>
                    <tr style={{ backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>
                        <td colSpan="3" style={{ padding: '8px', textAlign: 'right' }}>GENEL TOPLAM:</td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>
                            {/* Quantity total might not make sense if units differ, but strict sum is requested usually or just amount */}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right', color: '#0044CC' }}>
                            {products.reduce((sum, p) => sum + p.totalAmount, 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                        </td>
                    </tr>
                </tfoot>
            </table>

            {/* Footer */}
            <div style={{ marginTop: '30px', borderTop: '1px solid #ddd', paddingTop: '10px', fontSize: '8pt', color: '#777', textAlign: 'center' }}>
                Bu rapor {companyInfo?.companyName || 'Sistem'} tarafından oluşturulmuştur.
            </div>
        </div>
    );
};

export default PurchasedProductsReportTemplate;
