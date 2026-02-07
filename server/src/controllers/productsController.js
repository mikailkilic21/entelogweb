const { sql, getConfig } = require('../config/db');

exports.getProducts = async (req, res) => {
    try {
        const isDemo = req.headers['x-demo-mode'] === 'true' || (req.user && req.user.role === 'demo');
        if (isDemo) {
            const mockFile = require('path').join(__dirname, '../../data/mock/products.json');
            if (require('fs').existsSync(mockFile)) {
                let data = JSON.parse(require('fs').readFileSync(mockFile, 'utf8'));
                const { search, sortBy } = req.query;

                if (search) {
                    const q = search.toLowerCase();
                    data = data.filter(p =>
                        (p.code && p.code.toLowerCase().includes(q)) ||
                        (p.name && p.name.toLowerCase().includes(q))
                    );
                }

                if (sortBy === 'amount') {
                    data.sort((a, b) => b.salesAmount - a.salesAmount);
                } else {
                    data.sort((a, b) => b.salesQuantity - a.salesQuantity);
                }

                return res.json(data);
            }
        }

        const config = getConfig();
        const firm = config.firmNo || '113';
        const period = config.periodNo || '01';
        const itemsTable = `LG_${firm}_ITEMS`;
        const gntotstTable = `LG_${firm}_${period}_GNTOTST`;
        const stlineTable = `LG_${firm}_${period}_STLINE`;
        const prclistTable = `LG_${firm}_PRCLIST`;

        const limit = parseInt(req.query.limit) || 50;
        const search = req.query.search || '';
        const sortBy = req.query.sortBy || 'quantity'; // 'quantity' (Sales Qty) or 'amount' (Sales Amount)
        const warehouse = req.query.warehouse || null; // Warehouse ID

        let whereCondition = 'I.ACTIVE = 0'; // Only active products
        if (search) {
            whereCondition += ` AND (I.CODE LIKE '%${search}%' OR I.NAME LIKE '%${search}%')`;
        }

        // Warehouse filtering logic
        // Always calculate from STLINE for accuracy, as GNTOTST is unreliable (missing records for Devir items)
        const stockInvenNo = warehouse ? warehouse : -1;

        // Dynamic Stock Query using STLINE
        // Filter by Warehouse if selected (SOURCEINDEX)
        // We rely on standard IOCODE logic: 1,3 (+), 2,4 (-)
        // Transfers (TRCODE 25) typically generate two rows (Out from Source, In to Dest), both with correct IOCODE/SOURCEINDEX.
        // So we do NOT need to check DESTINDEX, to avoid double counting.
        const whCondition = warehouse
            ? `AND SOURCEINDEX = ${warehouse}`
            : ''; // Global: include all

        const physicalStockQuery = `
            ISNULL((
                SELECT SUM(
                    CASE 
                         -- Logic for Warehouse specific calculation
                        -- Special Case for TRCODE 25 (Transfer): User indicates IOCODE 1,3 behaves as Output (-) and 2,4 as Input (+) for this transaction type in their context.
                        WHEN ${warehouse || 'NULL'} IS NOT NULL AND SOURCEINDEX = ${warehouse || 0} AND TRCODE = 25 AND IOCODE IN (1, 3) THEN -AMOUNT
                        WHEN ${warehouse || 'NULL'} IS NOT NULL AND SOURCEINDEX = ${warehouse || 0} AND TRCODE = 25 AND IOCODE IN (2, 4) THEN AMOUNT

                        -- Standard Logic (Non-Transfer or Standard IOCODE behavior)
                        WHEN ${warehouse || 'NULL'} IS NOT NULL AND SOURCEINDEX = ${warehouse || 0} AND IOCODE IN (1, 3) THEN AMOUNT 
                        WHEN ${warehouse || 'NULL'} IS NOT NULL AND SOURCEINDEX = ${warehouse || 0} AND IOCODE IN (2, 4) THEN -AMOUNT
                        
                        -- Logic for Global calculation (No WAREHOUSE filter)
                        -- Apply same inversion for TRCODE 25 globally if needed, or keep standard. Assuming consistency:
                         WHEN ${warehouse ? '1=0' : '1=1'} AND IOCODE IN (1, 3, 2, 4) THEN 
                             (CASE 
                                WHEN TRCODE = 25 AND IOCODE IN (1,3) THEN -AMOUNT
                                WHEN TRCODE = 25 AND IOCODE IN (2,4) THEN AMOUNT
                                WHEN IOCODE IN (1, 3) THEN AMOUNT 
                                ELSE -AMOUNT 
                              END)
                        
                        ELSE 0 
                    END
                ) FROM ${stlineTable} 
                WHERE STOCKREF = I.LOGICALREF AND CANCELLED = 0 ${whCondition}
            ), 0)
        `;

        // Sorting Logic Updated
        let orderByClause = 'salesQuantity DESC';
        if (sortBy === 'amount') {
            orderByClause = 'salesAmount DESC';
        } else if (sortBy === 'realStock') {
            // realStock is calculated in CTE
            orderByClause = 'realStock DESC';
        } else if (sortBy === 'quantity') {
            orderByClause = 'salesQuantity DESC';
        }

        const salesSourceFilter = warehouse ? `AND SOURCEINDEX = ${warehouse}` : '';

        // Add filter for positive real stock when sortBy is 'stock'
        const realStockFilter = sortBy === 'stock'
            ? 'WHERE (physicalStock + transitStock - reservedStock) > 0'
            : '';

        const query = `
            WITH ProductStats AS (
                SELECT
                    I.LOGICALREF as id,
                    I.CODE as code,
                    I.NAME as name,
                    I.VAT as vat,
                    I.SPECODE as brand,
                    U.CODE as unit,
                    -- Stock Level (Physical)
                    ${physicalStockQuery} as physicalStock,
                    -- Reserved Stock (Rezerve)
                    ISNULL((SELECT SUM(RESERVED) FROM ${gntotstTable} WHERE STOCKREF = I.LOGICALREF AND INVENNO = ${stockInvenNo}), 0) as reservedStock,
                    -- Transit Stock (Yoldaki/Transfer)
                    ISNULL((SELECT SUM(TEMPIN) FROM ${gntotstTable} WHERE STOCKREF = I.LOGICALREF AND INVENNO = ${stockInvenNo}), 0) as transitStock,
                    -- Sales Quantity (Toplam Satış Miktarı) - TRCODE 7,8 (Perakende/Toptan Satış)
                    ISNULL((SELECT SUM(AMOUNT) FROM ${stlineTable} WHERE STOCKREF = I.LOGICALREF AND TRCODE IN (7, 8) AND LINETYPE = 0 AND CANCELLED = 0 ${salesSourceFilter}), 0) as salesQuantity,
                    -- Sales Amount (Toplam Satış Tutarı)
                    ISNULL((SELECT SUM(TOTAL) FROM ${stlineTable} WHERE STOCKREF = I.LOGICALREF AND TRCODE IN (7, 8) AND LINETYPE = 0 AND CANCELLED = 0 ${salesSourceFilter}), 0) as salesAmount,
                    -- Fixed Sales Price (Sabit Satış Fiyatı) - PTYPE 2 (Satış)
                    ISNULL((SELECT TOP 1 PRICE FROM ${prclistTable} WHERE CARDREF = I.LOGICALREF AND PTYPE = 2 AND (CLIENTCODE = '' OR CLIENTCODE IS NULL) ORDER BY PRIORITY DESC, LOGICALREF DESC), 0) as fixedPrice,
                    -- Last Purchase/Input Price (En Son Giriş Fiyatı)
                    ISNULL((
                        SELECT TOP 1 PRICE 
                        FROM ${stlineTable} 
                        WHERE STOCKREF = I.LOGICALREF 
                          AND TRCODE IN (1, 13, 14, 50) 
                          AND CANCELLED = 0 
                          AND LINETYPE = 0 
                          AND PRICE > 0 
                        ORDER BY DATE_ DESC, LOGICALREF DESC
                    ), 
                    ISNULL((SELECT TOP 1 PRICE FROM ${prclistTable} WHERE CARDREF = I.LOGICALREF AND PTYPE = 1 AND (CLIENTCODE = '' OR CLIENTCODE IS NULL) ORDER BY PRIORITY DESC, LOGICALREF DESC), 0)
                    ) as purchasePrice
                FROM ${itemsTable} I
                LEFT JOIN LG_${firm}_UNITSETL U ON I.UNITSETREF = U.UNITSETREF AND U.MAINUNIT = 1
                WHERE ${whereCondition}
            )
            SELECT TOP ${limit} 
                *,
                -- Calculated Real Stock (Gerçek Stok = Fiili + Yolda - Rezerve)
                (physicalStock + transitStock - reservedStock) as realStock,
                -- Legacy field mapping for compatibility if needed, though we use realStock now
                physicalStock as stockLevel,
                -- Price is derived from fixedPrice first, then avgPrice (total sales / quantity)
                CASE WHEN fixedPrice > 0 THEN fixedPrice 
                     WHEN salesQuantity > 0 THEN salesAmount / salesQuantity 
                     ELSE 0 END as avgPrice,
                -- Stock Value based on Purchase Price
                ((physicalStock + transitStock - reservedStock) * purchasePrice) as stockValue,
                fixedPrice -- return separately too just in case
            FROM ProductStats
            ${realStockFilter}
            ORDER BY ${orderByClause}
        `;

        console.log('--- PRODUCT QUERY ---');
        console.log(query);
        const result = await sql.query(query);
        // console.log('--- PRODUCT RESULT SAMPLE (First Item) ---');
        // console.log(JSON.stringify(result.recordset[0], null, 2));

        res.json(result.recordset);

    } catch (err) {
        console.error('❌ getProducts Error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

exports.getWarehouses = async (req, res) => {
    try {
        const isDemo = req.headers['x-demo-mode'] === 'true' || (req.user && req.user.role === 'demo');
        if (isDemo) {
            return res.json([
                { id: 0, name: 'Merkez Depo', number: 0 },
                { id: 1, name: 'Şube Depo', number: 1 }
            ]);
        }

        const config = getConfig();
        const firm = config.firmNo || '113';
        const warehouseTable = `L_CAPIWHOUSE`;

        const query = `
            SELECT 
                NR as id,
                NAME as name,
                NR as number
            FROM ${warehouseTable}
            WHERE FIRMNR = ${firm}
            ORDER BY NR
        `;

        const result = await sql.query(query);
        res.json(result.recordset);

    } catch (err) {
        console.error('❌ getWarehouses Error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

exports.getProductStats = async (req, res) => {
    try {
        const isDemo = req.headers['x-demo-mode'] === 'true' || (req.user && req.user.role === 'demo');

        if (isDemo) {
            return res.json({
                totalProducts: 15,
                productsInStock: 12,
                criticalStock: 3,
                topByAmount: [
                    { name: 'iPhone 15 Pro', value: 450000 },
                    { name: 'MacBook Air', value: 320000 },
                    { name: 'iPad Pro', value: 150000 },
                    { name: 'Samsung S24', value: 120000 },
                    { name: 'AirPods Pro', value: 90000 }
                ],
                topByQuantity: [
                    { name: 'USB Kablo', value: 150 },
                    { name: 'Ekran Koruyucu', value: 120 },
                    { name: 'Kılıf', value: 95 },
                    { name: 'Şarj Başlığı', value: 80 },
                    { name: 'AirPods Pro', value: 30 }
                ]
            });
        }

        const config = getConfig();
        const firm = config.firmNo || '113';
        const period = config.periodNo || '01';
        const itemsTable = `LG_${firm}_ITEMS`;
        const gntotstTable = `LG_${firm}_${period}_GNTOTST`;
        const stlineTable = `LG_${firm}_${period}_STLINE`;
        const clcardTable = `LG_${firm}_CLCARD`;
        const prclistTable = `LG_${firm}_PRCLIST`;

        const search = req.query.search || '';
        const warehouse = req.query.warehouse || null;

        let itemFilter = `ACTIVE = 0 AND CARDTYPE <> 22`;
        if (search) {
            const s = search.replace(/'/g, "''");
            itemFilter += ` AND (CODE LIKE '%${s}%' OR NAME LIKE '%${s}%')`;
        }

        const invenNo = warehouse ? warehouse : -1;
        const invenFilter = `INVENNO = ${invenNo}`;

        const itemSubQuery = `AND STOCKREF IN (SELECT LOGICALREF FROM ${itemsTable} WHERE ${itemFilter})`;

        // 1. Basic Counts & Aggregations
        // We use ITEMS table as base to ensure consistency with getProducts listing
        // Using OUTER APPLY for price lookup is more performant than correlated subqueries inside SUM
        const countsQuery = `
            SELECT 
                COUNT(*) as totalProducts,
                SUM(CASE WHEN ISNULL(G.ONHAND, 0) > 0 THEN 1 ELSE 0 END) as productsInStock,
                SUM(CASE WHEN ISNULL(G.ONHAND, 0) < 0 THEN 1 ELSE 0 END) as criticalStock,
                SUM(
                    CASE WHEN ISNULL(G.ONHAND, 0) > 0 
                    THEN G.ONHAND * ISNULL(PriceData.PRICE, 0)
                    ELSE 0 
                    END
                ) as totalStockValue
            FROM ${itemsTable} I
            LEFT JOIN ${gntotstTable} G ON G.STOCKREF = I.LOGICALREF AND ${invenFilter}
            OUTER APPLY (
                SELECT TOP 1 PRICE 
                FROM ${prclistTable} P 
                WHERE P.CARDREF = I.LOGICALREF 
                  AND (P.PTYPE = 1 OR P.PTYPE = 2) 
                  AND (P.CLIENTCODE = '' OR P.CLIENTCODE IS NULL)
                ORDER BY CASE WHEN P.PTYPE = 1 THEN 0 ELSE 1 END, P.PRIORITY DESC
            ) PriceData
            WHERE ${itemFilter}
        `;

        // 2. Top Selling By Amount (Ciro)
        const topAmountQuery = `
             SELECT TOP 5
                I.NAME as name,
                SUM(S.TOTAL) as value
             FROM ${stlineTable} S
             JOIN ${itemsTable} I ON S.STOCKREF = I.LOGICALREF
             WHERE S.TRCODE IN (7, 8) AND S.CANCELLED = 0 AND S.LINETYPE = 0
             GROUP BY I.NAME
             ORDER BY value DESC
        `;

        // 3. Top Selling By Quantity (Miktar)
        const topQuantityQuery = `
             SELECT TOP 5
                I.NAME as name,
                SUM(S.AMOUNT) as value
             FROM ${stlineTable} S
             JOIN ${itemsTable} I ON S.STOCKREF = I.LOGICALREF
             WHERE S.TRCODE IN (7, 8) AND S.CANCELLED = 0 AND S.LINETYPE = 0
             GROUP BY I.NAME
             ORDER BY value DESC
        `;

        // 4. Top Accounts By Sales Volume (Cari Dağılımı)
        const topAccountsQuery = `
             SELECT TOP 5
                C.DEFINITION_ as name,
                SUM(S.TOTAL) as value
             FROM ${stlineTable} S
             JOIN ${clcardTable} C ON S.CLIENTREF = C.LOGICALREF
             WHERE S.TRCODE IN (7, 8) AND S.CANCELLED = 0
             GROUP BY C.DEFINITION_
             ORDER BY value DESC
        `;

        const [countsRes, topAmountRes, topQtyRes, topAccountsRes] = await Promise.all([
            sql.query(countsQuery),
            sql.query(topAmountQuery),
            sql.query(topQuantityQuery),
            sql.query(topAccountsQuery)
        ]);

        res.json({
            ...countsRes.recordset[0],
            topByAmount: topAmountRes.recordset,
            topByQuantity: topQtyRes.recordset,
            topAccounts: topAccountsRes.recordset
        });

    } catch (err) {
        console.error('❌ getProductStats Error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

exports.getProductDetails = async (req, res) => {
    try {
        const isDemo = req.headers['x-demo-mode'] === 'true' || (req.user && req.user.role === 'demo');
        const { id } = req.params;
        const warehouse = req.query.warehouse || null;

        if (isDemo) {
            const mockFile = require('path').join(__dirname, '../../data/mock/products.json');
            if (require('fs').existsSync(mockFile)) {
                const products = JSON.parse(require('fs').readFileSync(mockFile, 'utf8'));
                const product = products.find(p => p.id == id) || products[0]; // Fallback to first if not found for robustness in demo

                if (!product) return res.status(404).json({ message: 'Ürün bulunamadı' });

                // Mock Transactions
                const transactions = [
                    { date: '2023-11-20', accountName: 'ABC Market', ficheNo: '001235', type: 'Satış', quantity: 10, unit: 'ADET', price: 150.00, total: 1500.00 },
                    { date: '2023-11-18', accountName: 'Tedarikçi Ltd.', ficheNo: '000987', type: 'Alış', quantity: 50, unit: 'ADET', price: 120.00, total: 6000.00 },
                    { date: '2023-11-15', accountName: 'XYZ Bakkal', ficheNo: '001220', type: 'Satış', quantity: 5, unit: 'ADET', price: 155.00, total: 775.00 },
                ];

                // Mock Warehouses
                const warehouses = [
                    { warehouse: 1, amount: Math.floor(product.stockLevel * 0.7) },
                    { warehouse: 2, amount: Math.floor(product.stockLevel * 0.3) }
                ];

                return res.json({
                    ...product,
                    transactions,
                    warehouses
                });
            }
        }

        const config = getConfig();
        const firm = config.firmNo || '113';
        const period = config.periodNo || '01';
        const itemsTable = `LG_${firm}_ITEMS`;
        const stlineTable = `LG_${firm}_${period}_STLINE`;
        const gntotstTable = `LG_${firm}_${period}_GNTOTST`;

        // 1. Product Info
        const infoQuery = `
            SELECT 
                I.LOGICALREF as id,
                I.CODE as code,
                I.NAME as name,
                I.VAT as vat,
                I.SPECODE as brand,
                I.PRODUCERCODE as producerCode,
                U.CODE as unit
            FROM ${itemsTable} I
            LEFT JOIN LG_${firm}_UNITSETL U ON I.UNITSETREF = U.UNITSETREF AND U.MAINUNIT = 1
            WHERE I.LOGICALREF = ${id}
        `;
        const infoResult = await sql.query(infoQuery);
        if (infoResult.recordset.length === 0) return res.status(404).json({ message: 'Ürün bulunamadı' });
        const productInfo = infoResult.recordset[0];

        // 2. Recent Transactions
        const clcardTable = `LG_${firm}_CLCARD`;
        const stficheTable = `LG_${firm}_${period}_STFICHE`;

        const whFilter = warehouse ? `AND S.SOURCEINDEX = ${warehouse}` : '';

        const transQuery = `
            SELECT TOP 20
                S.DATE_ as date,
                S.TRCODE as trcode,
                (CASE 
                    WHEN S.TRCODE = 25 AND S.IOCODE IN (1, 3) THEN -S.AMOUNT 
                    WHEN S.TRCODE = 25 AND S.IOCODE IN (2, 4) THEN S.AMOUNT
                    WHEN S.IOCODE IN (1, 3) THEN S.AMOUNT 
                    ELSE -S.AMOUNT 
                END) as quantity,
                S.PRICE as price,
                S.TOTAL as total,
                C.DEFINITION_ as accountName,
                S.INVOICEREF as invoiceId,
                F.FICHENO as ficheNo,
                U.CODE as unit,
                CASE 
                    WHEN S.TRCODE = 1 THEN 'Satınalma Faturası'
                    WHEN S.TRCODE = 2 THEN 'Perakende Satış İade'
                    WHEN S.TRCODE = 3 THEN 'Toptan Satış İade'
                    WHEN S.TRCODE = 4 THEN 'Konsinye Çıkış İade'
                    WHEN S.TRCODE = 5 THEN 'Konsinye Giriş İade'
                    WHEN S.TRCODE = 6 THEN 'Satınalma İade'
                    WHEN S.TRCODE = 7 THEN 'Perakende Satış'
                    WHEN S.TRCODE = 8 THEN 'Toptan Satış'
                    WHEN S.TRCODE = 9 THEN 'Konsinye Çıkış'
                    WHEN S.TRCODE = 10 THEN 'Konsinye Giriş'
                    WHEN S.TRCODE = 13 THEN 'Üretimden Giriş'
                    WHEN S.TRCODE = 14 THEN 'Devir'
                    WHEN S.TRCODE = 25 THEN 'Ambar Fişi'
                    WHEN S.TRCODE = 50 THEN 'Sayım Fazlası'
                    WHEN S.TRCODE = 51 THEN 'Sayım Eksiği'
                    ELSE 'Diğer (' + CAST(S.TRCODE AS VARCHAR) + ')'
                END as type,
                S.IOCODE as iocode
            FROM ${stlineTable} S
            LEFT JOIN ${clcardTable} C ON S.CLIENTREF = C.LOGICALREF
            LEFT JOIN ${stficheTable} F ON S.STFICHEREF = F.LOGICALREF
            LEFT JOIN LG_${firm}_UNITSETL U ON S.UOMREF = U.LOGICALREF
            WHERE S.STOCKREF = ${id} AND S.CANCELLED = 0 ${whFilter}
            ORDER BY S.DATE_ DESC
        `;
        const transResult = await sql.query(transQuery);
        const transactions = transResult.recordset.map(t => ({
            ...t,
            date: t.date ? new Date(t.date).toISOString().split('T')[0] : ''
        }));

        // 3. Warehouse Levels
        // If specific warehouse selected, show only that ONE, otherwise show all
        const whLevelFilter = warehouse ? `AND INVENNO = ${warehouse}` : 'AND INVENNO <> -1';

        const warehouseQuery = `
            SELECT 
                INVENNO as warehouse,
                ONHAND as amount
            FROM ${gntotstTable}
            WHERE STOCKREF = ${id} ${whLevelFilter} AND ONHAND <> 0
            ORDER BY INVENNO
        `;
        const whResult = await sql.query(warehouseQuery);

        res.json({
            ...productInfo,
            transactions,
            warehouses: whResult.recordset
        });

    } catch (err) {
        console.error('❌ getProductDetails Error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

exports.getProductOrders = async (req, res) => {
    try {
        const isDemo = req.headers['x-demo-mode'] === 'true' || (req.user && req.user.role === 'demo');
        const { id } = req.params;
        const warehouse = req.query.warehouse || null;

        if (isDemo) {
            // Mock Orders
            const orders = [
                { date: '2023-11-25', orderNo: 'SIP-0056', documentNo: 'DOC-56', accountName: 'ABC Market', quantity: 20, unit: 'ADET', type: 'Alınan Sipariş' },
                { date: '2023-11-22', orderNo: 'SIP-0052', documentNo: 'DOC-52', accountName: 'Mehmet Bakkal', quantity: 10, unit: 'ADET', type: 'Alınan Sipariş' }
            ];
            return res.json(orders);
        }

        const config = getConfig();
        const firm = config.firmNo || '113';
        const period = config.periodNo || '01';
        const orficheTable = `LG_${firm}_${period}_ORFICHE`;
        const orflineTable = `LG_${firm}_${period}_ORFLINE`;
        const clcardTable = `LG_${firm}_CLCARD`;

        // Warehouse Support for Orders: SOURCEINDEX (Verilen Sipariş) or Other logic if needed
        // For orders, usually 'SOURCEINDEX' in ORFLINE indicates the warehouse
        const whOrderFilter = warehouse ? `AND L.SOURCEINDEX = ${warehouse}` : '';

        // Pending (Closed=0) AND Approved (Approve=1)
        const query = `
            SELECT 
                O.DATE_ as date,
                O.FICHENO as orderNo,
                O.DOCODE as documentNo,
                C.DEFINITION_ as accountName,
                (L.AMOUNT - L.SHIPPEDAMOUNT) as quantity,
                U.CODE as unit,
                CASE WHEN O.TRCODE = 1 THEN 'Alınan Sipariş' ELSE 'Verilen Sipariş' END as type
            FROM ${orflineTable} L
            JOIN ${orficheTable} O ON L.ORDFICHEREF = O.LOGICALREF
            JOIN ${clcardTable} C ON O.CLIENTREF = C.LOGICALREF
            LEFT JOIN LG_${firm}_UNITSETL U ON L.UOMREF = U.LOGICALREF
            WHERE L.STOCKREF = ${id} 
              AND L.CLOSED = 0 
              AND L.AMOUNT > L.SHIPPEDAMOUNT -- Sadece sevk edilmemiş miktarı olanlar
              AND O.STATUS = 4
              AND O.TRCODE IN (1, 2)
              ${whOrderFilter}
            ORDER BY O.DATE_ DESC
        `;

        const result = await sql.query(query);
        const orders = result.recordset.map(o => ({
            ...o,
            date: o.date.toISOString().split('T')[0]
        }));

        res.json(orders);

    } catch (err) {
        console.error('❌ getProductOrders Error:', err.message);
        res.status(500).json({ error: err.message });
    }
};
