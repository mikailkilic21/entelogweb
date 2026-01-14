const { sql, getConfig } = require('../config/db');

exports.getProducts = async (req, res) => {
    try {
        const config = getConfig();
        const firm = config.firmNo || '113';
        const period = config.periodNo || '01';
        const itemsTable = `LG_${firm}_ITEMS`;
        const gntotstTable = `LG_${firm}_${period}_GNTOTST`;
        const stlineTable = `LG_${firm}_${period}_STLINE`;

        const limit = parseInt(req.query.limit) || 50;
        const search = req.query.search || '';
        const sortBy = req.query.sortBy || 'quantity'; // 'quantity' (Sales Qty) or 'amount' (Sales Amount)

        let whereCondition = 'I.ACTIVE = 0'; // Only active products
        if (search) {
            whereCondition += ` AND (I.CODE LIKE '%${search}%' OR I.NAME LIKE '%${search}%')`;
        }

        // Sorting Logic Updated: Sales Quantity or Sales Amount
        let orderByClause = 'salesQuantity DESC';
        if (sortBy === 'amount') {
            orderByClause = 'salesAmount DESC';
        }

        const query = `
            WITH ProductStats AS (
                SELECT
                    I.LOGICALREF as id,
                    I.CODE as code,
                    I.NAME as name,
                    I.VAT as vat,
                    I.SPECODE as brand,
                    U.CODE as unit,
                    -- Stock Level (Keep for display)
                    ISNULL((SELECT SUM(ONHAND) FROM ${gntotstTable} WHERE STOCKREF = I.LOGICALREF AND INVENNO = -1), 0) as stockLevel,
                    -- Sales Quantity (Toplam Satış Miktarı) - TRCODE 7,8 (Perakende/Toptan Satış)
                    ISNULL((SELECT SUM(AMOUNT) FROM ${stlineTable} WHERE STOCKREF = I.LOGICALREF AND TRCODE IN (7, 8) AND LINETYPE = 0 AND CANCELLED = 0), 0) as salesQuantity,
                    -- Sales Amount (Toplam Satış Tutarı)
                    ISNULL((SELECT SUM(TOTAL) FROM ${stlineTable} WHERE STOCKREF = I.LOGICALREF AND TRCODE IN (7, 8) AND LINETYPE = 0 AND CANCELLED = 0), 0) as salesAmount
                FROM ${itemsTable} I
                LEFT JOIN LG_${firm}_UNITSETL U ON I.UNITSETREF = U.UNITSETREF AND U.MAINUNIT = 1
                WHERE ${whereCondition}
            )
            SELECT TOP ${limit} 
                *,
                -- Price is derived from total sales / quantity (Optional, but useful)
                CASE WHEN salesQuantity > 0 THEN salesAmount / salesQuantity ELSE 0 END as avgPrice
            FROM ProductStats
            ORDER BY ${orderByClause}
        `;

        console.log('--- PRODUCT QUERY ---');
        console.log(query);
        const result = await sql.query(query);
        console.log('--- PRODUCT RESULT SAMPLE (First Item) ---');
        console.log(JSON.stringify(result.recordset[0], null, 2));

        res.json(result.recordset);

    } catch (err) {
        console.error('❌ getProducts Error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

exports.getProductStats = async (req, res) => {
    try {
        const config = getConfig();
        const firm = config.firmNo || '113';
        const period = config.periodNo || '01';
        const itemsTable = `LG_${firm}_ITEMS`;
        const gntotstTable = `LG_${firm}_${period}_GNTOTST`;

        const query = `
            SELECT 
                (SELECT COUNT(*) FROM ${itemsTable} WHERE ACTIVE = 0) as totalProducts,
                (SELECT COUNT(*) FROM ${gntotstTable} WHERE ONHAND > 0 AND INVENNO = -1) as productsInStock,
                (SELECT COUNT(*) FROM ${gntotstTable} WHERE ONHAND < 0 AND INVENNO = -1) as criticalStock
        `;

        const result = await sql.query(query);
        res.json(result.recordset[0]);

    } catch (err) {
        console.error('❌ getProductStats Error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

exports.getProductDetails = async (req, res) => {
    try {
        const config = getConfig();
        const firm = config.firmNo || '113';
        const period = config.periodNo || '01';
        const itemsTable = `LG_${firm}_ITEMS`;
        const stlineTable = `LG_${firm}_${period}_STLINE`;
        const gntotstTable = `LG_${firm}_${period}_GNTOTST`;

        const { id } = req.params;

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

        const transQuery = `
            SELECT TOP 20
                S.DATE_ as date,
                S.TRCODE as trcode,
                S.AMOUNT as quantity,
                S.PRICE as price,
                S.TOTAL as total,
                C.DEFINITION_ as accountName,
                S.INVOICEREF as invoiceId,
                F.FICHENO as ficheNo,
                CASE 
                    WHEN S.TRCODE IN (1, 2, 3) THEN 'Alış'
                    WHEN S.TRCODE IN (7, 8) THEN 'Satış'
                    ELSE 'Diğer'
                END as type,
                S.IOCODE as iocode
            FROM ${stlineTable} S
            LEFT JOIN ${clcardTable} C ON S.CLIENTREF = C.LOGICALREF
            LEFT JOIN ${stficheTable} F ON S.STFICHEREF = F.LOGICALREF
            WHERE S.STOCKREF = ${id} AND S.CANCELLED = 0
            ORDER BY S.DATE_ DESC
        `;
        const transResult = await sql.query(transQuery);
        const transactions = transResult.recordset.map(t => ({
            ...t,
            date: t.date ? new Date(t.date).toISOString().split('T')[0] : ''
        }));

        // 3. Warehouse Levels
        const warehouseQuery = `
            SELECT 
                INVENNO as warehouse,
                ONHAND as amount
            FROM ${gntotstTable}
            WHERE STOCKREF = ${id} AND INVENNO <> -1 AND ONHAND <> 0
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
        const config = getConfig();
        const firm = config.firmNo || '113';
        const period = config.periodNo || '01';
        const orficheTable = `LG_${firm}_${period}_ORFICHE`;
        const orflineTable = `LG_${firm}_${period}_ORFLINE`;
        const clcardTable = `LG_${firm}_CLCARD`;

        const { id } = req.params;

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
