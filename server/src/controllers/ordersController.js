const { sql, getConfig } = require('../config/db');
const fs = require('fs');
const path = require('path');

exports.getOrders = async (req, res) => {
    try {
        const isDemo = req.headers['x-demo-mode'] === 'true' || (req.user && req.user.role === 'demo');

        if (isDemo) {
            const mockFile = path.join(__dirname, '../../data/mock/orders.json');
            if (fs.existsSync(mockFile)) {
                console.log('📦 Serving MOCK Orders');
                const data = fs.readFileSync(mockFile, 'utf8');
                return res.json(JSON.parse(data));
            }
        }

        const config = getConfig();
        const firm = config.firmNo || '113';
        const period = config.periodNo || '01';
        const orficheTable = `LG_${firm}_${period}_ORFICHE`;
        const orflineTable = `LG_${firm}_${period}_ORFLINE`;
        const clcardTable = `LG_${firm}_CLCARD`;

        console.log(`[getOrders] Request Params:`, req.query);

        // Filters
        const limit = parseInt(req.query.limit) || 50;
        const status = req.query.status; // 'proposal' (Öneri) or 'approved' (Onaylı)
        const shipmentStatus = req.query.shipmentStatus; // 'waiting', 'partial', 'closed', 'all'
        const search = req.query.search || '';

        // Base Where
        let whereClause = '1=1';

        // 1. Status Filter
        // Logo: 1=Öneri, 2=Sevkedilemez, 4=Onaylı (Siparişleşmiş)
        if (status === 'proposal') {
            whereClause += ' AND O.STATUS = 1';
        } else if (status === 'approved') {
            whereClause += ' AND O.STATUS = 4';
        } else if (status === 'all') {
            // Show all valid orders (exclude cancelled usually, but logic here varies)
        }

        // 2. Shipment Status Filter (Only for Approved Orders typically, but applied generically if requested)
        // We use the aggregation from OUTER APPLY: SStat.TotalQty, SStat.ShippedQty
        if (status === 'approved' && shipmentStatus && shipmentStatus !== 'all') {
            if (shipmentStatus === 'waiting') {
                // Waiting: No quantity to ship OR nothing shipped yet
                whereClause += ' AND (ISNULL(SStat.TotalQty, 0) = 0 OR ISNULL(SStat.ShippedQty, 0) = 0)';
            } else if (shipmentStatus === 'partial') {
                // Partial: Something shipped but less than total (and Total > 0 implied by logic)
                whereClause += ' AND (ISNULL(SStat.ShippedQty, 0) > 0 AND ISNULL(SStat.ShippedQty, 0) < SStat.TotalQty)';
            } else if (shipmentStatus === 'closed') {
                // Closed: Shipped >= Total AND Total > 0 (otherwise it's waiting)
                whereClause += ' AND (ISNULL(SStat.TotalQty, 0) > 0 AND ISNULL(SStat.ShippedQty, 0) >= SStat.TotalQty)';
            }
        }

        // 3. Search Filter
        if (search) {
            whereClause += ` AND (O.FICHENO LIKE '%${search}%' OR O.DOCODE LIKE '%${search}%' OR C.DEFINITION_ LIKE '%${search}%')`;
        }

        // Sales Orders (Verilen Sipariş) or Purchase (Alınan)
        // Usually separate or filtered. Assume Sales (TRCODE=1) for now if not specified? 
        // User asked "Tümü, Öneri, Onaylı", didn't explicitly ask for Sales/Purchase split here but implementation plan said "Type Tabs" in Mobile. 
        // Let's support TRCODE filter if needed, but default to Sales Orders (1) usually. 
        // Wait, user said "Tümü, Öneri, Onaylı" - this is usually for SALES orders in a B2B app context. 
        // I will default to TRCODE=1 (Sales) but allow overriding.
        const trcode = req.query.type === 'purchase' ? 2 : 1;
        whereClause += ` AND O.TRCODE = ${trcode}`;


        const query = `
            SELECT TOP ${limit}
                O.LOGICALREF as id,
                O.FICHENO as ficheNo,
                O.DOCODE as documentNo,
                O.DATE_ as date,
                C.DEFINITION_ as accountName,
                C.CODE as accountCode,
                O.NETTOTAL as netTotal,
                O.GROSSTOTAL as grossTotal,
                O.STATUS as status,
                CASE 
                    WHEN O.STATUS = 1 THEN 'proposal'
                    WHEN SStat.TotalQty IS NULL OR SStat.TotalQty = 0 THEN 'waiting'
                    WHEN ISNULL(SStat.ShippedQty, 0) >= SStat.TotalQty THEN 'closed'
                    WHEN ISNULL(SStat.ShippedQty, 0) > 0 THEN 'partial'
                    ELSE 'waiting'
                END as shipmentStatus
            FROM ${orficheTable} O
            LEFT JOIN ${clcardTable} C ON O.CLIENTREF = C.LOGICALREF
            OUTER APPLY (
                SELECT SUM(AMOUNT) as TotalQty, SUM(SHIPPEDAMOUNT) as ShippedQty
                FROM ${orflineTable} 
                WHERE ORDFICHEREF = O.LOGICALREF AND LINETYPE = 0
            ) SStat
            WHERE ${whereClause}
            ORDER BY O.DATE_ DESC
        `;

        console.log(`[getOrders] Generated Query:`, query);

        const result = await sql.query(query);
        const orders = result.recordset.map(o => ({
            ...o,
            date: o.date ? new Date(o.date).toISOString().split('T')[0] : '',
        }));

        res.json(orders);

    } catch (err) {
        console.error('❌ getOrders CRITICAL ERROR:', err);
        res.status(500).json({ error: err.message, stack: err.stack });
    }
};

exports.getOrderDetails = async (req, res) => {
    try {
        const config = getConfig();
        const firm = config.firmNo || '113';
        const period = config.periodNo || '01';
        const orficheTable = `LG_${firm}_${period}_ORFICHE`;
        const orflineTable = `LG_${firm}_${period}_ORFLINE`;
        const itemsTable = `LG_${firm}_ITEMS`;
        const unitsetlTable = `LG_${firm}_UNITSETL`;
        const clcardTable = `LG_${firm}_CLCARD`;

        const { id } = req.params;

        // 1. Get Order Header
        const headerQuery = `
            SELECT 
                O.LOGICALREF as id,
                O.FICHENO as ficheNo,
                O.DOCODE as documentNo,
                O.DATE_ as date,
                O.GENEXP1 as note1,
                O.GENEXP2 as note2,
                O.NETTOTAL as netTotal,
                O.TOTALDISCOUNTS as totalDiscount,
                O.TOTALVAT as totalVat,
                O.GROSSTOTAL as grossTotal,
                C.DEFINITION_ as customer,
                C.CODE as customerCode,
                C.ADDR1 as address,
                C.CITY as city,
                C.TOWN as town,
                C.TAXNR as taxNumber,
                C.TAXOFFICE as taxOffice,
                C.EMAILADDR as email
            FROM ${orficheTable} O
            LEFT JOIN ${clcardTable} C ON O.CLIENTREF = C.LOGICALREF
            WHERE O.LOGICALREF = ${id}
        `;

        const headerResult = await sql.query(headerQuery);
        if (headerResult.recordset.length === 0) {
            return res.status(404).json({ message: 'Sipariş bulunamadı' });
        }
        const header = headerResult.recordset[0];
        header.date = header.date ? new Date(header.date).toISOString().split('T')[0] : '';

        // 2. Get Order Lines
        const linesQuery = `
            SELECT 
                L.LOGICALREF as id,
                I.CODE as code,
                I.NAME as name,
                L.AMOUNT as quantity,
                L.SHIPPEDAMOUNT as shippedAmount,
                U.CODE as unit,
                L.PRICE as price,
                L.VAT as vatRate,
                L.VATAMNT as vatAmount,
                L.TOTAL as total,
                L.DISTDISC as discount,
                -- Simulated FX Prices for now (In real world, fetch L.PRPRICE or convert)
                L.PRICE * 0.03 as priceUsd, -- Simulated Rate
                L.PRICE * 0.028 as priceEur -- Simulated Rate
            FROM ${orflineTable} L
            JOIN ${itemsTable} I ON L.STOCKREF = I.LOGICALREF
            LEFT JOIN ${unitsetlTable} U ON L.UOMREF = U.LOGICALREF
            WHERE L.ORDFICHEREF = ${id} AND L.LINETYPE = 0
            ORDER BY L.LINENO_
        `;

        const linesResult = await sql.query(linesQuery);
        const lines = linesResult.recordset;

        res.json({
            header,
            lines
        });

    } catch (err) {
        console.error('❌ getOrderDetails Error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

// Get top 5 products from order items
exports.getTopProducts = async (req, res) => {
    try {
        const config = getConfig();
        const firm = config.firmNo || '113';
        const period = config.periodNo || '01';
        const orflineTable = `LG_${firm}_${period}_ORFLINE`;
        const itemsTable = `LG_${firm}_ITEMS`;

        const limit = parseInt(req.query.limit) || 5;

        const query = `
            SELECT TOP ${limit}
                I.CODE as productCode,
                I.NAME as name,
                COUNT(DISTINCT O.LOGICALREF) as count
            FROM ${orflineTable} O
            INNER JOIN ${itemsTable} I ON O.STOCKREF = I.LOGICALREF
            WHERE O.LINETYPE = 0  -- Only product lines
            AND O.CANCELLED = 0   -- Not cancelled
            GROUP BY I.CODE, I.NAME
            ORDER BY count DESC
        `;

        const result = await sql.query(query);
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching top products:', error);
        res.status(500).json({ error: 'Failed to fetch top products' });
    }
};
