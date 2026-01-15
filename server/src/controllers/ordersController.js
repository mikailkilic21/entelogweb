const { sql, getConfig } = require('../config/db');

exports.getOrders = async (req, res) => {
    try {
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
        const shipmentStatus = req.query.shipmentStatus; // 'S' (Sevk Bekliyor), 'B' (Kısmi), 'K' (Kapandı)
        const search = req.query.search || '';
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;
        const timePeriod = req.query.period || 'yearly';

        let whereClause = '1=1';

        // 1. Status Filter
        if (status === 'proposal') {
            whereClause += ' AND O.STATUS = 1';
        } else if (status === 'approved') {
            whereClause += ' AND O.STATUS = 4';
        }

        // 2. Date Filter
        if (startDate && endDate) {
            whereClause += ` AND O.DATE_ BETWEEN '${startDate}' AND '${endDate}'`;
        } else {
            const daysMap = { 'daily': 1, 'weekly': 7, 'monthly': 30, 'yearly': 365 };
            const days = daysMap[timePeriod] || 365;
            if (timePeriod === 'daily') {
                whereClause += ` AND O.DATE_ >= CAST(GETDATE() AS DATE)`;
            } else {
                whereClause += ` AND O.DATE_ >= DATEADD(DAY, -${days}, GETDATE())`;
            }
        }

        // 3. Search Filter
        if (search) {
            whereClause += ` AND (O.FICHENO LIKE '%${search}%' OR O.DOCODE LIKE '%${search}%' OR C.DEFINITION_ LIKE '%${search}%')`;
        }

        // Sales Orders only usually (TRCODE=1)
        whereClause += ' AND O.TRCODE = 1';

        // 4. Shipment Status Filter (Only for Approved Orders based on dynamic calculation)
        if (status === 'approved' && shipmentStatus) {
            // Logic:
            // S: ShippedQty = 0
            // B: ShippedQty > 0 AND ShippedQty < TotalQty
            // K: ShippedQty >= TotalQty

            if (shipmentStatus === 'S') {
                whereClause += ' AND (ISNULL(SStat.ShippedQty, 0) = 0)';
            } else if (shipmentStatus === 'B') {
                whereClause += ' AND (ISNULL(SStat.ShippedQty, 0) > 0 AND ISNULL(SStat.ShippedQty, 0) < SStat.TotalQty)';
            } else if (shipmentStatus === 'K') {
                whereClause += ' AND (ISNULL(SStat.ShippedQty, 0) >= SStat.TotalQty)';
            }
        }

        const query = `
            SELECT TOP ${limit}
                O.LOGICALREF as id,
                O.FICHENO as ficheNo,
                O.DOCODE as documentNo,
                O.DATE_ as date,
                C.DEFINITION_ as customer,
                C.CODE as customerCode,
                O.NETTOTAL as amount,
                O.GROSSTOTAL as grossTotal,
                O.STATUS as status,
                CASE 
                    WHEN O.STATUS = 1 THEN '-'
                    WHEN ISNULL(SStat.ShippedQty, 0) = 0 THEN 'S'
                    WHEN ISNULL(SStat.ShippedQty, 0) >= SStat.TotalQty THEN 'K'
                    ELSE 'B'
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

        console.log(`[getOrders] SQL Query: ${query}`);

        const result = await sql.query(query);
        console.log(`[getOrders] Row Count: ${result.recordset.length}`);

        const orders = result.recordset.map(o => ({
            ...o,
            date: o.date ? new Date(o.date).toISOString().split('T')[0] : '',
            statusText: o.status === 1 ? 'Öneri' : 'Onaylı'
        }));

        res.json(orders);

    } catch (err) {
        console.error('❌ getOrders Error:', err.message);
        res.status(500).json({ error: err.message });
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
