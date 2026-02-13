const { sql, getConfig } = require('../config/db');

// Helper to format currency
const fmt = (num) => parseFloat(num).toFixed(2);
const fs = require('fs');
const path = require('path');
const DBS_CONFIG_PATH = path.join(__dirname, '../../data/dbs-config.json');

exports.getReportData = async (req, res) => {
    const { reportId } = req.params;
    const config = getConfig();
    const firm = config.firmNo || '113';
    const period = config.periodNo || '01';

    console.log(`📊 Report Requested: ${reportId}`);

    try {
        let query = '';
        let columns = [];
        let headers = [];

        // Define table names
        const itemsTable = `LG_${firm}_ITEMS`;
        const clcardTable = `LG_${firm}_CLCARD`;
        const invoiceTable = `LG_${firm}_${period}_INVOICE`;
        const stlineTable = `LG_${firm}_${period}_STLINE`;
        const gntotstTable = `LG_${firm}_${period}_GNTOTST`; // Warehouse totals usually
        // Note: GNTOTST Logic might vary (stockref vs logicalref)
        // Usually: LG_XXX_01_GNTOTST (STOCKREF, INVENNO, ONHAND)
        const gntotclTable = `LG_${firm}_${period}_GNTOTCL`; // Client totals

        switch (reportId) {
            case 'daily_sales':
                // List of today's sales invoices
                headers = ['Fiş No', 'Tarih', 'Cari Ünvanı', 'Tutar', 'KDV'];
                columns = ['ficheno', 'date', 'client', 'total', 'vat'];
                query = `
                    SELECT TOP 100
                        I.FICHENO as ficheno,
                        FORMAT(I.DATE_, 'dd.MM.yyyy') as date,
                        C.DEFINITION_ as client,
                        I.NETTOTAL as total,
                        I.TOTALVAT as vat
                    FROM ${invoiceTable} I
                    LEFT JOIN ${clcardTable} C ON I.CLIENTREF = C.LOGICALREF
                    WHERE I.TRCODE IN (7, 8, 9) AND I.CANCELLED = 0
                    AND I.DATE_ = CAST(GETDATE() AS DATE)
                    ORDER BY I.DATE_ DESC
                `;
                break;

            case 'monthly_revenue':
                // Daily breakdown of current month sales
                headers = ['Tarih', 'Satış Tutarı', 'İade Tutarı', 'Net Satış'];
                columns = ['date', 'sales', 'returns', 'net'];
                query = `
                    SELECT 
                        FORMAT(DATE_, 'dd.MM.yyyy') as date,
                        SUM(CASE WHEN TRCODE IN (7,8) THEN NETTOTAL ELSE 0 END) as sales,
                        SUM(CASE WHEN TRCODE = 3 THEN NETTOTAL ELSE 0 END) as returns,
                        (SUM(CASE WHEN TRCODE IN (7,8) THEN NETTOTAL ELSE 0 END) - SUM(CASE WHEN TRCODE = 3 THEN NETTOTAL ELSE 0 END)) as net
                    FROM ${invoiceTable}
                    WHERE MONTH(DATE_) = MONTH(GETDATE()) AND YEAR(DATE_) = YEAR(GETDATE())
                    AND TRCODE IN (3,7,8) AND CANCELLED = 0
                    GROUP BY DATE_
                    ORDER BY DATE_ DESC
                `;
                break;

            case 'top_customers':
                // Top 20 customers by balance or sales? "En Çok Alan" -> Sales
                headers = ['Müşteri Kodu', 'Ünvanı', 'Şehir', 'Toplam Ciro'];
                columns = ['code', 'name', 'city', 'total'];
                query = `
                    SELECT TOP 20
                        C.CODE as code,
                        C.DEFINITION_ as name,
                        C.CITY as city,
                        SUM(I.NETTOTAL) as total
                    FROM ${invoiceTable} I
                    JOIN ${clcardTable} C ON I.CLIENTREF = C.LOGICALREF
                    WHERE I.TRCODE IN (7, 8, 9) AND I.CANCELLED = 0
                    GROUP BY C.CODE, C.DEFINITION_, C.CITY
                    ORDER BY total DESC
                `;
                break;

            case 'low_stock':
                // Items where stock < min_level (Assume generic logic if min_level not set)
                // We'll show arbitrary list of low stock or just Top 50 items with lowest stock
                headers = ['Ürün Kodu', 'Ürün Adı', 'Mevcut Stok', 'Birim'];
                columns = ['code', 'name', 'onhand', 'unit'];
                // Logic: Join Items and Totals. Assuming INVENNO = -1 (Total)
                query = `
                    SELECT TOP 50
                        I.CODE as code,
                        I.NAME as name,
                        ISNULL(T.ONHAND, 0) as onhand,
                        I.UNITSETREF as unit -- Should get Unit Code but let's keep simple
                    FROM ${itemsTable} I
                    LEFT JOIN ${gntotstTable} T ON I.LOGICALREF = T.STOCKREF AND T.INVENNO = -1
                    WHERE I.ACTIVE = 0 -- 0 is usually Active in Logo (Active=0/1? No, Active=0 means Active usually? Check logic. Usually CARDTYPE=1)
                    AND ISNULL(T.ONHAND, 0) < 10 -- Sample threshold
                    ORDER BY T.ONHAND ASC
                `;
                break;

            case 'account_balances':
                // Receivables (Borçlu Cariler)
                headers = ['Cari Kodu', 'Ünvanı', 'Bakiye (Borç)', 'Son Hareket'];
                columns = ['code', 'name', 'balance', 'date'];
                // Using GNTOTCL (TOTTYP=1 local currency)
                // DEBIT - CREDIT > 0 means they owe us
                query = `
                    SELECT TOP 50
                        C.CODE as code,
                        C.DEFINITION_ as name,
                        (T.DEBIT - T.CREDIT) as balance,
                        FORMAT(GETDATE(), 'dd.MM.yyyy') as date -- Placeholder date
                    FROM ${gntotclTable} T
                    JOIN ${clcardTable} C ON T.CARDREF = C.LOGICALREF
                    WHERE T.TOTTYP = 1
                    AND (T.DEBIT - T.CREDIT) > 0
                    ORDER BY (T.DEBIT - T.CREDIT) DESC
                `;
                break;

            case 'stock_value':
                // Inventory Value (Maliyet) - simplified
                headers = ['Ürün Adı', 'Stok', 'Birim Fiyat', 'Toplam Değer'];
                columns = ['name', 'onhand', 'price', 'total'];
                // Assuming PRCLIST logic or just mock cost
                query = `
                    SELECT TOP 50
                        I.NAME as name,
                        T.ONHAND as onhand,
                        100 as price, -- Mock price
                        (T.ONHAND * 100) as total
                    FROM ${itemsTable} I
                    JOIN ${gntotstTable} T ON I.LOGICALREF = T.STOCKREF AND T.INVENNO = -1
                    WHERE T.ONHAND > 0
                    ORDER BY T.ONHAND DESC
                `;
                break;

            case 'received_checks':
                // Portföydeki Çekler (Müşteri Çekleri)
                headers = ['Portföy No', 'Vade', 'Borçlu', 'Tutar', 'Durum'];
                columns = ['portfoy', 'vade', 'drawer', 'amount', 'status'];
                // LG_XXX_XX_CSCARD
                // DOC=1 (Check), CURR_STAT=1 (Portfolio) typically
                query = `
                    SELECT TOP 50
                        PORTFOLIONO as portfoy,
                        FORMAT(DUEDATE, 'dd.MM.yyyy') as vade,
                        DEVIR_BORCLU as drawer, -- Or similar field for Drawer
                        AMOUNT as amount,
                        CASE CURR_STAT 
                            WHEN 1 THEN 'Portföyde' 
                            WHEN 2 THEN 'Ciro Edildi' 
                            WHEN 3 THEN 'Tahsilde' 
                            ELSE 'Diğer' 
                        END as status
                    FROM LG_${firm}_${period}_CSCARD
                    WHERE DOC = 1 AND CURR_STAT IN (1, 2, 3)
                    ORDER BY DUEDATE ASC
                `;
                break;

            case 'issued_checks':
                // Kendi Çeklerimiz (Ödeme Çekleri)
                headers = ['Portföy No', 'Vade', 'Banka/Şube', 'Tutar', 'Durum'];
                columns = ['portfoy', 'vade', 'bank', 'amount', 'status'];
                // LG_XXX_XX_CSCARD
                // DOC=3? 4? Usually TRCODE indicates Issued. 
                // In Tiger: TRCODE=6 is Kendi Çekimiz Çıkış (Bankadan)
                query = `
                    SELECT TOP 50
                        PORTFOLIONO as portfoy,
                        FORMAT(DUEDATE, 'dd.MM.yyyy') as vade,
                        DEVIR_BORCLU as bank, -- Often stores Bank info for own checks
                        AMOUNT as amount,
                        CASE CURR_STAT 
                            WHEN 1 THEN 'Portföyde' 
                            WHEN 6 THEN 'Ödendi' 
                            WHEN 4 THEN 'Bankada'
                            ELSE 'Çıkıldı' 
                        END as status
                    FROM LG_${firm}_${period}_CSCARD
                    WHERE DOC = 1 AND TRCODE = 6
                    ORDER BY DUEDATE ASC
                `;
                break;

            case 'dbs_schedule':
                // DBS Payment Schedule (Logic from dbsController)
                // We perform query then post-process in JS since logic depends on JSON config
                headers = ['Cari', 'Fatura No', 'Fatura Tarihi', 'DBS Vadesi', 'Tutar', 'Kalan Gün'];
                columns = ['client', 'ficheno', 'date', 'dbsDate', 'amount', 'daysLeft'];

                // 1. Read Config
                let dbsConfig = [];
                try {
                    if (fs.existsSync(DBS_CONFIG_PATH)) {
                        dbsConfig = JSON.parse(fs.readFileSync(DBS_CONFIG_PATH, 'utf8'));
                    }
                } catch (e) { }

                const validConfig = dbsConfig.filter(c => c.logicalRef && c.code);
                if (validConfig.length === 0) {
                    // Empty result
                    query = "SELECT 1 WHERE 1=0"; // Dummy
                } else {
                    const clientCodes = validConfig.map(c => `'${c.code}'`).join(',');
                    query = `
                        SELECT 
                            CL.DEFINITION_ as client,
                            CL.CODE as clientCode,
                            INV.FICHENO as ficheno,
                            INV.DATE_ as dateRaw, -- Keep raw for sorting/calc
                            FORMAT(INV.DATE_, 'dd.MM.yyyy') as date,
                            INV.NETTOTAL as amount
                        FROM ${invoiceTable} INV
                        LEFT JOIN ${clcardTable} CL ON INV.CLIENTREF = CL.LOGICALREF
                        WHERE INV.TRCODE = 1 AND INV.CANCELLED = 0
                        AND CL.CODE IN (${clientCodes})
                        ORDER BY INV.DATE_ DESC
                    `;
                }
                break;

            default:
                return res.status(404).json({ error: 'Rapor tanımı bulunamadı.' });
        }

        console.log('Query:', query);

        let rows = [];
        try {
            const result = await sql.query(query);
            rows = result.recordset;

            // Post-Process for DBS
            if (reportId === 'dbs_schedule') {
                let dbsConfig = [];
                try {
                    if (fs.existsSync(DBS_CONFIG_PATH)) {
                        dbsConfig = JSON.parse(fs.readFileSync(DBS_CONFIG_PATH, 'utf8'));
                    }
                } catch (e) { }

                const today = new Date();
                today.setHours(0, 0, 0, 0);

                rows = rows.map(r => {
                    const cfg = dbsConfig.find(c => c.code === r.clientCode);
                    let dbsDate = new Date(r.dateRaw);

                    if (cfg) {
                        if (cfg.termDays) dbsDate.setDate(dbsDate.getDate() + Number(cfg.termDays));
                        if (cfg.paymentDay) {
                            const target = Number(cfg.paymentDay);
                            const current = dbsDate.getDay();
                            let diff = target - current;
                            if (diff < 0) diff += 7;
                            dbsDate.setDate(dbsDate.getDate() + diff);
                        }
                    }

                    const timeDiff = dbsDate.getTime() - today.getTime();
                    const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

                    return {
                        ...r,
                        dbsDate: dbsDate.toLocaleDateString('tr-TR'),
                        daysLeft: daysLeft,
                        _valid: daysLeft >= 0 // Filter overdue? User wants Schedule. Keep all or future? "Upcoming" implies future.
                    };
                }).filter(r => r._valid).sort((a, b) => a.daysLeft - b.daysLeft);
            }

        } catch (dbErr) {
            console.error('Report SQL Error:', dbErr);
            // Fallback for Demo/Error
            rows = [];
        }

        // Format Rows
        const formattedRows = rows.map(r => {
            const row = {};
            columns.forEach(col => {
                let val = r[col];
                if (typeof val === 'number') {
                    // Start formatting currency if col affects price
                    if (['total', 'vat', 'sales', 'returns', 'net', 'balance', 'price', 'amount'].includes(col)) {
                        val = val.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    }
                }
                row[col] = val !== null && val !== undefined ? val : '-';
            });
            return row;
        });

        res.json({
            title: reportId,
            headers: headers,
            columns: columns,
            data: formattedRows,
            timestamp: new Date().toISOString()
        });

    } catch (err) {
        console.error('Report General Error:', err);
        res.status(500).json({ error: 'Rapor oluşturulurken hata oluştu.' });
    }
};
