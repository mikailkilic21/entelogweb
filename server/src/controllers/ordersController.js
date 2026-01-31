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
        const status = req.query.status; // 'proposal', 'approved', 'all'
        const shipmentStatus = req.query.shipmentStatus;
        const search = req.query.search || '';
        // New: Source Filter
        const source = req.query.source; // 'local', 'erp', 'all'(default)

        let orders = [];

        // --- FETCH LOCAL MOCK ORDERS (If source is 'local' or 'all') ---
        if (source !== 'erp') {
            const mockFile = path.join(__dirname, '../../data/mock/orders.json');
            if (fs.existsSync(mockFile)) {
                try {
                    let localOrders = JSON.parse(fs.readFileSync(mockFile, 'utf8'));

                    // Filter local orders by FIRM
                    localOrders = localOrders.filter(o => (o.firm || '113') === firm);

                    // Filter local orders by Status
                    if (status && status !== 'all') {
                        // status: 'proposal' (1) or 'approved' (4)
                        const statusVal = status === 'proposal' ? 1 : 4;
                        localOrders = localOrders.filter(o => o.status === statusVal);
                    }

                    if (search) {
                        const searchLower = search.toLowerCase();
                        localOrders = localOrders.filter(o =>
                            (o.ficheNo && o.ficheNo.toLowerCase().includes(searchLower)) ||
                            (o.accountName && o.accountName.toLowerCase().includes(searchLower))
                        );
                    }

                    // Add standard fields
                    localOrders = localOrders.map(o => ({
                        ...o,
                        shipmentStatus: o.shipmentStatus || 'waiting',
                        isLocal: true,
                        // Ensure amount is consistent (Local netTotal is already Inclusive usually, confirmed by AddOrderModal)
                        amount: o.netTotal
                    }));

                    orders = [...orders, ...localOrders];

                } catch (e) {
                    console.error("Error reading local orders:", e);
                }
            }
        }

        // --- FETCH SQL ORDERS (If source is 'erp' or 'all') ---
        // If source is 'local', skip SQL entirely
        if (source !== 'local') {
            let whereClause = '1=1';

            // 1. Status Filter
            if (status === 'proposal') {
                whereClause += ' AND O.STATUS = 1';
            } else if (status === 'approved') {
                whereClause += ' AND O.STATUS = 4';
            }

            // 2. Shipment Status Filter
            if (status === 'approved' && shipmentStatus && shipmentStatus !== 'all') {
                if (shipmentStatus === 'waiting') {
                    whereClause += ' AND (ISNULL(SStat.TotalQty, 0) = 0 OR ISNULL(SStat.ShippedQty, 0) = 0)';
                } else if (shipmentStatus === 'partial') {
                    whereClause += ' AND (ISNULL(SStat.ShippedQty, 0) > 0 AND ISNULL(SStat.ShippedQty, 0) < SStat.TotalQty)';
                } else if (shipmentStatus === 'closed') {
                    whereClause += ' AND (ISNULL(SStat.TotalQty, 0) > 0 AND ISNULL(SStat.ShippedQty, 0) >= SStat.TotalQty)';
                }
            }

            // 3. Search Filter
            if (search) {
                whereClause += ` AND (O.FICHENO LIKE '%${search}%' OR O.DOCODE LIKE '%${search}%' OR C.DEFINITION_ LIKE '%${search}%')`;
            }

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
                    O.TOTALVAT as totalVat,
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
            const sqlOrders = result.recordset.map(o => ({
                ...o,
                date: o.date ? new Date(o.date).toISOString().split('T')[0] : '',
                // Override netTotal to be Inclusive for the List View
                netTotal: (o.netTotal || 0) + (o.totalVat || 0),
                amount: (o.netTotal || 0) + (o.totalVat || 0)
            }));

            // Merge: Local first, then SQL
            orders = [...orders, ...sqlOrders];
        }

        res.json(orders);

    } catch (err) {
        console.error('❌ getOrders CRITICAL ERROR:', err);
        res.status(500).json({ error: err.message, stack: err.stack });
    }
};

exports.createOrder = async (req, res) => {
    try {
        const orderData = req.body;
        console.log('📝 Saving Order (Local):', orderData.id ? `Update ${orderData.id}` : 'New');

        // Validation
        if (!orderData.customer || !orderData.lines || orderData.lines.length === 0) {
            return res.status(400).json({ error: 'Müşteri ve en az bir ürün gereklidir.' });
        }

        const config = getConfig(); // Get current active firm
        const currentFirm = config.firmNo || '113';

        const mockFile = path.join(__dirname, '../../data/mock/orders.json');
        let orders = [];
        if (fs.existsSync(mockFile)) {
            try {
                orders = JSON.parse(fs.readFileSync(mockFile));
            } catch (e) {
                orders = [];
            }
        }

        if (orderData.id) {
            // --- UPDATE EXISTING ---
            const existingIndex = orders.findIndex(o => String(o.id) === String(orderData.id));
            if (existingIndex > -1) {
                orders[existingIndex] = {
                    ...orders[existingIndex],
                    ...orderData,
                    // Ensure critical mapping is preserved or updated
                    accountName: orderData.customer.name,
                    accountCode: orderData.customer.code,
                    clientRef: orderData.customer.id || orders[existingIndex].clientRef,
                    status: orderData.status || orders[existingIndex].status || 1,
                    note1: orderData.note || '',
                    updatedAt: new Date().toISOString()
                };
                fs.writeFileSync(mockFile, JSON.stringify(orders, null, 2));
                console.log('✅ Order updated locally:', orderData.id);
                return res.json(orders[existingIndex]);
            }
        }

        // --- CREATE NEW ---
        const newOrder = {
            id: Date.now(),
            firm: currentFirm, // Save Firm ID
            ficheNo: orderData.ficheNo || `SIP-${Date.now().toString().slice(-6)}`,
            documentNo: orderData.documentNo || '',
            date: orderData.date || new Date().toISOString().split('T')[0],
            accountName: orderData.customer.name,
            accountCode: orderData.customer.code,
            clientRef: orderData.customer.id,
            netTotal: orderData.netTotal || 0,
            grossTotal: orderData.grossTotal || 0,
            status: orderData.status || 1, // Use provided status or default to 1 (Proposal)
            shipmentStatus: 'waiting',
            lines: orderData.lines,
            note1: orderData.note || '',
            createdAt: new Date().toISOString()
        };

        orders.unshift(newOrder); // Add to beginning
        fs.writeFileSync(mockFile, JSON.stringify(orders, null, 2));

        console.log('✅ Order created locally:', newOrder.ficheNo);
        res.status(201).json(newOrder);

    } catch (error) {
        console.error('❌ createOrder Error:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getOrderDetails = async (req, res) => {
    try {
        const { id } = req.params;

        // 0. Check Local Orders First
        const mockFile = path.join(__dirname, '../../data/mock/orders.json');
        if (fs.existsSync(mockFile)) {
            try {
                const localOrders = JSON.parse(fs.readFileSync(mockFile, 'utf8'));
                // Compare as string to be safe
                const localOrder = localOrders.find(o => String(o.id) === String(id));

                if (localOrder) {
                    console.log('📦 Serving Local Order Details:', id);

                    // Format response to match SQL structure
                    const header = {
                        id: localOrder.id,
                        ficheNo: localOrder.ficheNo,
                        documentNo: localOrder.documentNo,
                        date: localOrder.date, // YYYY-MM-DD
                        note1: localOrder.note1,
                        netTotal: localOrder.netTotal,
                        grossTotal: localOrder.grossTotal,
                        totalVat: localOrder.totalVat || (localOrder.grossTotal * 0.20),
                        totalDiscount: localOrder.totalDiscount || 0,
                        customer: localOrder.accountName,
                        customerCode: localOrder.accountCode,
                        address: '',
                        city: '',
                        town: '',
                        notes: localOrder.note1 ? [{ text: localOrder.note1 }] : []
                    };

                    const lines = localOrder.lines.map((l, idx) => ({
                        id: idx + 1,
                        code: l.code,
                        name: l.name,
                        quantity: l.quantity,
                        unit: l.unit,
                        price: l.price,
                        vatRate: 20,
                        vatAmount: l.total * 0.2,
                        total: l.total,
                        discount: l.discountRate ? (l.quantity * l.price * l.discountRate / 100) : 0,
                        shippedAmount: 0
                    }));

                    return res.json({ header, lines });
                }
            } catch (e) {
                console.error("Error reading local order details:", e);
            }
        }

        // 1. SQL Fetch (Existing Logic)
        const config = getConfig();
        const firm = config.firmNo || '113';
        const period = config.periodNo || '01';
        const orficheTable = `LG_${firm}_${period}_ORFICHE`;
        const orflineTable = `LG_${firm}_${period}_ORFLINE`;
        const itemsTable = `LG_${firm}_ITEMS`;
        const unitsetlTable = `LG_${firm}_UNITSETL`;
        const clcardTable = `LG_${firm}_CLCARD`;

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

exports.deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const mockFile = path.join(__dirname, '../../data/mock/orders.json');

        if (fs.existsSync(mockFile)) {
            let orders = JSON.parse(fs.readFileSync(mockFile, 'utf8'));
            const initialLength = orders.length;

            orders = orders.filter(o => String(o.id) !== String(id));

            if (orders.length < initialLength) {
                fs.writeFileSync(mockFile, JSON.stringify(orders, null, 2));
                console.log(`🗑️ Deleted local order: ${id}`);
                return res.json({ message: 'Sipariş silindi.' });
            }
        }

        // If not found in local, normally we would try SQL, but let's restrict to local for now
        // or return 404 if we only allow deleting local test orders.
        // Given the context of "Sipariş Girişi" task, we are likely dealing with the temporary local orders.
        res.status(404).json({ error: 'Sipariş bulunamadı veya silinemez (SQL siparişi).' });

    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ error: 'Silme işleminde hata oluştu.' });
    }
};
